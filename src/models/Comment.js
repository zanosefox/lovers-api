const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 1000 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likesCount: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
}, { timestamps: true });

commentSchema.index({ post: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
