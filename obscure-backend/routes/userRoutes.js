const express = require('express');
const { register, login, me, exchangeGoogle, setPublicKey, getPublicKey, addFcmToken, removeFcmToken } = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(me));

router.post('/public-key', requireAuth, asyncHandler(setPublicKey));
router.get('/public-key/:username', requireAuth, asyncHandler(getPublicKey)); // for later (fetch others' keys)

// keep both auths for now (optional)
router.post('/google/exchange', asyncHandler(exchangeGoogle));

router.post('/fcm/add', requireAuth, asyncHandler(addFcmToken));
router.post('/fcm/remove', requireAuth, asyncHandler(removeFcmToken));

module.exports = router;
