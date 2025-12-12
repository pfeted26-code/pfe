const Notification = require("../models/notificationSchema");
const User = require("../models/userSchema");

/* ===========================================================
  CREATE NOTIFICATION (et envoi temps réel via socket.io)
=========================================================== */
module.exports.createNotification = async (req, res) => {
  try {
    const { message, type, utilisateur } = req.body;

    if (!message || !type || !utilisateur) {
      return res
        .status(400)
        .json({ message: "Tous les champs sont obligatoires." });
    }

    const user = await User.findById(utilisateur);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const notif = new Notification({
      message,
      type,
      utilisateur, // ObjectId de l'utilisateur
    });

    await notif.save();

    await User.findByIdAndUpdate(utilisateur, {
      $push: { notifications: notif._id },
    });

    // Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(utilisateur.toString()).emit("receiveNotification", notif);
    }

    res.status(201).json({ message: "Notification envoyée ✅", notif });
  } catch (error) {
    console.error("❌ Erreur createNotification:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  GET ALL NOTIFICATIONS
=========================================================== */
module.exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate("utilisateur", "prenom nom email")
      .sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  GET NOTIFICATIONS BY USER
=========================================================== */
module.exports.getNotificationsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ utilisateur: userId })
      .populate("utilisateur", "prenom nom email role")
      .sort({ createdAt: -1 });
    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Erreur getNotificationsByUser:", error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

/* ===========================================================
  MARK AS READ
=========================================================== */
module.exports.markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { estLu: true },
      { new: true }
    );
    if (!notif) {
      return res.status(404).json({ message: "Notification introuvable." });
    }
    res.status(200).json({ message: "Notification marquée comme lue ✅", notif });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  DELETE NOTIFICATION
=========================================================== */
module.exports.deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Notification introuvable." });
    }
    await User.updateMany({}, { $pull: { notifications: deleted._id } });
    res.status(200).json({ message: "Notification supprimée ✅" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
  DELETE ALL NOTIFICATIONS OF A USER
=========================================================== */
module.exports.deleteAllNotificationsOfUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }
    const result = await Notification.deleteMany({ utilisateur: userId });
    await User.findByIdAndUpdate(userId, { $set: { notifications: [] } });
    res.status(200).json({
      message: `Toutes les notifications de l'utilisateur "${user.nom} ${user.prenom}" ont été supprimées ✅`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Erreur deleteAllNotificationsOfUser:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
