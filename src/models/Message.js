const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  type: { type: String, enum: ['text', 'image', 'gif', 'audio', 'system'], default: 'text' },
  content: { type: String, maxlength: 5000 },
  media: { type: String },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isSystem: { type: Boolean, default: false },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  translatedContent: { type: String },
}, { timestamps: true });

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ isRead: 1 });

module.exports = mongoose.model('Message', messageSchema);
