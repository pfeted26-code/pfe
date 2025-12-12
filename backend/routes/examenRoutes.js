// Backend - routes/examenRoutes.js

const express = require("express");
const router = express.Router();
const examController = require("../controllers/examenController");
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");
const upload = require("../middlewares/assignments");

// ====================== EXAM ROUTES ====================== //

router.post(
  "/create",
  requireAuthUser,
  ControledAcces("admin", "enseignant"),
  examController.createExamen
);

router.get(
  "/getAll",
  requireAuthUser,
  ControledAcces("admin", "enseignant", "etudiant"),
  examController.getAllExamens
);

router.get(
  "/getById/:id",
  requireAuthUser,
  ControledAcces("admin", "enseignant", "etudiant"),
  examController.getExamenById
);

router.put(
  "/update/:id",
  requireAuthUser,
  ControledAcces("admin", "enseignant"),
  examController.updateExamen
);

router.delete(
  "/delete/:id",
  requireAuthUser,
  ControledAcces("admin", "enseignant"),
  examController.deleteExamen
);

// ✅ Submit assignment - make sure 'file' matches frontend
router.post(
  "/submitAssignment/:examenId",
  requireAuthUser,
  ControledAcces("etudiant"),
  upload.single("file"), // ✅ Must match FormData key in frontend
  examController.submitAssignment
);

// ✅ Download assignment file
router.get(
  "/downloadAssignmentFile/:examenId/:studentId",
  requireAuthUser,
  ControledAcces("admin", "enseignant", "etudiant"),
  examController.downloadAssignmentFile
);

// ✅ Download all assignment files (ZIP)
router.get(
  "/downloadAllAssignmentFiles/:examenId",
  requireAuthUser,
  ControledAcces("admin", "enseignant"),
  examController.downloadAllAssignmentFiles
);

// ✅ Get assignment statistics
router.get(
  "/getAssignmentStats/:examenId",
  requireAuthUser,
  ControledAcces("admin", "enseignant"),
  examController.getAssignmentStats
);

// ✅ Export assignment data
router.get(
  "/exportAssignmentData/:examenId",
  requireAuthUser,
  ControledAcces("admin", "enseignant"),
  examController.exportAssignmentData
);

module.exports = router;
