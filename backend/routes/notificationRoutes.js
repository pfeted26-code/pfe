const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");

// Créer une notification
router.post("/", requireAuthUser, ControledAcces("admin", "enseignant"), notificationController.createNotification);

// Récupérer toutes les notifications
router.get("/", requireAuthUser, ControledAcces("admin"), notificationController.getAllNotifications);

// Récupérer les notifications d’un utilisateur
router.get("/user/:userId", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), notificationController.getNotificationsByUser);

// Marquer une notification comme lue
router.put("/:id/read", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), notificationController.markAsRead);

// Supprimer une notification
router.delete("/:id", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), notificationController.deleteNotification);

// Supprimer toutes les notifications d’un utilisateur
router.delete("/user/:userId", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), notificationController.deleteAllNotificationsOfUser);

module.exports = router;
