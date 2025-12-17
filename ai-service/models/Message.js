// models/Message.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  metadata: {
    intent: String,
    entities: [{
      type: {
        type: String,
        default: 'certification'
      },
      value: String,
      name: String,
      category: String,
      confidence: Number
    }],
    responseTime: Number,
    confidence: Number,
    error: String
  },
  feedback: {
    helpful: Boolean,
    rating: Number,
    comment: String
  }
}, {
  timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
