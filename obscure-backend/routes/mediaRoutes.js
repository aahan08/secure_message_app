const express = require('express');
const router = express.Router();
const { getUploadUrl, getDownloadUrl } = require('../controllers/mediaController');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

router.post('/upload-url', requireAuth, asyncHandler(getUploadUrl));
router.get('/download-url', requireAuth, asyncHandler(getDownloadUrl));

module.exports = router;
