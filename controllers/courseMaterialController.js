const CourseMaterial = require("../models/courseMaterialSchema");
const Cours = require("../models/coursSchema");
const User = require("../models/userSchema");
const Notification = require("../models/notificationSchema");
const path = require("path");
const fs = require("fs");

// =========================
// UPLOAD MATERIAL + NOTIFY STUDENTS
// =========================
exports.uploadMaterial = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });

    const { titre, type, description, enseignantId } = req.body;
    const { coursId } = req.params;

    // Create material
    const material = await CourseMaterial.create({
      titre,
      type,
      description,
      fichier: req.file.filename,
      coursId,
      enseignantId
    });

    // Add to course
    const course = await Cours.findByIdAndUpdate(
      coursId,
      { $push: { materials: material._id } },
      { new: true }
    ).populate("classe");

    // ====== FIND ALL STUDENTS IN THE CLASS ======
    const students = await User.find({
      classe: course.classe._id,
      role: "etudiant"
    });

    const io = req.io || req.app?.get("io");
    const notifMessage = `📘 Nouveau matériel ajouté : ${titre}`;

    // ====== SEND NOTIFICATIONS (save + socket) ======
    for (const student of students) {
      // Save notification
      const notif = await Notification.create({
        message: notifMessage,
        type: "material",
        utilisateur: student._id,
      });

      // Attach notif to user
      await User.findByIdAndUpdate(student._id, {
        $push: { notifications: notif._id },
      });

      // Real-time socket
      if (io) {
        io.to(student._id.toString()).emit("receiveNotification", {
          message: notifMessage,
          type: "material",
          date: new Date(),
        });
      }
    }

    res.status(201).json({
      message: "Material uploaded successfully",
      material
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =========================
// GET MATERIALS OF A COURSE
// =========================
exports.getMaterialsByCourse = async (req, res) => {
  try {
    const { coursId } = req.params;
    const materials = await CourseMaterial.find({ coursId }).sort({ createdAt: -1 });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================
// GET SINGLE MATERIAL
// =========================
exports.getMaterial = async (req, res) => {
  try {
    const material = await CourseMaterial.findById(req.params.id);
    if (!material)
      return res.status(404).json({ message: "Material not found" });

    res.json(material);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =========================
// DELETE MATERIAL + NOTIFY STUDENTS
// =========================
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await CourseMaterial.findById(req.params.id);

    if (!material)
      return res.status(404).json({ message: "Material not found" });

    const course = await Cours.findById(material.coursId).populate("classe");

    // Remove file
    const filePath = path.join("public/materials", material.fichier);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Remove from course
    await Cours.findByIdAndUpdate(material.coursId, {
      $pull: { materials: material._id },
    });

    // Delete DB material
    await material.deleteOne();

    // ====== NOTIFY STUDENTS ======
    const students = await User.find({
      classe: course.classe._id,
      role: "etudiant"
    });

    const io = req.io || req.app?.get("io");
    const notifMessage = `🗑️ Le matériel "${material.titre}" a été supprimé.`;

    for (const student of students) {
      const notif = await Notification.create({
        message: notifMessage,
        type: "material",
        utilisateur: student._id,
      });

      await User.findByIdAndUpdate(student._id, {
        $push: { notifications: notif._id },
      });

      if (io) {
        io.to(student._id.toString()).emit("receiveNotification", {
          message: notifMessage,
          type: "material",
          date: new Date(),
        });
      }
    }

    res.json({ message: "Material deleted successfully" });

  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: error.message });
  }
};
