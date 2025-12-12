const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");

// Créer une annonce
router.post("/", requireAuthUser, ControledAcces("admin"), announcementController.createAnnouncement);

// Récupérer toutes les annonces
router.get("/", requireAuthUser, ControledAcces("admin" , "enseignant", "etudiant"), announcementController.getAllAnnouncements);

// Récupérer les annonces pour l'utilisateur connecté
router.get("/my-announcements", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), announcementController.getAnnouncementsForUser);

// Récupérer une annonce par ID
router.get("/:id", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), announcementController.getAnnouncementById);

// Obtenir les statistiques d'une annonce
router.get("/:id/stats", requireAuthUser, ControledAcces("admin"), announcementController.getAnnouncementStats);

// Mettre à jour une annonce
router.put("/:id", requireAuthUser, ControledAcces("admin"), announcementController.updateAnnouncement);

// Supprimer une annonce
router.delete("/:id", requireAuthUser, ControledAcces("admin"), announcementController.deleteAnnouncement);

// Marquer une annonce comme vue
router.post("/:id/view", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), announcementController.markAsViewed);

// Épingler/Désépingler une annonce
router.patch("/:id/toggle-pin", requireAuthUser, ControledAcces("admin"), announcementController.togglePin);

module.exports = router;
