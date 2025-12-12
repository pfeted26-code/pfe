const Announcement = require("../models/announcementSchema");
const Notification = require("../models/notificationSchema");
const User = require("../models/userSchema");
const Classe = require("../models/classeSchema");

/* ===========================================================
  CREATE ANNOUNCEMENT + CREATE NOTIFICATIONS
=========================================================== */
exports.createAnnouncement = async (req, res) => {
  try {
    const {
      titre,
      contenu,
      type,
      priorite,
      destinataires,
      utilisateursSpecifiques,
      classesSpecifiques,
      rolesMultiples,
      dateExpiration,
      estEpingle,
      pieceJointe,
    } = req.body;

    // Validation
    if (!titre || !contenu) {
      return res.status(400).json({ message: "Titre et contenu sont obligatoires." });
    }

    // Validation du ciblage
    if (destinataires === "specific_users" && (!utilisateursSpecifiques || utilisateursSpecifiques.length === 0)) {
      return res.status(400).json({ message: "Veuillez sélectionner au moins un utilisateur." });
    }

    if (destinataires === "specific_classes" && (!classesSpecifiques || classesSpecifiques.length === 0)) {
      return res.status(400).json({ message: "Veuillez sélectionner au moins une classe." });
    }

    if (destinataires === "multiple_roles" && (!rolesMultiples || rolesMultiples.length === 0)) {
      return res.status(400).json({ message: "Veuillez sélectionner au moins un rôle." });
    }

    // Créer l'annonce
    const announcement = new Announcement({
      titre,
      contenu,
      type: type || "info",
      priorite: priorite || "normal",
      auteur: req.user.id,
      destinataires: destinataires || "all",
      utilisateursSpecifiques: destinataires === "specific_users" ? utilisateursSpecifiques : [],
      classesSpecifiques: destinataires === "specific_classes" ? classesSpecifiques : [],
      rolesMultiples: destinataires === "multiple_roles" ? rolesMultiples : [],
      dateExpiration: dateExpiration || null,
      estEpingle: estEpingle || false,
      pieceJointe: pieceJointe || null,
    });

    await announcement.save();

    // 🔔 CRÉER DES NOTIFICATIONS POUR LES DESTINATAIRES
    const createdNotifications = await createNotificationsForAnnouncement(announcement, req);
    
    // ✅ Sauvegarder les IDs des notifications dans l'annonce
    announcement.notifications = createdNotifications.map(notif => notif._id);
    await announcement.save();

    // Populate pour retourner les infos complètes
    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate("auteur", "prenom nom email role")
      .populate("utilisateursSpecifiques", "prenom nom email role")
      .populate("classesSpecifiques", "nom annee specialisation")
      .populate("notifications");

    res.status(201).json({
      message: "Annonce créée avec succès ✅",
      announcement: populatedAnnouncement,
      notificationsSent: createdNotifications.length,
    });
  } catch (error) {
    console.error("❌ Erreur createAnnouncement:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  FONCTION POUR CRÉER LES NOTIFICATIONS
=========================================================== */
async function createNotificationsForAnnouncement(announcement, req) {
  try {
    const io = req.app.get("io");
    let targetUserIds = [];

    // Déterminer les utilisateurs cibles selon le type de destinataires
    switch (announcement.destinataires) {
      case "all":
        const allUsers = await User.find({}, "_id");
        targetUserIds = allUsers.map(u => u._id);
        break;

      case "students":
        const students = await User.find({ role: "etudiant" }, "_id");
        targetUserIds = students.map(u => u._id);
        break;

      case "teachers":
        const teachers = await User.find({ role: "enseignant" }, "_id");
        targetUserIds = teachers.map(u => u._id);
        break;

      case "admins":
        const admins = await User.find({ role: "admin" }, "_id");
        targetUserIds = admins.map(u => u._id);
        break;

      case "specific_users":
        targetUserIds = announcement.utilisateursSpecifiques;
        break;

      case "specific_classes":
        const classStudents = await User.find({
          classe: { $in: announcement.classesSpecifiques },
          role: "etudiant"
        }, "_id");
        targetUserIds = classStudents.map(u => u._id);
        break;

      case "multiple_roles":
        const roleUsers = await User.find({
          role: { $in: announcement.rolesMultiples }
        }, "_id");
        targetUserIds = roleUsers.map(u => u._id);
        break;
    }

    // Créer une notification pour chaque utilisateur cible
    const notificationPromises = targetUserIds.map(async (userId) => {
      const notification = new Notification({
        message: `📢 Nouvelle annonce: ${announcement.titre}`,
        type: "annonce",
        utilisateur: userId,
        announcement: announcement._id,
        estLu: false,
      });

      await notification.save();

      // Ajouter la notification à l'utilisateur
      await User.findByIdAndUpdate(userId, {
        $push: { notifications: notification._id }
      });

      // 🔔 Envoyer notification temps réel via Socket.IO
      if (io) {
        io.to(userId.toString()).emit("receiveNotification", {
          _id: notification._id,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt,
          estLu: notification.estLu,
          announcement: {
            _id: announcement._id,
            titre: announcement.titre,
            contenu: announcement.contenu,
            type: announcement.type,
            priorite: announcement.priorite,
          }
        });
      }

      return notification;
    });

    const createdNotifications = await Promise.all(notificationPromises);
    console.log(`✅ ${createdNotifications.length} notifications créées pour l'annonce "${announcement.titre}"`);

    return createdNotifications;

  } catch (error) {
    console.error("❌ Erreur création notifications:", error);
    return [];
  }
}

/* ===========================================================
  GET ALL ANNOUNCEMENTS (Admin)
=========================================================== */
exports.getAllAnnouncements = async (req, res) => {
  try {
    const { includeExpired, includeInactive } = req.query;

    let filter = {};

    if (includeInactive !== "true") {
      filter.estActif = true;
    }

    if (includeExpired !== "true") {
      filter.$or = [
        { dateExpiration: null },
        { dateExpiration: { $gt: new Date() } },
      ];
    }

    const announcements = await Announcement.find(filter)
      .populate("auteur", "prenom nom email role")
      .populate("utilisateursSpecifiques", "prenom nom email role")
      .populate("classesSpecifiques", "nom annee specialisation")
      .populate({
        path: "vues.utilisateur",
        select: "prenom nom email"
      })
      .sort({ estEpingle: -1, createdAt: -1 });

    res.status(200).json(announcements);
  } catch (error) {
    console.error("❌ Erreur getAllAnnouncements:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  GET ANNOUNCEMENTS FOR USER
=========================================================== */
exports.getAnnouncementsForUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate("classe");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const currentDate = new Date();

    const allAnnouncements = await Announcement.find({
      estActif: true,
      $or: [
        { dateExpiration: null },
        { dateExpiration: { $gt: currentDate } },
      ],
    })
      .populate("auteur", "prenom nom email role")
      .populate("classesSpecifiques", "nom")
      .sort({ estEpingle: -1, createdAt: -1 });

    const userAnnouncements = allAnnouncements.filter(announcement => {
      return announcement.canUserView(user);
    });

    res.status(200).json(userAnnouncements);
  } catch (error) {
    console.error("❌ Erreur getAnnouncementsForUser:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  GET ANNOUNCEMENT BY ID
=========================================================== */
exports.getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate("auteur", "prenom nom email role")
      .populate("utilisateursSpecifiques", "prenom nom email role")
      .populate("classesSpecifiques", "nom annee specialisation")
      .populate("vues.utilisateur", "prenom nom email");

    if (!announcement) {
      return res.status(404).json({ message: "Annonce introuvable." });
    }

    res.status(200).json(announcement);
  } catch (error) {
    console.error("❌ Erreur getAnnouncementById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  UPDATE ANNOUNCEMENT
=========================================================== */
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Annonce introuvable." });
    }

    if (announcement.auteur.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Accès non autorisé." });
    }

    if (updateData.destinataires === "specific_users" && (!updateData.utilisateursSpecifiques || updateData.utilisateursSpecifiques.length === 0)) {
      return res.status(400).json({ message: "Veuillez sélectionner au moins un utilisateur." });
    }

    if (updateData.destinataires === "specific_classes" && (!updateData.classesSpecifiques || updateData.classesSpecifiques.length === 0)) {
      return res.status(400).json({ message: "Veuillez sélectionner au moins une classe." });
    }

    if (updateData.destinataires === "multiple_roles" && (!updateData.rolesMultiples || updateData.rolesMultiples.length === 0)) {
      return res.status(400).json({ message: "Veuillez sélectionner au moins un rôle." });
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate("auteur", "prenom nom email role")
      .populate("utilisateursSpecifiques", "prenom nom email role")
      .populate("classesSpecifiques", "nom annee specialisation");

    res.status(200).json({
      message: "Annonce mise à jour avec succès ✅",
      announcement: updatedAnnouncement,
    });
  } catch (error) {
    console.error("❌ Erreur updateAnnouncement:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  DELETE ANNOUNCEMENT + DELETE RELATED NOTIFICATIONS
=========================================================== */
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Annonce introuvable." });
    }

    // Vérifier que l'utilisateur est l'auteur ou admin
    if (announcement.auteur.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Accès non autorisé." });
    }

    // ✅ 1. Supprimer toutes les notifications liées à cette annonce
    const deletedNotifications = await Notification.deleteMany({ 
      announcement: announcement._id 
    });
    console.log(`🗑️ ${deletedNotifications.deletedCount} notifications supprimées pour l'annonce "${announcement.titre}"`);

    // ✅ 2. Retirer les références de notifications des utilisateurs
    await User.updateMany(
      { notifications: { $in: announcement.notifications } },
      { $pull: { notifications: { $in: announcement.notifications } } }
    );

    // ✅ 3. Supprimer l'annonce
    await Announcement.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      message: "Annonce et notifications associées supprimées avec succès ✅",
      deletedNotificationsCount: deletedNotifications.deletedCount
    });
  } catch (error) {
    console.error("❌ Erreur deleteAnnouncement:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  MARK ANNOUNCEMENT AS VIEWED
=========================================================== */
exports.markAsViewed = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Annonce introuvable." });
    }

    const alreadyViewed = announcement.vues.some(
      (vue) => vue.utilisateur.toString() === userId
    );

    if (!alreadyViewed) {
      announcement.vues.push({ utilisateur: userId });
      announcement.nombreVues = announcement.vues.length;
      await announcement.save();
    }

    res.status(200).json({ message: "Annonce marquée comme vue ✅" });
  } catch (error) {
    console.error("❌ Erreur markAsViewed:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  TOGGLE PIN ANNOUNCEMENT
=========================================================== */
exports.togglePin = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Annonce introuvable." });
    }

    announcement.estEpingle = !announcement.estEpingle;
    await announcement.save();

    res.status(200).json({
      message: announcement.estEpingle
        ? "Annonce épinglée ✅"
        : "Annonce désépinglée ✅",
      announcement,
    });
  } catch (error) {
    console.error("❌ Erreur togglePin:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  GET ANNOUNCEMENT STATISTICS
=========================================================== */
exports.getAnnouncementStats = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id)
      .populate("vues.utilisateur", "prenom nom email role");

    if (!announcement) {
      return res.status(404).json({ message: "Annonce introuvable." });
    }

    let targetCount = 0;

    switch (announcement.destinataires) {
      case "all":
        targetCount = await User.countDocuments();
        break;
      case "students":
        targetCount = await User.countDocuments({ role: "etudiant" });
        break;
      case "teachers":
        targetCount = await User.countDocuments({ role: "enseignant" });
        break;
      case "admins":
        targetCount = await User.countDocuments({ role: "admin" });
        break;
      case "specific_users":
        targetCount = announcement.utilisateursSpecifiques.length;
        break;
      case "specific_classes":
        const classes = await Classe.find({ _id: { $in: announcement.classesSpecifiques } }).populate("etudiants");
        targetCount = classes.reduce((sum, classe) => sum + classe.etudiants.length, 0);
        break;
      case "multiple_roles":
        targetCount = await User.countDocuments({ role: { $in: announcement.rolesMultiples } });
        break;
    }

    const stats = {
      totalTarget: targetCount,
      totalViews: announcement.nombreVues,
      viewRate: targetCount > 0 ? ((announcement.nombreVues / targetCount) * 100).toFixed(2) + "%" : "0%",
      viewers: announcement.vues,
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("❌ Erreur getAnnouncementStats:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
