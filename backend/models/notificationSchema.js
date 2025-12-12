const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ["alerte", "systeme", "rappel","avertissement","demande","note","annonce", "material", "emploiDuTemps"], 
    default: "systeme" 
  },
  estLu: { type: Boolean, default: false },

  // 🔗 Lien vers l'utilisateur concerné
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  annoucement: { type: mongoose.Schema.Types.ObjectId, ref: "Announcement", default: null },

}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
