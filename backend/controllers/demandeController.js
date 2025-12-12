const Demande = require("../models/demandeSchema");
const User = require("../models/userSchema");
const Notification = require("../models/notificationSchema");

/* ===========================================================
   🟢 CREATE DEMANDE — Étudiant crée une demande
=========================================================== */
module.exports.createDemande = async (req, res) => {
  try {
    const { nom, type, etudiant , description } = req.body;

    if (!nom || !type || !etudiant) {
      return res.status(400).json({ message: "Nom, type et étudiant sont obligatoires." });
    }

    // Vérification que l’étudiant existe bien
    const student = await User.findById(etudiant);
    if (!student || student.role !== "etudiant") {
      return res.status(404).json({ message: "Étudiant introuvable ou rôle invalide." });
    }

    // Création de la demande
    const newDemande = await Demande.create({
      nom,
      type,
      etudiant,
      description,
      statut: "en_attente",
    });

    // Ajout de la demande dans la liste de l’étudiant
    await User.findByIdAndUpdate(etudiant, {
      $addToSet: { demandes: newDemande._id },
    });

    /* ===========================================================
       📢 NOTIFICATIONS POUR LES ADMINS
    ============================================================ */
    const admins = await User.find({ role: "admin" });
    const io = req.io || req.app?.get("io");
    const message = `📄 ${student.prenom} ${student.nom} a demandé une ${nom}.`;

    for (const admin of admins) {
      const notif = await Notification.create({
        message,
        type: "demande",
        utilisateur: admin._id,
      });

      await User.findByIdAndUpdate(admin._id, {
        $push: { notifications: notif._id },
      });

      // Émission en temps réel (si connecté)
      if (io) {
        io.to(admin._id.toString()).emit("receiveNotification", {
          message,
          type: "demande",
          date: new Date(),
        });
      }
    }

    res.status(201).json({
      message: "Demande créée avec succès ✅",
      demande: newDemande,
    });
  } catch (error) {
    console.error("❌ Erreur createDemande:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔵 GET ALL DEMANDES
=========================================================== */
module.exports.getAllDemandes = async (req, res) => {
  try {
    const demandes = await Demande.find()
      .populate("etudiant", "prenom nom email classe")
      .sort({ createdAt: -1 });

    res.status(200).json(demandes);
  } catch (error) {
    console.error("❌ Erreur getAllDemandes:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
/* ===========================================================
   🔵 GET ALL DEMANDES D’UN UTILISATEUR (ÉTUDIANT)
=========================================================== */
module.exports.getDemandesByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user || user.role !== "etudiant") {
      return res.status(404).json({ message: "Étudiant introuvable." });
    }

    // Récupérer toutes les demandes de l'étudiant
    const demandes = await Demande.find({ etudiant: userId })
      .sort({ createdAt: -1 });

    res.status(200).json(demandes);
  } catch (error) {
    console.error("❌ Erreur getDemandesByUser:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET DEMANDE BY ID
=========================================================== */
module.exports.getDemandeById = async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id)
      .populate("etudiant", "prenom nom email classe");

    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable." });
    }

    res.status(200).json(demande);
  } catch (error) {
    console.error("❌ Erreur getDemandeById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🟠 UPDATE DEMANDE — Admin change le statut
=========================================================== */
module.exports.updateDemande = async (req, res) => {
  try {
    const { statut } = req.body;

    // Vérification du statut
    if (!["en_attente", "approuvee", "rejete"].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide." });
    }

    // Mise à jour de la demande
    const updatedDemande = await Demande.findByIdAndUpdate(
      req.params.id,
      { statut },
      { new: true }
    ).populate("etudiant", "prenom nom");

    if (!updatedDemande) {
      return res.status(404).json({ message: "Demande introuvable." });
    }

    const etu = updatedDemande.etudiant;
    const io = req.io || req.app?.get("io");

    // Message selon le statut
    let message;
    switch (statut) {
      case "approuvee":
        message = `✅ Votre demande "${updatedDemande.nom}" a été approuvée. Vous pouvez la récupérer.`;
        break;
      case "rejete":
        message = `❌ Votre demande "${updatedDemande.nom}" a été rejetée.`;
        break;
      case "en_attente":
        message = `⏳ Votre demande "${updatedDemande.nom}" est en cours de traitement.`;
        break;
    }

    // Création de la notification en base
    const notif = await Notification.create({
      message,
      type: "demande",
      utilisateur: etu._id,
    });

    await User.findByIdAndUpdate(etu._id, {
      $push: { notifications: notif._id },
    });

    // === Envoi en temps réel via Socket.IO ===
    if (io) {
      console.log(`🔔 Envoi de la notification en temps réel à ${etu._id}`);
      io.to(etu._id.toString()).emit("receiveNotification", {
        message,
        type: "demande",
        date: new Date(),
      });
    } else {
      console.warn("⚠️ io non trouvé, impossible d'envoyer la notification en direct.");
    }

    res.status(200).json({
      message: "Statut de la demande mis à jour ✅",
      demande: updatedDemande,
    });
  } catch (error) {
    console.error("❌ Erreur updateDemande:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


/* ===========================================================
   🔴 DELETE DEMANDE
=========================================================== */
module.exports.deleteDemande = async (req, res) => {
  try {
    const deleted = await Demande.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Demande introuvable." });
    }

    await User.findByIdAndUpdate(deleted.etudiant, {
      $pull: { demandes: deleted._id },
    });

    res.status(200).json({ message: "Demande supprimée avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteDemande:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🧨 DELETE ALL DEMANDES
=========================================================== */
module.exports.deleteAllDemandes = async (req, res) => {
  try {
    await Demande.deleteMany({});
    await User.updateMany({}, { $set: { demandes: [] } });

    res.status(200).json({ message: "Toutes les demandes ont été supprimées ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteAllDemandes:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
