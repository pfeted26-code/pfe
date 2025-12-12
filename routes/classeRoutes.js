const express = require("express");
const router = express.Router();
const classeController = require("../controllers/classeController");
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");

// ============================================
// 📋 CRUD Operations
// ============================================

// Créer une classe
router.post("/createClasse", requireAuthUser, ControledAcces("admin", "enseignant"), classeController.createClasse);

// Récupérer toutes les classes
router.get("/getAllClasses", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), classeController.getAllClasses);

// Récupérer une classe par ID
router.get("/getClasseById/:id", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), classeController.getClasseById);

// Mettre à jour une classe
router.put("/updateClasse/:id", requireAuthUser, ControledAcces("admin", "enseignant"), classeController.updateClasse);

// Supprimer une classe
router.delete("/deleteClasse/:id", requireAuthUser, ControledAcces("admin"), classeController.deleteClasse);

// Supprimer toutes les classes
router.delete("/deleteAllClasses", requireAuthUser, ControledAcces("admin"), classeController.deleteAllClasses);

// ============================================
// 📊 Statistics & Information
// ============================================

// Get class statistics
router.get("/getClasseStats/:id", requireAuthUser, ControledAcces("admin", "enseignant"), classeController.getClasseStats);

// Get all students in a class
router.get("/getClasseStudents/:id", requireAuthUser, ControledAcces("admin", "enseignant"), classeController.getClasseStudents);

// Get all teachers in a class
router.get("/getClasseTeachers/:id", requireAuthUser, ControledAcces("admin", "enseignant"), classeController.getClasseTeachers);

// Get all courses in a class
router.get("/getClasseCourses/:id", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), classeController.getClasseCourses);

// ============================================
// 👥 Student Management
// ============================================

// Add students to a class
router.post("/addStudents/:id", requireAuthUser, ControledAcces("admin", "enseignant"), classeController.addStudentsToClasse);

// Remove students from a class
router.post("/removeStudents/:id", requireAuthUser, ControledAcces("admin", "enseignant"), classeController.removeStudentsFromClasse);

// ============================================
// 👨‍🏫 Teacher Management
// ============================================

// Add teachers to a class
router.post("/addTeachers/:id", requireAuthUser, ControledAcces("admin"), classeController.addTeachersToClasse);

// Remove teachers from a class
router.post("/removeTeachers/:id", requireAuthUser, ControledAcces("admin"), classeController.removeTeachersFromClasse);

module.exports = router;
