const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['recharge', 'gift_sent', 'gift_received', 'vehicle_purchase', 'withdrawal',
           'transfer', 'commission', 'bonus', 'task_reward', 'vip_purchase', 'refund'],
    required: true,
  },
  amount: { type: Number, required: true },
  currency: { type: String, enum: ['diamond', 'coin'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'completed' },
  reference: { type: String },
  description: { type: String },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gift: { type: mongoose.Schema.Types.ObjectId, ref: 'Gift' },
  paymentMethod: { type: String },
  paymentId: { type: String },
  balanceBefore: { type: Number },
  balanceAfter: { type: Number },
}, { timestamps: true });

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
