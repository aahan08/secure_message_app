const User = require('../models/User');
const { extractBearerToken, verifyAccessToken } = require('../utils/jwt');

function createRequireAuth({ UserModel = User } = {}) {
  return async function requireAuth(req, res, next) {
    try {
      const token = extractBearerToken(req.headers.authorization || '');
      if (!token) {
        return sendUnauthorized(res, 'Missing token');
      }

      const decoded = verifyAccessToken(token);
      const user = await UserModel.findById(decoded.sub).select('_id username tokenVersion');
      if (!user) {
        return sendUnauthorized(res, 'Invalid token');
      }
      if (decoded.tv != null && decoded.tv !== user.tokenVersion) {
        return sendUnauthorized(res, 'Token revoked');
      }

      req.user = { id: user._id.toString(), username: user.username };
      return next();
    } catch (e) {
      return sendUnauthorized(res, 'Unauthorized');
    }
  };
}

function sendUnauthorized(res, message) {
  return res.status(401).json({
    error: {
      message,
      code: 'UNAUTHORIZED'
    }
  });
}

module.exports = {
  createRequireAuth,
  requireAuth: createRequireAuth()
};
