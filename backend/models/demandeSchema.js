const mongoose = require("mongoose");

const demandeSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ["attestation_presence", "attestation_inscription", "attestation_reussite", "releve de notes","stage" , "autre"],
  },
  statut: { 
    type: String, 
    required: true, 
    enum: ["en_attente", "approuvee", "rejete"],
    default: "en_attente"
  },
  description: { type: String },

  
  // Relations
  etudiant: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // effectue
}, { timestamps: true });

const Demande = mongoose.model("Demande", demandeSchema);
module.exports = Demande;
