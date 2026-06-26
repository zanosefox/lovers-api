const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['follow', 'like', 'comment', 'gift', 'friend_request', 'room_invite',
           'vip_upgrade', 'level_up', 'achievement', 'system', 'admin', 'agency'],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String },
  data: { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  image: { type: String },
  actionUrl: { type: String },
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
