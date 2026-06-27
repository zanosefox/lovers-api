const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/admin');
const configController = require('../controllers/configController');

router.get('/:key', configController.getConfig);
router.put('/:key', protect, adminAuth('admin', 'super_admin'), configController.setConfig);

module.exports = router;