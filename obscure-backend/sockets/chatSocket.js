const Room = require('../models/Room');
const Message = require('../models/Message');
const { verifySocketAuth } = require('../middleware/socketAuth');
const { pushToRoomMembers } = require('../services/pushService');

function userRoom(userId) {
  return `user:${String(userId)}`;
}

async function joinApprovedRooms(socket) {
  const userId = socket.user.id;
  const rooms = await Room.find({
    'members.userId': userId,
    'members.status': 'approved'
  })
    .select('roomId')
    .lean();

  socket.join(userRoom(userId));
  rooms.forEach((room) => socket.join(room.roomId));
}

async function ensureMembership(roomId, userId) {
  const room = await Room.findOne({ roomId }).lean();
  if (!room) return { ok: false, error: 'Room not found' };

  const me = room.members?.find(
    (member) => String(member.userId) === String(userId) && member.status === 'approved'
  );
  if (!me) return { ok: false, error: 'Not a member' };

  return {
    ok: true,
    room,
    senderAlias: me.alias,
    approvedMembers: room.members.filter((member) => member.status === 'approved')
  };
}

module.exports.initChatSocket = (io) => {
  io.use((socket, next) => verifySocketAuth(socket, next));

  io.on('connection', async (socket) => {
    const userId = socket.user.id;

    try {
      await joinApprovedRooms(socket);
    } catch (e) {
      console.error('joinApprovedRooms error', e.message);
    }

    socket.on('rooms:join', async ({ roomId }, ack) => {
      try {
        const { ok, error } = await ensureMembership(roomId, userId);
        if (!ok) return ack?.({ ok: false, error });
        socket.join(roomId);
        socket.join(userRoom(userId));
        return ack?.({ ok: true });
      } catch (e) {
        return ack?.({ ok: false, error: 'Server error' });
      }
    });

    socket.on('message:send', async (payload, ack) => {
      try {
        const { roomId, ciphertext, keyEnvelope, iv, type, fileUrl, fileKey, fileMime } = payload || {};
        if (!roomId || !Array.isArray(keyEnvelope) || keyEnvelope.length === 0) {
          return ack?.({ ok: false, error: 'Invalid payload' });
        }

        const { ok, error, room, senderAlias, approvedMembers } = await ensureMembership(roomId, userId);
        if (!ok) return ack?.({ ok: false, error });

        const doc = await Message.create({
          roomId,
          senderId: userId,
          alias: senderAlias,
          type: type || 'text',
          ciphertext: ciphertext || null,
          iv: iv || null,
          keyEnvelope,
          fileUrl: fileUrl || null,
          fileKey: fileKey || null,
          fileMime: fileMime || null
        });

        for (const member of approvedMembers) {
          const entry = keyEnvelope.find((item) => String(item.userId) === String(member.userId));
          io.to(userRoom(member.userId)).emit('message:new', {
            _id: String(doc._id),
            roomId,
            alias: senderAlias,
            senderId: String(userId),
            type: doc.type || 'text',
            createdAt: doc.createdAt,
            iv: doc.iv,
            ciphertext: doc.ciphertext,
            encKey: entry ? entry.encKey : null,
            fileUrl: doc.fileUrl || null,
            fileKey: doc.fileKey || null,
            fileMime: doc.fileMime || null
          });
        }

        pushToRoomMembers({ room, senderId: userId, roomId }).catch((e) => {
          console.error('pushToRoomMembers error', e.message);
        });

        return ack?.({
          ok: true,
          id: String(doc._id),
          createdAt: doc.createdAt
        });
      } catch (e) {
        console.error('message:send error', e);
        return ack?.({ ok: false, error: 'Server error' });
      }
    });
  });
};
