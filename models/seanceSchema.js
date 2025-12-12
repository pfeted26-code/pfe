const mongoose = require("mongoose");

const seanceSchema = new mongoose.Schema({
  // Nom/identifiant de la séance
  nom: { type: String, default: "" }, // Ex: "Séance 1", "Introduction", etc.
  
  // Schedule info (recurring weekly schedule)
  jourSemaine: {
    type: String,
    enum: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
    required: true
  },
  heureDebut: { type: String, required: true }, // "08:00"
  heureFin: { type: String, required: true },   // "10:00"

  // Location & Type
  salle: { type: String, required: true },
  typeCours: {
    type: String,
    enum: ["Cours Magistral", "TD", "TP", "Exam", "Conference", "CM"],
    required: true
  },

  // Relations
  cours: { type: mongoose.Schema.Types.ObjectId, ref: "Cours", required: true },
  classe: { type: mongoose.Schema.Types.ObjectId, ref: "Classe", required: true },
  enseignant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  emploiDuTemps: { type: mongoose.Schema.Types.ObjectId, ref: "EmploiDuTemps" },

  // References to presence records
  presences: [{ type: mongoose.Schema.Types.ObjectId, ref: "Presence" }],

  // Optional
  notes: { type: String },
  statut: { 
    type: String, 
    enum: ["actif", "annule", "termine"], 
    default: "actif" 
  },
}, { timestamps: true });

const Seance = mongoose.model("Seance", seanceSchema);
module.exports = Seance;