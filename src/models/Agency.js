const mongoose = require('mongoose');

const agencySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, maxlength: 1000 },
  logo: { type: String },
  cover: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['member', 'admin', 'owner'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    earnings: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  }],
  totalEarnings: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  memberCount: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  monthlyReports: [{
    month: { type: String },
    year: { type: Number },
    totalEarnings: { type: Number },
    topMembers: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, earnings: Number }],
    createdAt: { type: Date, default: Date.now },
  }],
  tasks: [{
    title: { type: String },
    description: { type: String },
    reward: { type: Number },
    target: { type: Number },
    progress: { type: Number, default: 0 },
    deadline: { type: Date },
    isCompleted: { type: Boolean, default: false },
  }],
}, { timestamps: true });

agencySchema.index({ rank: 1 });
agencySchema.index({ owner: 1 });

module.exports = mongoose.model('Agency', agencySchema);
