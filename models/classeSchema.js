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

const Classe = mongoose.model("Classe", classeSchema);
module.exports = Classe;
