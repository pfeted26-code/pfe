const express = require("express");
const router = express.Router();
const seanceController = require("../controllers/seanceController");
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");

// ============================================
// 📋 CRUD Operations
// ============================================

// Créer une séance
router.post(
  "/createSeance", 
  requireAuthUser, 
  ControledAcces("admin", "enseignant"), 
  seanceController.createSeance
);

// Récupérer toutes les séances (filtered by role in controller)
router.get(
  "/getAllSeances", 
  requireAuthUser, 
  ControledAcces("admin", "enseignant", "etudiant"), 
  seanceController.getAllSeances
);

// Récupérer une séance par ID
router.get(
  "/getSeanceById/:id", 
  requireAuthUser, 
  ControledAcces("admin", "enseignant", "etudiant"), 
  seanceController.getSeanceById
);

// Récupérer les séances d'un enseignant
router.get(
  "/getByEnseignant/:enseignantId", 
  requireAuthUser, 
  ControledAcces("admin", "enseignant"), 
  seanceController.getSeancesByEnseignant
);

// Récupérer les séances d'une classe
router.get(
  "/getByClasse/:classeId", 
  requireAuthUser, 
  ControledAcces("admin", "enseignant", "etudiant"), 
  seanceController.getSeancesByClasse
);

// Mettre à jour une séance
router.put(
  "/updateSeance/:id", 
  requireAuthUser, 
  ControledAcces("admin", "enseignant"), 
  seanceController.updateSeance
);

// Supprimer une séance
router.delete(
  "/deleteSeance/:id", 
  requireAuthUser, 
  ControledAcces("admin", "enseignant"), 
  seanceController.deleteSeance
);

// Supprimer toutes les séances
router.delete(
  "/deleteAllSeances", 
  requireAuthUser, 
  ControledAcces("admin"), 
  seanceController.deleteAllSeances
);

module.exports = router;