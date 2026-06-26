const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  uid: { type: String, unique: true, index: true },
  phone: { type: String, sparse: true, index: true },
  email: { type: String, sparse: true },
  password: { type: String },
  displayName: { type: String, required: true, trim: true, maxlength: 30 },
  username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  bio: { type: String, maxlength: 500, default: '' },
  avatar: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other', 'private'], default: 'private' },
  age: { type: Number, min: 13, max: 120 },
  country: { type: String, default: '' },
  language: { type: String, enum: ['ar', 'en', 'tr', 'fr'], default: 'en' },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  rechargeLevel: { type: Number, default: 0 },
  totalRecharged: { type: Number, default: 0 },
  activityLevel: { type: Number, default: 0 },
  activityPoints: { type: Number, default: 0 },
  diamonds: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  friendsCount: { type: Number, default: 0 },
  giftsReceived: { type: Number, default: 0 },
  giftsSent: { type: Number, default: 0 },
  totalGiftsValue: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  isVIP: { type: Boolean, default: false },
  vipLevel: { type: Number, default: 0 },
  vipExpiry: { type: Date },
  badge: { type: String, default: '' },
  badges: [{ type: String }],
  frame: { type: String, default: '' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  vehicleExpiry: { type: Date },
  joinMethod: { type: String, enum: ['google'], required: true },
  googleId: { type: String, sparse: true },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String },
  isDeleted: { type: Boolean, default: false },
  devices: [{
    deviceId: { type: String },
    deviceType: { type: String, enum: ['ios', 'android', 'web'] },
    fcmToken: { type: String },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
  }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  role: { type: String, enum: ['user', 'moderator', 'admin', 'super_admin'], default: 'user' },
  settings: {
    pushNotifications: { type: Boolean, default: true },
    messagePrivacy: { type: String, enum: ['everyone', 'friends', 'nobody'], default: 'everyone' },
    ageRestricted: { type: Boolean, default: false },
  },
  refreshToken: { type: String },
  lastDailyLogin: { type: Date },
  dailyLoginStreak: { type: Number, default: 0 },
  totalLoginDays: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  if (!this.uid) {
    const { v4: uuidv4 } = require('uuid');
    this.uid = `LV${uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase()}`;
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.devices;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
