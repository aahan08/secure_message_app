const Room = require('../models/Room');
const Message = require('../models/Message');
const { HttpError } = require('../utils/httpError');

exports.getHistory = async (req, res) => {
  const roomId = String(req.params.roomId || '');
  const before = req.query.before ? new Date(req.query.before) : new Date();
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);

  const room = await Room.findOne({
    roomId,
    'members.userId': req.user.id,
    'members.status': 'approved'
  }).select('members').lean();

  if (!room) throw new HttpError(403, 'Not a member');

  const messages = await Message.find({
    roomId,
    createdAt: { $lt: before }
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({ messages: messages.reverse() });
};
