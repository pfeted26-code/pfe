const mongoose = require("mongoose");

const presenceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    statut: {
      type: String,
      required: true,
      enum: ["présent", "absent", "retard"],
      default: "présent",
    },

    // Relations
    seance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seance",
      required: true,
    }, // Séance concernée

    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Étudiant concerné

    enseignant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Presence", presenceSchema);
