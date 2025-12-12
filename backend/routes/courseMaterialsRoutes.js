const express = require("express");
const router = express.Router();

const {
  uploadMaterial,
  getMaterialsByCourse,
  getMaterial,
  deleteMaterial
} = require("../controllers/courseMaterialController");

const uploadfile = require("../middlewares/courses");
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");

// -----------------------------
// Upload a course material
// -----------------------------
router.post(
  "/upload/:coursId",
  requireAuthUser,
  ControledAcces("admin", "enseignant"),
  uploadfile.single("file"),
  uploadMaterial
);

// -----------------------------
// Get all materials of a course
// -----------------------------
router.get(
  "/course/:coursId",
  requireAuthUser,
  ControledAcces("admin", "enseignant", "etudiant"),
  getMaterialsByCourse
);

// -----------------------------
// Get a single material
// -----------------------------
router.get(
  "/getMaterial/:id",
  requireAuthUser,
  ControledAcces("admin", "enseignant", "etudiant"),
  getMaterial
);

// -----------------------------
// Delete a material
// -----------------------------
router.delete(
  "/deleteMaterial/:id",
  requireAuthUser,
  ControledAcces("admin", "enseignant"),
  deleteMaterial
);

module.exports = router;
