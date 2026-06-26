const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const walletController = require('../controllers/walletController');

router.get('/balance', protect, walletController.getBalance);
router.get('/transactions', protect, walletController.getTransactions);
router.post('/recharge', protect, walletController.recharge);
router.post('/transfer', protect, walletController.transferDiamonds);
router.post('/withdraw', protect, walletController.withdraw);

module.exports = router;
