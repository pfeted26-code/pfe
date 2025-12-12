const Presence = require("../models/presenceSchema");
const User = require("../models/userSchema");
const Cours = require("../models/coursSchema");
const Seance = require("../models/seanceSchema");
const Notification = require("../models/notificationSchema");

/* ===========================================================
  CREATE PRESENCE
=========================================================== */
module.exports.createPresence = async (req, res) => {
  try {
    const { date, statut, seance, etudiant, enseignant } = req.body;

    if (!date || !statut || !seance || !etudiant || !enseignant) {
      return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis." });
    }

    // Vérifier que la séance et l'étudiant existent
    const [seanceData, etudiantData, enseignantData] = await Promise.all([
      Seance.findById(seance).populate('cours', 'nom'),
      User.findById(etudiant),
      User.findById(enseignant)
    ]);

    if (!seanceData) return res.status(404).json({ message: "Séance introuvable." });
    if (!etudiantData || etudiantData.role !== "etudiant")
      return res.status(400).json({ message: "Étudiant introuvable ou rôle invalide." });
    if (!enseignantData || enseignantData.role !== "enseignant")
      return res.status(400).json({ message: "Enseignant introuvable ou rôle invalide." });

    // Vérifier si une présence existe déjà pour cette combinaison
    const existingPresence = await Presence.findOne({
      seance,
      etudiant,
      date: {
        $gte: new Date(date).setHours(0, 0, 0, 0),
        $lt: new Date(date).setHours(23, 59, 59, 999)
      }
    });

    if (existingPresence) {
      return res.status(400).json({ 
        message: "Une présence existe déjà pour cet étudiant à cette séance et date." 
      });
    }

    // Créer la présence
    const newPresence = new Presence({
      date,
      statut,
      seance,
      etudiant,
      enseignant,
    });

    await newPresence.save();

    // Ajouter les références
    await Promise.all([
      User.findByIdAndUpdate(etudiant, { $addToSet: { presences: newPresence._id } }),
      Seance.findByIdAndUpdate(seance, { $addToSet: { presences: newPresence._id } }),
    ]);

    /* ===========================================================
     Vérifier le nombre d'absences de l'étudiant pour le COURS
   =========================================================== */
    if (statut === "absent" && seanceData.cours) {
      // Récupérer toutes les séances de ce cours
      const coursSeances = await Seance.find({ cours: seanceData.cours._id });
      const seanceIds = coursSeances.map(s => s._id);

      // Compter les absences dans TOUTES les séances de ce cours
      const absences = await Presence.countDocuments({ 
        etudiant, 
        seance: { $in: seanceIds },
        statut: "absent" 
      });

      if (absences === 2) {
        const message = `⚠️ Vous avez 2 absences dans le cours "${seanceData.cours.nom}". Une autre absence pourrait entraîner votre élimination.`;

        // Créer une notification
        const notif = await Notification.create({
          message,
          type: "avertissement",
          utilisateur: etudiant,
        });

        // L'ajouter dans les notifications de l'utilisateur
        await User.findByIdAndUpdate(etudiant, { $push: { notifications: notif._id } });

        // Envoi en temps réel si Socket.IO dispo
        if (req.io) {
          req.io.to(etudiant.toString()).emit("receiveNotification", {
            message,
            type: "avertissement",
            date: new Date(),
          });
        }

        console.log(`🚨 Notification envoyée à ${etudiantData.prenom} ${etudiantData.nom}`);
      }
    }

    res.status(201).json({ message: "Présence enregistrée avec succès ✅", presence: newPresence });
  } catch (error) {
    console.error("❌ Erreur createPresence:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  GET ALL PRESENCES
=========================================================== */
module.exports.getAllPresence = async (_, res) => {
  try {
    const presences = await Presence.find()
      .populate("etudiant", "prenom nom email classe")
      .populate("enseignant", "prenom nom email")
      .populate({
        path: "seance",
        populate: {
          path: "cours",
          select: "nom code credits semestre"
        }
      });

    res.status(200).json(presences);
  } catch (error) {
    console.error("❌ Erreur getAllPresence:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  GET PRESENCE BY ID
=========================================================== */
module.exports.getPresenceById = async (req, res) => {
  try {
    const presence = await Presence.findById(req.params.id)
      .populate("etudiant", "prenom nom email classe")
      .populate("enseignant", "prenom nom email")
      .populate({
        path: "seance",
        populate: {
          path: "cours",
          select: "nom code credits semestre"
        }
      });

    if (!presence) return res.status(404).json({ message: "Présence introuvable." });
    res.status(200).json(presence);
  } catch (error) {
    console.error("❌ Erreur getPresenceById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  GET PRESENCES BY ETUDIANT
=========================================================== */
module.exports.getPresenceByEtudiant = async (req, res) => {
  try {
    const { etudiantId } = req.params;

    // Get the student to access their class
    const student = await User.findById(etudiantId).select('classe');
    if (!student) {
      return res.status(404).json({ message: "Étudiant introuvable." });
    }

    const presences = await Presence.find({ etudiant: etudiantId })
      .populate({
        path: "seance",
        populate: [
          {
            path: "cours",
            select: "nom code credits semestre"
          },
          {
            path: "classe",
            select: "nom"
          }
        ]
      })
      .populate("enseignant", "prenom nom email");

    // Filter presences to only include those for seances in the student's class
    const filteredPresences = presences.filter(presence => {
      const seanceClasseId = presence.seance?.classe?._id || presence.seance?.classe;
      const studentClasseId = student.classe?._id || student.classe;
      return seanceClasseId?.toString() === studentClasseId?.toString();
    });

    res.status(200).json(filteredPresences);
  } catch (error) {
    console.error("❌ Erreur getPresenceByEtudiant:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  GET PRESENCES BY ENSEIGNANT
=========================================================== */
module.exports.getPresenceByEnseignant = async (req, res) => {
  try {
    const { enseignantId } = req.params;
    const presences = await Presence.find({ enseignant: enseignantId })
      .populate({
        path: "seance",
        populate: {
          path: "cours",
          select: "nom code credits semestre"
        }
      })
      .populate("etudiant", "prenom nom email");

    res.status(200).json(presences);
  } catch (error) {
    console.error("❌ Erreur getPresenceByEnseignant:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  GET PRESENCES BY SEANCE
=========================================================== */
module.exports.getPresenceBySeance = async (req, res) => {
  try {
    const { seanceId } = req.params;
    const presences = await Presence.find({ seance: seanceId })
      .populate("etudiant", "prenom nom email classe")
      .populate("enseignant", "prenom nom email")
      .populate({
        path: "seance",
        populate: {
          path: "cours",
          select: "nom code credits semestre"
        }
      });

    res.status(200).json(presences);
  } catch (error) {
    console.error("❌ Erreur getPresenceBySeance:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  CALCUL DU TAUX DE PRÉSENCE PAR ÉTUDIANT
=========================================================== */
module.exports.getTauxPresence = async (req, res) => {
  try {
    const { etudiantId, seanceId } = req.params;

    // Construire le filtre de recherche
    const filter = { etudiant: etudiantId };
    if (seanceId) filter.seance = seanceId; // ✅ FIXED: was 'cours'

    // Récupérer toutes les présences correspondantes
    const presences = await Presence.find(filter);

    if (presences.length === 0) {
      return res.status(404).json({ message: "Aucune donnée de présence trouvée pour cet étudiant." });
    }

    // Compter le nombre de présences et d'absences
    const total = presences.length;
    const presents = presences.filter(p => p.statut === "présent").length;

    // Calcul du taux (en %)
    const taux = ((presents / total) * 100).toFixed(2);

    res.status(200).json({
      etudiantId,
      seanceId: seanceId || "toutes les séances",
      totalPresences: total,
      nombrePresent: presents,
      tauxPresence: `${taux}%`,
    });
  } catch (error) {
    console.error("❌ Erreur getTauxPresence:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  TAUX DE PRÉSENCE PAR COURS
=========================================================== */
module.exports.getTauxPresenceParCours = async (req, res) => {
  try {
    const { coursId } = req.params;

    // Vérifier si le cours existe
    const cours = await Cours.findById(coursId);
    if (!cours) {
      return res.status(404).json({ message: "Cours introuvable." });
    }

    // Récupérer toutes les séances de ce cours
    const seances = await Seance.find({ cours: coursId });
    const seanceIds = seances.map(s => s._id);

    // Récupérer toutes les présences de ces séances
    const presences = await Presence.find({ seance: { $in: seanceIds } });

    if (presences.length === 0) {
      return res.status(200).json({ message: "Aucune présence enregistrée pour ce cours.", taux: 0 });
    }

    // Compter les présences "présent"
    const presents = presences.filter(p => p.statut === "présent").length;
    const taux = ((presents / presences.length) * 100).toFixed(2);

    res.status(200).json({
      message: "Taux de présence calculé avec succès ✅",
      cours: cours.nom,
      total: presences.length,
      presents,
      taux: `${taux}%`
    });
  } catch (error) {
    console.error("❌ Erreur getTauxPresenceParCours:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  TAUX DE PRÉSENCE PAR SÉANCE
=========================================================== */
module.exports.getTauxPresenceParSeance = async (req, res) => {
  try {
    const { seanceId } = req.params;

    // Vérifier si la séance existe
    const seance = await Seance.findById(seanceId).populate('cours', 'nom');
    if (!seance) {
      return res.status(404).json({ message: "Séance introuvable." });
    }

    // Récupérer toutes les présences de la séance
    const presences = await Presence.find({ seance: seanceId });

    if (presences.length === 0) {
      return res.status(200).json({ message: "Aucune présence enregistrée pour cette séance.", taux: 0 });
    }

    // Compter les présences "présent"
    const presents = presences.filter(p => p.statut === "présent").length;
    const taux = ((presents / presences.length) * 100).toFixed(2);

    res.status(200).json({
      message: "Taux de présence calculé avec succès ✅",
      seance: `${seance.cours?.nom || 'Course'} - ${seance.typeCours}`,
      total: presences.length,
      presents,
      taux: `${taux}%`
    });
  } catch (error) {
    console.error("❌ Erreur getTauxPresenceParSeance:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  UPDATE PRESENCE
=========================================================== */
module.exports.updatePresence = async (req, res) => {
  try {
    const updatedPresence = await Presence.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPresence) return res.status(404).json({ message: "Présence introuvable." });

    res.status(200).json({ message: "Présence mise à jour ✅", presence: updatedPresence });
  } catch (error) {
    console.error("❌ Erreur updatePresence:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  DELETE PRESENCE
=========================================================== */
module.exports.deletePresence = async (req, res) => {
  try {
    const deletedPresence = await Presence.findByIdAndDelete(req.params.id);
    if (!deletedPresence) return res.status(404).json({ message: "Présence introuvable." });

    await Promise.all([
      User.updateMany({}, { $pull: { presences: deletedPresence._id } }),
      Seance.updateMany({}, { $pull: { presences: deletedPresence._id } }),
    ]);

    res.status(200).json({ message: "Présence supprimée avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur deletePresence:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  DELETE ALL PRESENCES
=========================================================== */
module.exports.deleteAllPresence = async (req, res) => {
  try {
    const result = await Presence.deleteMany({});
    await Promise.all([
      User.updateMany({}, { $set: { presences: [] } }),
      Seance.updateMany({}, { $set: { presences: [] } }),
    ]);

    res.status(200).json({
      message: "Toutes les présences ont été supprimées ✅",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Erreur deleteAllPresence:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};