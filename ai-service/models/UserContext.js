// models/UserContext.js
const mongoose = require("mongoose");

const userContextSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profile: {
    interests: [String], // e.g., ['AWS', 'Azure', 'Cloud Computing']
    level: String, // 'beginner', 'intermediate', 'advanced'
    preferredLanguage: { type: String, default: 'fr' },
    learningGoals: [String]
  },
  history: {
    searchedCertifications: [{
      certificationId: mongoose.Schema.Types.ObjectId,
      name: String,
      timestamp: Date,
      frequency: { type: Number, default: 1 }
    }],
    commonQuestions: [String],
    lastTopics: [String]
  },
  preferences: {
    responseStyle: { type: String, default: 'detailed' }, // 'brief', 'detailed'
    receiveRecommendations: { type: Boolean, default: true }
  },
  stats: {
    totalConversations: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    averageSessionDuration: Number,
    lastActive: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserContext', userContextSchema);