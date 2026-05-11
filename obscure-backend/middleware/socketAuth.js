const { extractBearerToken, verifyAccessToken } = require('../utils/jwt');

function verifySocketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token ||
      extractBearerToken(socket.handshake.headers.authorization || '');
    if (!token) return next(new Error('Missing token'));
    const decoded = verifyAccessToken(token);
    socket.user = { id: decoded.sub, username: decoded.uname };
    next();
  } catch (e) {
    next(new Error('Unauthorized'));
  }
}

module.exports = { verifySocketAuth };
