const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: true,
      trim: true,
    },
    contenu: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "urgent", "success", "event", "maintenance"],
      default: "info",
    },
    priorite: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // 🎯 SYSTÈME DE CIBLAGE COMPLET
    destinataires: {
      type: String,
      enum: [
        "all",              // Tous les utilisateurs
        "students",         // Tous les étudiants
        "teachers",         // Tous les enseignants
        "admins",          // Tous les admins
        "specific_users",  // Utilisateurs spécifiques
        "specific_classes", // Classes spécifiques
        "multiple_roles"   // Combinaison de rôles
      ],
      default: "all",
    },

    // Pour "specific_users"
    utilisateursSpecifiques: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],

    // Pour "specific_classes"
    classesSpecifiques: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classe",
    }],

    // Pour "multiple_roles" (ex: students + teachers)
    rolesMultiples: [{
      type: String,
      enum: ["etudiant", "enseignant", "admin"],
    }],

    // Date d'expiration
    dateExpiration: {
      type: Date,
      default: null,
    },

    estActif: {
      type: Boolean,
      default: true,
    },

    estEpingle: {
      type: Boolean,
      default: false,
    },

    pieceJointe: {
      type: String,
      default: null,
    },

    // 🔗 RELATION AVEC LES NOTIFICATIONS CRÉÉES
    notifications: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
    }],

    // Suivi des vues
    vues: [{
      utilisateur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      dateVue: {
        type: Date,
        default: Date.now,
      },
    }],

    // Statistiques
    nombreVues: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
announcementSchema.index({ auteur: 1, createdAt: -1 });
announcementSchema.index({ destinataires: 1, estActif: 1 });
announcementSchema.index({ dateExpiration: 1 });
announcementSchema.index({ estEpingle: -1, createdAt: -1 });

// Méthode pour vérifier si l'annonce est expirée
announcementSchema.methods.isExpired = function() {
  if (!this.dateExpiration) return false;
  return new Date() > this.dateExpiration;
};

// Méthode pour vérifier si un utilisateur peut voir cette annonce
announcementSchema.methods.canUserView = function(user) {
  if (!this.estActif || this.isExpired()) return false;

  switch (this.destinataires) {
    case "all":
      return true;

    case "students":
      return user.role === "etudiant";

    case "teachers":
      return user.role === "enseignant";

    case "admins":
      return user.role === "admin";

    case "specific_users":
      return this.utilisateursSpecifiques.some(
        id => id.toString() === user._id.toString()
      );

    case "specific_classes":
      return this.classesSpecifiques.some(
        id => id.toString() === user.classe?.toString()
      );

    case "multiple_roles":
      return this.rolesMultiples.includes(user.role);

    default:
      return false;
  }
};

module.exports = mongoose.model("Announcement", announcementSchema);
