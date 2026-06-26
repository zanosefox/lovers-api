const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String },
  nameTr: { type: String },
  nameFr: { type: String },
  type: {
    type: String,
    enum: ['daily_login', 'active_hours', 'send_gift', 'join_room', 'invite_friend',
           'post_comment', 'share_post', 'follow_user'],
    required: true,
  },
  description: { type: String },
  reward: { type: Number, required: true },
  rewardType: { type: String, enum: ['xp', 'diamond', 'coin'], default: 'xp' },
  target: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  resetType: { type: String, enum: ['daily', 'weekly', 'monthly', 'once'], default: 'daily' },
  userProgress: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    progress: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    lastReset: { type: Date },
  }],
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
