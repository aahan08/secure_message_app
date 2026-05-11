const Room = require('../models/Room');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const User = require('../models/User');
const { HttpError } = require('../utils/httpError');

function randomAlias() {
  const words = ['Banana', 'Chair', 'Apple', 'Desk', 'Tiger', 'Moon', 'Rocket', 'Stone', 'Piano', 'Cloud'];
  return words[Math.floor(Math.random() * words.length)] + Math.floor(Math.random() * 100);
}

function makePairKey(a, b) {
  const sA = String(a);
  const sB = String(b);
  return sA < sB ? `${sA}|${sB}` : `${sB}|${sA}`;
}

exports.createRoom = async (req, res) => {
  const { codePhrase, durationMinutes } = req.body || {};
  const roomId = nanoid(8);
  const codePhraseHash = codePhrase ? await bcrypt.hash(codePhrase, 10) : null;
  const expiresAt = durationMinutes
    ? new Date(Date.now() + Number(durationMinutes) * 60000)
    : null;

  const alias = randomAlias();
  const room = await Room.create({
    roomId,
    adminId: req.user.id,
    codePhraseHash,
    expiresAt,
    members: [{ userId: req.user.id, alias, status: 'approved' }]
  });

  res.json({ roomId: room.roomId, alias, expiresAt });
};

exports.requestJoin = async (req, res) => {
  const { roomId, codePhrase, joinNote } = req.body || {};
  const room = await Room.findOne({ roomId });
  if (!room) throw new HttpError(404, 'Room not found');
  if (room.expiresAt && room.expiresAt < new Date()) throw new HttpError(400, 'Room expired');

  const typedPhrase = codePhrase ? String(codePhrase).slice(0, 280) : null;
  const existing = room.members.find((m) => String(m.userId) === String(req.user.id));
  if (existing) {
    if (existing.status === 'pending') {
      if (joinNote) existing.joinNote = String(joinNote).slice(0, 280);
      if (typedPhrase) existing.typedPhrase = typedPhrase;
      await room.save();
    }
    return res.json({
      message: existing.status === 'approved' ? 'Already a member' : 'Join request already pending',
      status: existing.status
    });
  }

  const alias = randomAlias();
  room.members.push({
    userId: req.user.id,
    alias,
    status: 'pending',
    joinNote: joinNote ? String(joinNote).slice(0, 280) : null,
    typedPhrase
  });

  await room.save();
  return res.json({ message: 'Join request submitted', status: 'pending', alias });
};

exports.approveMember = async (req, res) => {
  const { roomId, memberId } = req.body || {};
  const room = await Room.findOne({ roomId });
  if (!room) throw new HttpError(404, 'Room not found');
  if (room.adminId.toString() !== req.user.id) throw new HttpError(403, 'Only admin can approve');

  const member = room.members.find((m) => m.userId.toString() === memberId);
  if (!member) throw new HttpError(404, 'Member not found');
  member.status = 'approved';
  member.approvedAt = new Date();
  await room.save();

  res.json({ message: 'Member approved', alias: member.alias });
};

exports.listMyRooms = async (req, res) => {
  const rooms = await Room.find({ 'members.userId': req.user.id })
    .select('roomId type expiresAt members')
    .lean();
  res.json({ rooms });
};

exports.getRoomMembers = async (req, res) => {
  const roomId = String(req.params.roomId || '');
  const room = await Room.findOne({
    roomId,
    'members.userId': req.user.id,
    'members.status': 'approved'
  }).lean();
  if (!room) throw new HttpError(403, 'Not a member');

  const approved = room.members.filter((m) => m.status === 'approved');
  const userIds = approved.map((m) => m.userId);
  const users = await User.find({ _id: { $in: userIds } })
    .select('_id publicKey username')
    .lean();

  const members = approved.map((m) => {
    const u = users.find((x) => String(x._id) === String(m.userId));
    return {
      userId: String(m.userId),
      alias: m.alias,
      username: u?.username || null,
      publicKey: u?.publicKey || null
    };
  });

  res.json({ roomId, members });
};

exports.getRoomInfo = async (req, res) => {
  const roomId = String(req.params.roomId || '');
  const room = await Room.findOne({ roomId }).lean();
  if (!room) throw new HttpError(404, 'Room not found');

  const isMember = room.members.some((m) => String(m.userId) === String(req.user.id));
  if (!isMember) throw new HttpError(403, 'Not a member');

  const isAdmin = String(room.adminId) === String(req.user.id);
  const members = room.members.map((m) => ({
    userId: String(m.userId),
    alias: m.alias,
    status: m.status,
    requestedAt: m.requestedAt || null,
    joinNote: isAdmin ? (m.joinNote || null) : null
  }));

  res.json({
    roomId: room.roomId,
    isAdmin,
    expiresAt: room.expiresAt || null,
    members
  });
};

exports.denyMember = async (req, res) => {
  const { roomId, memberId } = req.body || {};
  const room = await Room.findOne({ roomId });
  if (!room) throw new HttpError(404, 'Room not found');
  if (String(room.adminId) !== String(req.user.id)) throw new HttpError(403, 'Only admin can deny');

  const idx = room.members.findIndex(
    (m) => String(m.userId) === String(memberId) && m.status === 'pending'
  );
  if (idx === -1) throw new HttpError(404, 'Pending member not found');

  room.members.splice(idx, 1);
  await room.save();
  res.json({ message: 'Member denied' });
};

exports.startDm = async (req, res) => {
  const meId = req.user.id;
  const { targetUsername, targetUserId } = req.body || {};
  if (!targetUsername && !targetUserId) {
    throw new HttpError(400, 'Provide targetUsername or targetUserId');
  }

  const target = targetUserId
    ? await User.findById(targetUserId).select('_id').lean()
    : await User.findOne({ username: String(targetUsername).toLowerCase().trim() }).select('_id').lean();

  if (!target) throw new HttpError(404, 'Target user not found');
  if (String(target._id) === String(meId)) throw new HttpError(400, 'Cannot start DM with yourself');

  const pairKey = makePairKey(meId, target._id);
  const existing = await Room.findOne({ type: 'dm', pairKey }).lean();
  if (existing) {
    return res.json({ roomId: existing.roomId, type: 'dm', reused: true });
  }

  try {
    const dm = await Room.create({
      roomId: nanoid(10),
      type: 'dm',
      pairKey,
      adminId: meId,
      members: [
        { userId: meId, alias: randomAlias(), status: 'approved', approvedAt: new Date() },
        { userId: target._id, alias: randomAlias(), status: 'approved', approvedAt: new Date() }
      ]
    });
    return res.json({ roomId: dm.roomId, type: 'dm', reused: false });
  } catch (e) {
    if (e.code === 11000) {
      const dm = await Room.findOne({ type: 'dm', pairKey }).lean();
      if (dm) return res.json({ roomId: dm.roomId, type: 'dm', reused: true });
    }
    throw e;
  }
};
