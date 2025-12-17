// models/Conversation.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  metadata: {
    totalMessages: { type: Number, default: 0 },
    lastMessageAt: Date,
    topics: [String], // e.g., ['AWS', 'pricing', 'difficulty']
    sentiment: String // 'positive', 'neutral', 'negative'
  }
}, {
  timestamps: true
});

// Index for efficient queries
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ status: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
