const jwt = require('jsonwebtoken');

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }
  return process.env.JWT_SECRET;
}

function signAccessToken(payload, opts = {}) {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: '1h',
    ...opts
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
}

function extractBearerToken(value) {
  if (!value || typeof value !== 'string') return null;
  if (!value.startsWith('Bearer ')) return null;
  const token = value.slice(7).trim();
  return token || null;
}

module.exports = {
  extractBearerToken,
  signAccessToken,
  verifyAccessToken
};
