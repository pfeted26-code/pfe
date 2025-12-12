// Backend - models/examenSchema.js

const mongoose = require("mongoose");

const examenSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ["assignment", "Assignment", "exam", "Exam", "quiz", "Quiz"]
  },
  date: { type: Date, required: true },
  noteMax: { type: Number, default: 100 },
  description: String,
  duration: Number, // in minutes
  
  // ✅ References
  coursId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Cours",
    required: true 
  },
  enseignantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  classeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Classe" 
  },
  
  // ✅ For assignments - submissions array
  submissions: [{
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true
    },
    file: { 
      type: String,
      required: true
    },
    dateSubmission: { 
      type: Date, 
      default: Date.now 
    },
    note: Number,
    commentaire: String
  }],
  
  // ✅ For exams - grades array
  notes: [{
    etudiant: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    note: Number,
    commentaire: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model("Examen", examenSchema);
