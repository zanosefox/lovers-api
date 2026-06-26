const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

router.post('/social-login', authController.socialLogin);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', protect, authController.logout);

module.exports = router;
