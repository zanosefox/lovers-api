const mongoose = require('mongoose');

const vipSchema = new mongoose.Schema({
  level: { type: Number, required: true, unique: true, min: 1, max: 10 },
  name: { type: String, required: true },
  nameAr: { type: String },
  nameTr: { type: String },
  nameFr: { type: String },
  price: { type: Number, required: true },
  duration: { type: Number, default: 30 },
  color: { type: String, required: true },
  badge: { type: String, required: true },
  frame: { type: String, required: true },
  entryEffect: { type: String },
  benefits: [{ type: String }],
  dailyBonus: { type: Number, default: 0 },
  monthlyBonus: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Vip', vipSchema);
