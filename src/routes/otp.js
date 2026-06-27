const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

router.post('/send', otpController.sendOtp);
router.post('/verify', otpController.verifyOtp);
router.post('/register', otpController.registerWithPhone);

module.exports = router;
