const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Invitation', invitationSchema);
