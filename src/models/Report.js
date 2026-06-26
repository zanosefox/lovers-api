const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['user', 'room', 'post', 'message', 'agency'], required: true },
  target: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true },
  description: { type: String, maxlength: 1000 },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String },
  resolvedAt: { type: Date },
}, { timestamps: true });

reportSchema.index({ status: 1 });
reportSchema.index({ targetType: 1, target: 1 });

module.exports = mongoose.model('Report', reportSchema);
