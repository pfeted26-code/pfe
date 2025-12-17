const mongoose = require("mongoose");

const classeSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique: true },
  annee: { type: Number, required: true },
  specialisation: { type: String, required: true },
  anneeAcademique: { type: String, required: true },

  // Relations
  cours: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cours" }], // propose
  enseignants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  etudiants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // étudiants dans la classe
  examens: [{ type: mongoose.Schema.Types.ObjectId, ref: "Examen" }], // ✅ nouvel ajout : examens liés à la classe
}, { timestamps: true });

/* ===========================================================
   📊 DATABASE INDEXES FOR PERFORMANCE
=========================================================== */
classeSchema.index({ nom: 1 }); // For unique name queries
classeSchema.index({ annee: 1 }); // For year-based queries
classeSchema.index({ specialisation: 1 }); // For specialization queries
classeSchema.index({ anneeAcademique: 1 }); // For academic year queries
classeSchema.index({ annee: 1, specialisation: 1 }); // For combined year and specialization queries
classeSchema.index({ etudiants: 1 }); // For student queries
classeSchema.index({ enseignants: 1 }); // For teacher queries

const Classe = mongoose.model("Classe", classeSchema);
module.exports = Classe;
