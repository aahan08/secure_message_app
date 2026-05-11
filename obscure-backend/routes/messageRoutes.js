const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getHistory } = require('../controllers/messageController');
const router = express.Router();

router.get('/:roomId', requireAuth, asyncHandler(getHistory));

module.exports = router;
