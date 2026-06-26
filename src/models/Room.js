const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  description: { type: String, maxlength: 500, default: '' },
  roomType: {
    type: String,
    enum: ['public', 'private', 'vip', 'agency'],
    default: 'public',
  },
  password: { type: String },
  category: { type: String, default: 'general' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coOwners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxSeats: { type: Number, default: 12, max: 20 },
  seats: [{
    seatNumber: { type: Number },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isMuted: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    isSpeaking: { type: Boolean, default: false },
    joinedAt: { type: Date },
  }],
  listeners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  isRecording: { type: Boolean, default: false },
  agoraChannel: { type: String, unique: true },
  agoraToken: { type: String },
  background: { type: String, default: '' },
  entryEffect: { type: String, default: '' },
  exitEffect: { type: String, default: '' },
  announcements: [{ message: String, createdAt: Date, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
  adminLogs: [{
    action: String,
    target: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    details: String,
  }],
  eventLogs: [{
    event: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  }],
  totalMessages: { type: Number, default: 0 },
  peakUsers: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  tags: [{ type: String }],
}, { timestamps: true });

roomSchema.index({ roomType: 1, isActive: 1 });
roomSchema.index({ owner: 1 });
roomSchema.index({ 'seats.user': 1 });

module.exports = mongoose.model('Room', roomSchema);
