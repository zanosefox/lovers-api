const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String },
  nameTr: { type: String },
  nameFr: { type: String },
  type: { type: String, enum: ['special', 'achievement', 'vip', 'event', 'agency'], required: true },
  image: { type: String, required: true },
  description: { type: String },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  condition: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Badge', badgeSchema);
