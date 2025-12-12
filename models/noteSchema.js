const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      required: true,
      min: [0, "La note ne peut pas être négative."]
    },
    feedback: {
      type: String,
      default: ""
    },

    // 🔗 Relations
    examen: { type: mongoose.Schema.Types.ObjectId, ref: "Examen", required: true },
    etudiant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    enseignant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);
