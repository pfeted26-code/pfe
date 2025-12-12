const express = require("express");
const router = express.Router();
const edtController = require("../controllers/emploiDuTempsController");
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");

// 🟢 Create an emploi du temps
router.post("/create", requireAuthUser, ControledAcces("admin", "enseignant"), edtController.createEmploi);

// 🔍 Get all emplois du temps
router.get("/getAll", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), edtController.getAllEmplois);

// 🔍 Get emploi du temps by ID
router.get("/getById/:id", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), edtController.getEmploiById);

// ✏️ Update emploi du temps
router.put("/update/:id", requireAuthUser, ControledAcces("admin", "enseignant"), edtController.updateEmploi);

// ❌ Delete emploi du temps
router.delete("/delete/:id", requireAuthUser, ControledAcces("admin", "enseignant"), edtController.deleteEmploi);

// ❌ Delete all emplois du temps
router.delete("/deleteAll", requireAuthUser, ControledAcces("admin"), edtController.deleteAllEmplois);

module.exports = router;
