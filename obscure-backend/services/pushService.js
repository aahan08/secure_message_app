const firebaseAdmin = require('../config/firebase');
const User = require('../models/User');

let warnedMissingFirebase = false;

async function pushToRoomMembers({ room, senderId, roomId }) {
  if (!firebaseAdmin) {
    if (!warnedMissingFirebase) {
      console.warn('Skipping push notifications because Firebase Admin is not configured');
      warnedMissingFirebase = true;
    }
    return;
  }

  const recipientIds = room.members
    .map((m) => String(m.userId))
    .filter((uid) => uid !== String(senderId));
  if (!recipientIds.length) return;

  const users = await User.find({ _id: { $in: recipientIds } }).select('fcmTokens').lean();
  const tokens = [];

  for (const user of users) {
    for (const item of user.fcmTokens || []) {
      const token = typeof item === 'string' ? item : item?.token;
      if (token) tokens.push(token);
    }
  }

  if (!tokens.length) return;

  const response = await firebaseAdmin.messaging().sendEachForMulticast({
    tokens,
    data: { type: 'message', roomId: String(roomId) },
    notification: { title: 'New message', body: 'Tap to open' },
    android: { priority: 'high', notification: { channelId: 'messages' } },
    apns: { headers: { 'apns-priority': '10' } }
  });

  const invalid = [];
  response.responses.forEach((result, index) => {
    if (!result.success) {
      const code = result.error?.code || '';
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        invalid.push(tokens[index]);
      }
    }
  });

  if (invalid.length) {
    await User.updateMany(
      { _id: { $in: recipientIds } },
      { $pull: { fcmTokens: { $in: invalid } } }
    );
    await User.updateMany(
      { _id: { $in: recipientIds } },
      { $pull: { fcmTokens: { token: { $in: invalid } } } }
    );
  }
}

module.exports = { pushToRoomMembers };
