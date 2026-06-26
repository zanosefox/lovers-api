const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const vehicleController = require('../controllers/vehicleController');

router.get('/', protect, vehicleController.getVehicles);
router.post('/purchase', protect, vehicleController.purchaseVehicle);

module.exports = router;
