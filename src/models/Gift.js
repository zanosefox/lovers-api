const mongoose = require('mongoose');

const giftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String },
  nameTr: { type: String },
  nameFr: { type: String },
  description: { type: String },
  type: {
    type: String,
    enum: ['normal', 'animated', '3d', 'fullscreen', 'rare', 'legendary', 'entry'],
    required: true,
  },
  image: { type: String, required: true },
  animation: { type: String },
  price: { type: Number, required: true },
  diamonds: { type: Number, required: true },
  category: { type: String, enum: ['hot', 'new', 'vip', 'exclusive'], default: 'normal' },
  isActive: { type: Boolean, default: true },
  isLimited: { type: Boolean, default: false },
  limitCount: { type: Number },
  soldCount: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  effects: {
    sound: { type: String },
    animation: { type: String },
    duration: { type: Number },
    fullScreen: { type: Boolean, default: false },
  },
}, { timestamps: true });

giftSchema.index({ type: 1, isActive: 1 });
giftSchema.index({ category: 1 });

module.exports = mongoose.model('Gift', giftSchema);
