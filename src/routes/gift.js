const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const giftController = require('../controllers/giftController');

router.get('/', protect, giftController.getGifts);
router.post('/send', protect, giftController.sendGift);

module.exports = router;
