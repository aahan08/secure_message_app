const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');
const {
  createRoom, requestJoin, approveMember, listMyRooms, getRoomMembers, getRoomInfo, denyMember, startDm
} = require('../controllers/roomController');

const router = express.Router();

router.post('/create', requireAuth, asyncHandler(createRoom));
router.post('/join', requireAuth, asyncHandler(requestJoin));
router.post('/approve', requireAuth, asyncHandler(approveMember));
router.get('/mine', requireAuth, asyncHandler(listMyRooms));
router.get('/:roomId/members', requireAuth, asyncHandler(getRoomMembers));
router.post('/deny', requireAuth, asyncHandler(denyMember));
router.get('/:roomId/info', requireAuth, asyncHandler(getRoomInfo));
// start DM
router.post('/dm/start', requireAuth, asyncHandler(startDm));

module.exports = router;
