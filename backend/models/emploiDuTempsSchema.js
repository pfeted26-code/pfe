const mongoose = require("mongoose");

const emploiDuTempsSchema = new mongoose.Schema({
  // Basic info
  titre: { type: String, required: true }, // e.g., "Semaine 1 - Janvier 2024"
  description: { type: String },
  dateDebut: { type: Date, required: true }, // Start of the week
  dateFin: { type: Date, required: true },   // End of the week

  // Relations
  classe: { type: mongoose.Schema.Types.ObjectId, ref: "Classe", required: true },
  seances: [{ type: mongoose.Schema.Types.ObjectId, ref: "Seance" }],

  // Status
  statut: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft"
  },

  // Metadata
  creePar: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notification" }],
}, { timestamps: true });

const EmploiDuTemps = mongoose.model("EmploiDuTemps", emploiDuTempsSchema);
module.exports = EmploiDuTemps;
