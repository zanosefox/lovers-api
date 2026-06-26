const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  media: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], required: true },
  duration: { type: Number, default: 24 },
  viewers: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, viewedAt: { type: Date, default: Date.now } }],
  viewerCount: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  expiresAt: { type: Date },
}, { timestamps: true });

storySchema.index({ user: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', storySchema);
