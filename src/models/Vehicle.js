const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String },
  nameTr: { type: String },
  nameFr: { type: String },
  type: { type: String, enum: ['car', 'plane', 'yacht', 'legendary'], required: true },
  image: { type: String, required: true },
  animation: { type: String },
  price: { type: Number, required: true },
  duration: { type: Number, default: 30 },
  isActive: { type: Boolean, default: true },
  isLimited: { type: Boolean, default: false },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
