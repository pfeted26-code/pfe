const Seance = require("../models/seanceSchema");
const EmploiDuTemps = require("../models/emploiDuTempsSchema");
const Cours = require("../models/coursSchema");
const Classe = require("../models/classeSchema");
const User = require("../models/userSchema");
const Notification = require("../models/notificationSchema");

/* ===========================================================
   🟢 CREATE SEANCE
=========================================================== */
module.exports.createSeance = async (req, res) => {
  try {
    const {
      nom,
      jourSemaine,
      heureDebut,
      heureFin,
      salle,
      typeCours,
      cours,
      classe,
      enseignant,
      emploiDuTemps,
      notes,
      statut
    } = req.body;

    // Validation
    if (!nom || !jourSemaine || !heureDebut || !heureFin || !salle || !typeCours || !cours || !classe || !enseignant) {
      return res.status(400).json({
        message: "Tous les champs obligatoires ne sont pas remplis.",
      });
    }

    // Verify references exist
    const [coursDoc, classeDoc, enseignantDoc] = await Promise.all([
      Cours.findById(cours),
      Classe.findById(classe).populate("etudiants", "_id prenom nom email"),
      User.findById(enseignant)
    ]);

    if (!coursDoc) return res.status(404).json({ message: "Cours introuvable." });
    if (!classeDoc) return res.status(404).json({ message: "Classe introuvable." });
    if (!enseignantDoc || enseignantDoc.role !== "enseignant") {
      return res.status(400).json({ message: "Enseignant introuvable ou rôle invalide." });
    }

    // Check for schedule conflicts (same day, same room, overlapping time)
    const existingSeances = await Seance.find({
      jourSemaine,
      salle,
      statut: "actif"
    });

    const conflict = existingSeances.some((s) => {
      return (
        (heureDebut >= s.heureDebut && heureDebut < s.heureFin) ||
        (heureFin > s.heureDebut && heureFin <= s.heureFin) ||
        (heureDebut <= s.heureDebut && heureFin >= s.heureFin)
      );
    });

    if (conflict) {
      return res.status(400).json({
        message: `Conflit d'horaire: La salle ${salle} est déjà occupée le ${jourSemaine}.`,
      });
    }

    // Create new seance
    const newSeance = await Seance.create({
      nom,
      jourSemaine,
      heureDebut,
      heureFin,
      salle,
      typeCours,
      cours,
      classe,
      enseignant,
      emploiDuTemps: emploiDuTemps || null,
      notes: notes || "",
      statut: statut || "actif",
      presences: []
    });

    // Update references
    const updates = [
      Cours.findByIdAndUpdate(cours, { $addToSet: { seances: newSeance._id } }),
      Classe.findByIdAndUpdate(classe, { $addToSet: { seances: newSeance._id } }),
      User.findByIdAndUpdate(enseignant, { $addToSet: { seances: newSeance._id } })
    ];

    if (emploiDuTemps) {
      updates.push(
        EmploiDuTemps.findByIdAndUpdate(emploiDuTemps, { $addToSet: { seances: newSeance._id } })
      );
    }

    await Promise.all(updates);

    // Send notification to students
    await sendSeanceNotification(
      req,
      classeDoc,
      coursDoc,
      `📅 Nouvelle séance ajoutée: "${coursDoc.nom} - ${nom}" le ${jourSemaine} de ${heureDebut} à ${heureFin} en salle ${salle}.`,
      "creation"
    );

    res.status(201).json({ 
      message: "Séance créée avec succès ✅", 
      seance: newSeance 
    });
  } catch (error) {
    console.error("❌ Erreur createSeance:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET ALL SEANCES
=========================================================== */
module.exports.getAllSeances = async (req, res) => {
  try {
    let seances;

    if (req.user.role === "etudiant") {
      const user = await User.findById(req.user.id).populate("classe");

      if (!user?.classe) {
        return res.status(404).json({ message: "Classe introuvable." });
      }

      seances = await Seance.find({ classe: user.classe._id, statut: "actif" })
        .populate("cours", "nom code")
        .populate("classe", "nom annee specialisation")
        .populate("enseignant", "prenom nom email")
        .populate("emploiDuTemps", "titre")
        .sort({ jourSemaine: 1, heureDebut: 1 });
    } else if (req.user.role === "enseignant") {
      seances = await Seance.find({ enseignant: req.user.id })
        .populate("cours", "nom code")
        .populate("classe", "nom annee specialisation")
        .populate("enseignant", "prenom nom email")
        .populate("emploiDuTemps", "titre")
        .sort({ jourSemaine: 1, heureDebut: 1 });
    } else {
      // Admin sees all
      seances = await Seance.find()
        .populate("cours", "nom code")
        .populate("classe", "nom annee specialisation")
        .populate("enseignant", "prenom nom email")
        .populate("emploiDuTemps", "titre")
        .sort({ jourSemaine: 1, heureDebut: 1 });
    }

    res.status(200).json(seances);
  } catch (error) {
    console.error("❌ Erreur getAllSeances:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET SEANCE BY ID
=========================================================== */
module.exports.getSeanceById = async (req, res) => {
  try {
    const seance = await Seance.findById(req.params.id)
      .populate("cours", "nom code")
      .populate("classe", "nom annee specialisation")
      .populate("enseignant", "prenom nom email")
      .populate("emploiDuTemps", "titre");

    if (!seance) {
      return res.status(404).json({ message: "Séance introuvable." });
    }

    res.status(200).json(seance);
  } catch (error) {
    console.error("❌ Erreur getSeanceById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET SEANCES BY ENSEIGNANT
=========================================================== */
module.exports.getSeancesByEnseignant = async (req, res) => {
  try {
    const { enseignantId } = req.params;

    const seances = await Seance.find({ enseignant: enseignantId })
      .populate("cours", "nom code")
      .populate("classe", "nom niveau")
      .populate("emploiDuTemps", "titre")
      .sort({ jourSemaine: 1, heureDebut: 1 });

    res.status(200).json(seances);
  } catch (error) {
    console.error("❌ Erreur getSeancesByEnseignant:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET SEANCES BY CLASSE
=========================================================== */
module.exports.getSeancesByClasse = async (req, res) => {
  try {
    const { classeId } = req.params;

    const seances = await Seance.find({ classe: classeId })
      .populate("cours", "nom code")
      .populate("enseignant", "prenom nom")
      .populate("emploiDuTemps", "titre")
      .sort({ jourSemaine: 1, heureDebut: 1 });

    res.status(200).json(seances);
  } catch (error) {
    console.error("❌ Erreur getSeancesByClasse:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ✏️ UPDATE SEANCE
=========================================================== */
module.exports.updateSeance = async (req, res) => {
  try {
    const {
      nom,
      jourSemaine,
      heureDebut,
      heureFin,
      salle,
      typeCours,
      cours,
      classe,
      enseignant,
      emploiDuTemps,
      notes,
      statut
    } = req.body;

    const seance = await Seance.findById(req.params.id);
    if (!seance) {
      return res.status(404).json({ message: "Séance introuvable." });
    }

    // Verify references
    const [coursDoc, classeDoc, enseignantDoc] = await Promise.all([
      cours ? Cours.findById(cours) : Promise.resolve(null),
      classe ? Classe.findById(classe).populate("etudiants", "_id prenom nom email") : Promise.resolve(null),
      enseignant ? User.findById(enseignant) : Promise.resolve(null)
    ]);

    if (cours && !coursDoc) {
      return res.status(404).json({ message: "Cours introuvable." });
    }
    if (classe && !classeDoc) {
      return res.status(404).json({ message: "Classe introuvable." });
    }
    if (enseignant && (!enseignantDoc || enseignantDoc.role !== "enseignant")) {
      return res.status(400).json({ message: "Enseignant introuvable ou rôle invalide." });
    }

    // Check conflicts if schedule is being changed
    if (jourSemaine || heureDebut || heureFin || salle) {
      const checkJour = jourSemaine || seance.jourSemaine;
      const checkSalle = salle || seance.salle;
      const checkDebut = heureDebut || seance.heureDebut;
      const checkFin = heureFin || seance.heureFin;

      const otherSeances = await Seance.find({
        _id: { $ne: seance._id },
        jourSemaine: checkJour,
        salle: checkSalle,
        statut: "actif"
      });

      const conflict = otherSeances.some((s) => {
        return (
          (checkDebut >= s.heureDebut && checkDebut < s.heureFin) ||
          (checkFin > s.heureDebut && checkFin <= s.heureFin) ||
          (checkDebut <= s.heureDebut && checkFin >= s.heureFin)
        );
      });

      if (conflict) {
        return res.status(400).json({
          message: "Conflit d'horaire: une autre séance existe déjà dans cette période.",
        });
      }
    }

    // Update references if changed
    const updates = [];

    if (cours && seance.cours.toString() !== cours) {
      updates.push(
        Cours.findByIdAndUpdate(seance.cours, { $pull: { seances: seance._id } }),
        Cours.findByIdAndUpdate(cours, { $addToSet: { seances: seance._id } })
      );
    }

    if (classe && seance.classe.toString() !== classe) {
      updates.push(
        Classe.findByIdAndUpdate(seance.classe, { $pull: { seances: seance._id } }),
        Classe.findByIdAndUpdate(classe, { $addToSet: { seances: seance._id } })
      );
    }

    if (enseignant && seance.enseignant.toString() !== enseignant) {
      updates.push(
        User.findByIdAndUpdate(seance.enseignant, { $pull: { seances: seance._id } }),
        User.findByIdAndUpdate(enseignant, { $addToSet: { seances: seance._id } })
      );
    }

    if (emploiDuTemps && seance.emploiDuTemps && seance.emploiDuTemps.toString() !== emploiDuTemps) {
      updates.push(
        EmploiDuTemps.findByIdAndUpdate(seance.emploiDuTemps, { $pull: { seances: seance._id } }),
        EmploiDuTemps.findByIdAndUpdate(emploiDuTemps, { $addToSet: { seances: seance._id } })
      );
    }

    await Promise.all(updates);

    // Update seance fields
    if (nom) seance.nom = nom;
    if (jourSemaine) seance.jourSemaine = jourSemaine;
    if (heureDebut) seance.heureDebut = heureDebut;
    if (heureFin) seance.heureFin = heureFin;
    if (salle) seance.salle = salle;
    if (typeCours) seance.typeCours = typeCours;
    if (cours) seance.cours = cours;
    if (classe) seance.classe = classe;
    if (enseignant) seance.enseignant = enseignant;
    if (emploiDuTemps) seance.emploiDuTemps = emploiDuTemps;
    if (notes !== undefined) seance.notes = notes;
    if (statut) seance.statut = statut;

    const updated = await seance.save();

    // Get fresh data for notification
    const finalClasse = classeDoc || await Classe.findById(updated.classe).populate("etudiants", "_id prenom nom email");
    const finalCours = coursDoc || await Cours.findById(updated.cours);

    // Send notification
    await sendSeanceNotification(
      req,
      finalClasse,
      finalCours,
      `✏️ La séance "${finalCours.nom} - ${updated.nom}" du ${updated.jourSemaine} de ${updated.heureDebut} à ${updated.heureFin} a été modifiée.`,
      "modification"
    );

    res.status(200).json({
      message: "Séance mise à jour avec succès ✅",
      seance: updated,
    });
  } catch (error) {
    console.error("❌ Erreur updateSeance:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ❌ DELETE SEANCE
=========================================================== */
module.exports.deleteSeance = async (req, res) => {
  try {
    const seance = await Seance.findById(req.params.id);

    if (!seance) {
      return res.status(404).json({ message: "Séance introuvable." });
    }

    // Get related data before deletion
    const [classeDoc, coursDoc] = await Promise.all([
      Classe.findById(seance.classe).populate("etudiants", "_id prenom nom email"),
      Cours.findById(seance.cours)
    ]);

    // Delete seance
    await Seance.findByIdAndDelete(req.params.id);

    // Remove references
    const updates = [
      Cours.findByIdAndUpdate(seance.cours, { $pull: { seances: seance._id } }),
      Classe.findByIdAndUpdate(seance.classe, { $pull: { seances: seance._id } }),
      User.findByIdAndUpdate(seance.enseignant, { $pull: { seances: seance._id } })
    ];

    if (seance.emploiDuTemps) {
      updates.push(
        EmploiDuTemps.findByIdAndUpdate(seance.emploiDuTemps, { $pull: { seances: seance._id } })
      );
    }

    await Promise.all(updates);

    // Send notification
    await sendSeanceNotification(
      req,
      classeDoc,
      coursDoc,
      `🚫 La séance "${coursDoc?.nom} - ${seance.nom}" du ${seance.jourSemaine} de ${seance.heureDebut} à ${seance.heureFin} a été annulée.`,
      "suppression"
    );

    res.status(200).json({ message: "Séance supprimée avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteSeance:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ❌ DELETE ALL SEANCES
=========================================================== */
module.exports.deleteAllSeances = async (req, res) => {
  try {
    await Seance.deleteMany({});
    await Promise.all([
      EmploiDuTemps.updateMany({}, { $set: { seances: [] } }),
      Cours.updateMany({}, { $set: { seances: [] } }),
      Classe.updateMany({}, { $set: { seances: [] } }),
      User.updateMany({ role: "enseignant" }, { $set: { seances: [] } })
    ]);

    res.status(200).json({
      message: "Toutes les séances ont été supprimées ✅",
    });
  } catch (error) {
    console.error("❌ Erreur deleteAllSeances:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   📢 SEND NOTIFICATION (Centralized & Corrected)
=========================================================== */
async function sendSeanceNotification(req, classeDoc, coursDoc, message, actionType) {
  try {
    // Validate inputs
    if (!classeDoc || !classeDoc.etudiants || classeDoc.etudiants.length === 0) {
      console.warn("⚠️ Aucun étudiant trouvé dans la classe pour la notification");
      return;
    }

    if (!coursDoc) {
      console.warn("⚠️ Cours introuvable pour la notification");
      return;
    }

    // Get socket.io instance
    const io = req.io || req.app?.get("io") || global.io;
    
    if (!io) {
      console.warn("⚠️ Socket.io non disponible - notifications en temps réel désactivées");
    }

    console.log(`📢 Envoi de notifications à ${classeDoc.etudiants.length} étudiants pour action: ${actionType}`);

    // Create notifications for all students
    const notificationPromises = classeDoc.etudiants.map(async (etu) => {
      try {
        // Save notification in DB
        const notif = await Notification.create({
          message: message,
          type: "seance",
          utilisateur: etu._id,
          lu: false,
          dateCreation: new Date(),
        });

        // Attach notification to user
        await User.findByIdAndUpdate(etu._id, {
          $push: { notifications: notif._id },
        });

        // Real-time push via Socket.io
        if (io) {
          const studentRoom = etu._id.toString();
          
          io.to(studentRoom).emit("receiveNotification", {
            _id: notif._id,
            message: message,
            type: "seance",
            lu: false,
            dateCreation: notif.dateCreation,
            utilisateur: etu._id,
          });

          console.log(`✅ Notification envoyée à ${etu.prenom} ${etu.nom} (${studentRoom})`);
        }

        return notif;
      } catch (err) {
        console.error(`❌ Erreur notification pour étudiant ${etu._id}:`, err);
        return null;
      }
    });

    await Promise.all(notificationPromises);

    console.log(`✅ ${classeDoc.etudiants.length} notifications créées et envoyées`);

  } catch (err) {
    console.error("⚠️ Erreur lors de l'envoi des notifications séance:", err);
  }
}

