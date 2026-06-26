const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, maxlength: 2000 },
  media: [{
    type: { type: String, enum: ['image', 'video'] },
    url: { type: String },
    thumbnail: { type: String },
  }],
  hashtags: [{ type: String }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 },
  isNSFW: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  visibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ isFeatured: 1, createdAt: -1 });
postSchema.index({ likesCount: -1 });

module.exports = mongoose.model('Post', postSchema);
