const mongoose = require("mongoose");

const coursSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  credits: { type: Number, required: true },
  semestre: { type: String, required: true },

  // Relations
  classe: { type: mongoose.Schema.Types.ObjectId, ref: "Classe" }, // proposé par une classe
  enseignant: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // enseigné par
  examens: [{ type: mongoose.Schema.Types.ObjectId, ref: "Examen" }], // contient
  presences: [{ type: mongoose.Schema.Types.ObjectId, ref: "Presence" }], // suivi par
  emplois: [{ type: mongoose.Schema.Types.ObjectId, ref: "EmploiDuTemps" }], // planifié dans
  seances: [{ type: mongoose.Schema.Types.ObjectId, ref: "Seance" }], // séances de ce cours
  materials: [{ type: mongoose.Schema.Types.ObjectId, ref: "CourseMaterial" }], // matériels de cours
}, { timestamps: true });

const Cours = mongoose.model("Cours", coursSchema);
module.exports = Cours;
