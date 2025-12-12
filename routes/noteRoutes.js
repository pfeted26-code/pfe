const express = require("express");
const router = express.Router();
const noteController = require("../controllers/noteController");
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");

// Créer une note
router.post("/create", requireAuthUser, ControledAcces("admin", "enseignant"), noteController.createNote);

// Récupérer toutes les notes
router.get("/get", requireAuthUser, ControledAcces("admin", "enseignant"), noteController.getAllNotes);

// Récupérer une note par ID
router.get("/getById/:id", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), noteController.getNoteById);

// Mettre à jour une note
router.put("/updateById/:id", requireAuthUser, ControledAcces("admin", "enseignant"), noteController.updateNote);

// Supprimer une note
router.delete("/delete/:id", requireAuthUser, ControledAcces("admin"), noteController.deleteNote);

// get note by examen and etudiant
router.get(
  "/getByExamenEtudiant/:examenId/:etudiantId",
  requireAuthUser,
  ControledAcces("admin", "enseignant", "etudiant"),
  noteController.getNoteByExamenAndEtudiant
);

// get notes for current student
router.get(
  "/getForStudent",
  requireAuthUser,
  ControledAcces("etudiant"),
  noteController.getNotesForStudent
);

module.exports = router;
