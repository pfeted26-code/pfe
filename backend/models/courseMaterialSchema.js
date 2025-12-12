const mongoose = require("mongoose");

const courseMaterialSchema = new mongoose.Schema({
  titre: { type: String, required: true },

  // PDF, PPT, DOCX, VIDEO, etc.
  type: { 
    type: String, 
    enum: ["pdf", "ppt", "doc", "docx", "video", "other"], 
    default: "pdf" 
  },

  // File name returned by Multer (string only)
  fichier: { type: String, required: true }, // ex: "chapter1.pdf"

  description: { type: String },

  // Which course this file belongs to
  coursId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Cours",
    required: true 
  },

  // Optional: who uploaded it
  enseignantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

module.exports = mongoose.model("CourseMaterial", courseMaterialSchema);
