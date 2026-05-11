const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { signAccessToken } = require('../utils/jwt');
const { HttpError } = require('../utils/httpError');

const SALT_ROUNDS = 12;

exports.register = async (req, res) => {
  let { username, password } = req.body || {};
  if (!username || !password) throw new HttpError(400, 'username & password required');
  username = String(username).toLowerCase().trim();

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    throw new HttpError(400, 'Invalid username format');
  }
  if (String(password).length < 10) {
    throw new HttpError(400, 'Password too short (min 10 chars)');
  }

  const exists = await User.findOne({ username }).lean();
  if (exists) throw new HttpError(409, 'Username already taken');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ username, passwordHash });

  const token = signAccessToken({ sub: user._id.toString(), uname: username, tv: user.tokenVersion });
  res.status(201).json({ token, user: { id: user._id, username: user.username } });
};

exports.login = async (req, res) => {
  let { username, password } = req.body || {};
  if (!username || !password) throw new HttpError(400, 'username & password required');
  username = String(username).toLowerCase().trim();

  const user = await User.findOne({ username });
  if (!user) throw new HttpError(401, 'Invalid credentials');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid credentials');

  const token = signAccessToken({ sub: user._id.toString(), uname: username, tv: user.tokenVersion });
  res.json({ token, user: { id: user._id, username: user.username } });
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

exports.exchangeGoogle = async (req, res) => {
  const firebaseAdmin = require('../config/firebase');
  if (!firebaseAdmin) throw new HttpError(503, 'Firebase not configured');

  const { idToken } = req.body || {};
  if (!idToken) throw new HttpError(400, 'idToken required');

  let decoded;
  try {
    decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
  } catch (e) {
    throw new HttpError(401, 'Invalid Google token');
  }

  const username = (decoded.email || decoded.uid).split('@')[0].toLowerCase();
  let user = await User.findOne({ username });
  if (!user) {
    user = await User.create({
      username,
      passwordHash: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), SALT_ROUNDS)
    });
  }

  const token = signAccessToken({ sub: user._id.toString(), uname: username, tv: user.tokenVersion });
  res.json({ token, user: { id: user._id, username: user.username } });
};

exports.setPublicKey = async (req, res) => {
  const { publicKey } = req.body || {};

  if (!publicKey || typeof publicKey !== 'string' || publicKey.length < 100) {
    throw new HttpError(400, 'Invalid publicKey');
  }

  const fingerprint = crypto.createHash('sha256')
    .update(Buffer.from(publicKey, 'base64'))
    .digest('hex');
  console.log('public key updated', { userId: req.user.id, fingerprint });

  await User.updateOne({ _id: req.user.id }, { $set: { publicKey } });
  return res.json({ ok: true });
};

exports.getPublicKey = async (req, res) => {
  const username = String(req.params.username || '').toLowerCase().trim();
  const other = await User.findOne({ username }).select('publicKey username').lean();
  if (!other || !other.publicKey) throw new HttpError(404, 'Not found');
  return res.json({ username: other.username, publicKey: other.publicKey });
};

exports.addFcmToken = async (req, res) => {
  const { token, deviceId, platform } = req.body || {};
  if (!token) throw new HttpError(400, 'token required');

  await User.updateOne({ _id: req.user.id }, { $pull: { fcmTokens: token } });
  await User.updateOne({ _id: req.user.id }, { $pull: { fcmTokens: { token } } });
  const result = await User.updateOne(
    { _id: req.user.id },
    {
      $push: {
        fcmTokens: {
          token,
          deviceId: deviceId || null,
          platform: platform || 'android',
          createdAt: new Date(),
          lastActiveAt: new Date()
        }
      }
    }
  );
  if (result.matchedCount === 0) throw new HttpError(404, 'user not found');
  res.json({ ok: true });
};

exports.removeFcmToken = async (req, res) => {
  const { token } = req.body || {};
  if (!token) throw new HttpError(400, 'token required');

  await User.updateOne({ _id: req.user.id }, { $pull: { fcmTokens: token } });
  await User.updateOne({ _id: req.user.id }, { $pull: { fcmTokens: { token } } });

  res.json({ ok: true });
};
