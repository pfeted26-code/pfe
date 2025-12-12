const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const upload = require("../middlewares/images");
const { requireAuthUser } = require("../middlewares/authMiddlewares");
const { ControledAcces } = require("../middlewares/AccessControllers");

// Envoyer un message (texte ou image)
router.post("/send", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), upload.single("image"), messageController.sendMessage);

// Récupérer la conversation entre 2 utilisateurs
router.get("/conversation/:userId1/:userId2", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), messageController.getConversation);
// Récupérer tous les messages (admin uniquement)
router.get("/all", requireAuthUser, ControledAcces("admin"), messageController.getAllMessages);
// Modifier un message
router.put("/update/:id", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), messageController.updateMessage);
// Supprimer un message
router.delete("/delete/:id", requireAuthUser, ControledAcces("admin", "enseignant", "etudiant"), messageController.deleteMessage);
// Supprimer tous les messages
router.delete("/deleteAll", requireAuthUser, ControledAcces("admin"), messageController.deleteAllMessages);

module.exports = router;
