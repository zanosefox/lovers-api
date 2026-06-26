const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

exports.getVehicles = async (req, res) => {
  try {
    const { type, rarity } = req.query;
    const query = { isActive: true };
    if (type) query.type = type;
    if (rarity) query.rarity = rarity;

    const vehicles = await Vehicle.find(query).sort({ order: 1 });
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get vehicles' });
  }
};

exports.purchaseVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.body;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const user = await User.findById(req.user._id);
    if (user.diamonds < vehicle.price) {
      return res.status(400).json({ success: false, message: 'Insufficient diamonds' });
    }

    user.diamonds -= vehicle.price;
    user.vehicle = vehicleId;
    user.vehicleExpiry = new Date(Date.now() + vehicle.duration * 24 * 60 * 60 * 1000);
    await user.save();

    await Transaction.create({
      user: user._id,
      type: 'vehicle_purchase',
      amount: vehicle.price,
      currency: 'diamond',
      description: `Purchased vehicle: ${vehicle.name}`,
    });

    res.json({ success: true, message: 'Vehicle purchased', vehicle, expiresAt: user.vehicleExpiry });
  } catch (error) {
    logger.error(`Purchase vehicle error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to purchase vehicle' });
  }
};
