const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminAuth, serverOwnerOnly } = require('../middleware/admin');
const configController = require('../controllers/configController');

router.get('/:key', configController.getConfig);
router.put('/:key', protect, serverOwnerOnly, configController.setConfig);

module.exports = router;