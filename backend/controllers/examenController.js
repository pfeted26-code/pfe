const Examen = require("../models/examenSchema");
const Cours = require("../models/coursSchema");
const Classe = require("../models/classeSchema");
const User = require("../models/userSchema");
const Notification = require("../models/notificationSchema");
const path = require("path");
const fs = require("fs");
const archiver = require('archiver');

/* ===========================================================
   🟢 CREATE EXAM
=========================================================== */
module.exports.createExamen = async (req, res) => {
  try {
    const { nom, type, date, noteMax, description, coursId, enseignantId, classeId } = req.body;

    if (!nom || !type || !date || !noteMax || !coursId) {
      return res.status(400).json({ message: "Tous les champs obligatoires ne sont pas remplis." });
    }

    const cours = await Cours.findById(coursId);
    if (!cours) return res.status(404).json({ message: "Cours introuvable." });

    let enseignant = enseignantId ? await User.findById(enseignantId) : null;
    if (enseignant && enseignant.role !== "enseignant") {
      return res.status(400).json({ message: "Rôle enseignant invalide." });
    }

    let classe = classeId
      ? await Classe.findById(classeId).populate("etudiants", "_id prenom nom")
      : null;

    const newExam = new Examen({
      nom,
      type,
      date,
      noteMax,
      description,
      coursId,
      enseignantId,
      classeId,
    });
    await newExam.save();

    await Promise.all([
      Cours.findByIdAndUpdate(coursId, { $addToSet: { examens: newExam._id } }),
      classe ? Classe.findByIdAndUpdate(classeId, { $addToSet: { examens: newExam._id } }) : null,
      enseignant ? User.findByIdAndUpdate(enseignantId, { $addToSet: { examens: newExam._id } }) : null,
    ]);

    // === NOTIFICATION CREATION ===
    await sendExamNotification(req, classe, `📘 Nouvel examen ajouté : "${nom}" (${type}) prévu le ${new Date(date).toLocaleDateString()}`);

    res.status(201).json({ message: "Examen créé avec succès ✅", examen: newExam });
  } catch (error) {
    console.error("❌ Erreur createExamen:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ✏️ UPDATE EXAM
=========================================================== */
module.exports.updateExamen = async (req, res) => {
  try {
    const updatedExam = await Examen.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedExam) return res.status(404).json({ message: "Examen introuvable." });

    const classe = await Classe.findById(updatedExam.classeId).populate("etudiants", "_id prenom nom");

    await sendExamNotification(req, classe, `✏️ L'examen "${updatedExam.nom}" a été modifié. Consultez les détails.`);

    res.status(200).json({ message: "Examen mis à jour ✅", examen: updatedExam });
  } catch (error) {
    console.error("❌ Erreur updateExamen:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ❌ DELETE EXAM
=========================================================== */
module.exports.deleteExamen = async (req, res) => {
  try {
    const deletedExam = await Examen.findByIdAndDelete(req.params.id);
    if (!deletedExam) return res.status(404).json({ message: "Examen introuvable." });

    await Promise.all([
      Cours.updateMany({}, { $pull: { examens: deletedExam._id } }),
      Classe.updateMany({}, { $pull: { examens: deletedExam._id } }),
      User.updateMany({}, { $pull: { examens: deletedExam._id } }),
    ]);

    const classe = await Classe.findById(deletedExam.classeId).populate("etudiants", "_id prenom nom");

    await sendExamNotification(req, classe, `🚫 L'examen "${deletedExam.nom}" a été annulé.`);

    res.status(200).json({ message: "Examen supprimé avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur deleteExamen:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET ALL EXAMS
=========================================================== */
module.exports.getAllExamens = async (req, res) => {
  try {
    let examens;

    if (req.user.role === "etudiant") {
      const user = await User.findById(req.user.id).populate("classe");
      if (!user || !user.classe) {
        return res.status(404).json({ message: "Classe de l'étudiant introuvable." });
      }

      examens = await Examen.find({ classeId: user.classe._id })
        .populate("coursId", "nom code")
        .populate("enseignantId", "nom prenom email")
        .populate("classeId", "nom annee specialisation");
    } else if (req.user.role === "enseignant") {
      examens = await Examen.find({ enseignantId: req.user.id })
        .populate("coursId", "nom code")
        .populate({
          path: "classeId",
          select: "nom annee specialisation",
          populate: {
            path: "etudiants",
            select: "nom prenom email"
          }
        });
    } else {
      examens = await Examen.find()
        .populate("coursId", "nom code")
        .populate("enseignantId", "nom prenom email")
        .populate("classeId", "nom annee specialisation etudiants")
        .populate("classeId.etudiants", "nom prenom email");
    }

    res.status(200).json(examens);
  } catch (error) {
    console.error("❌ Erreur getAllExamens:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   🔍 GET EXAM BY ID
=========================================================== */
module.exports.getExamenById = async (req, res) => {
  try {
    const examen = await Examen.findById(req.params.id)
      .populate("coursId", "nom code")
      .populate("enseignantId", "nom prenom email")
      .populate("classeId", "nom annee specialisation")
      .populate("submissions.studentId", "nom prenom email"); // ✅ Populate student info
    
    if (!examen) return res.status(404).json({ message: "Examen introuvable." });
    
    res.status(200).json(examen);
  } catch (error) {
    console.error("❌ Erreur getExamenById:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   📤 SUBMIT ASSIGNMENT - CORRECTED
=========================================================== */
module.exports.submitAssignment = async (req, res) => {
  try {
    const { examenId } = req.params;
    const studentId = req.user.id; // ✅ From auth middleware
    
    console.log("📝 Submit Assignment:");
    console.log("Examen ID:", examenId);
    console.log("Student ID:", studentId);
    console.log("File:", req.file);

    // ✅ Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Fichier requis" });
    }

    // ✅ Find the exam
    const examen = await Examen.findById(examenId).populate("enseignantId");
    if (!examen) {
      return res.status(404).json({ message: "Examen introuvable" });
    }

    // ✅ Check if it's an assignment type (case-insensitive)
    if (examen.type.toLowerCase() !== "assignment") {
      return res.status(400).json({ 
        message: "Impossible de soumettre un fichier pour cet examen." 
      });
    }

    // ✅ Check if past due date
    if (examen.date && new Date(examen.date) < new Date()) {
      return res.status(400).json({ 
        message: "La date limite de soumission est dépassée" 
      });
    }

    // ✅ Initialize submissions array if not exists
    if (!examen.submissions) {
      examen.submissions = [];
    }

    // ✅ Check if student already submitted
    const existingSubmissionIndex = examen.submissions.findIndex(
      sub => sub.studentId.toString() === studentId.toString()
    );

    if (existingSubmissionIndex !== -1) {
      return res.status(400).json({ 
        message: "Vous avez déjà soumis ce devoir" 
      });
    }

    // ✅ Create submission object
    const newSubmission = {
      studentId: studentId,
      file: req.file.filename, // ✅ Use filename from multer
      dateSubmission: new Date(),
      note: null,
      commentaire: null
    };

    // ✅ Add submission
    examen.submissions.push(newSubmission);
    await examen.save();

    console.log("✅ Assignment submitted successfully");

    // ✅ Send notification to teacher
    if (examen.enseignantId) {
      try {
        const student = await User.findById(studentId);
        const studentName = student ? `${student.prenom} ${student.nom}` : "Un étudiant";
        
        const notif = await Notification.create({
          message: `📩 ${studentName} a soumis l'assignment "${examen.nom}"`,
          type: "submission",
          utilisateur: examen.enseignantId._id,
        });

        await User.findByIdAndUpdate(examen.enseignantId._id, { 
          $push: { notifications: notif._id } 
        });

        if (req.app.io) {
          req.app.io.to(examen.enseignantId._id.toString()).emit("receiveNotification", {
            message: notif.message,
            type: notif.type,
            date: new Date(),
          });
        }
      } catch (notifError) {
        console.error("⚠️ Erreur notification:", notifError);
        // Don't fail the submission if notification fails
      }
    }

    res.status(200).json({ 
      message: "Fichier soumis avec succès ✅", 
      submission: newSubmission 
    });

  } catch (err) {
    console.error("❌ submitAssignment error:", err);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: err.message 
    });
  }
};

/* ===========================================================
   📥 DOWNLOAD ASSIGNMENT FILE
=========================================================== */
module.exports.downloadAssignmentFile = async (req, res) => {
  try {
    const { examenId, studentId } = req.params;

    const examen = await Examen.findById(examenId);
    if (!examen) {
      return res.status(404).json({ message: "Examen introuvable" });
    }

    // Check if user has access to this exam
    if (req.user.role === "enseignant" && examen.enseignantId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    if (req.user.role === "etudiant" && studentId !== req.user.id) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    const submission = examen.submissions.find(
      sub => sub.studentId.toString() === studentId
    );

    if (!submission || !submission.file) {
      return res.status(404).json({ message: "Fichier non trouvé" });
    }

    const filePath = path.join(__dirname, "../public/assignments", submission.file);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Fichier non trouvé sur le serveur" });
    }

    res.download(filePath);
  } catch (error) {
    console.error("❌ Erreur downloadAssignmentFile:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   📦 DOWNLOAD ALL ASSIGNMENT FILES
=========================================================== */
module.exports.downloadAllAssignmentFiles = async (req, res) => {
  try {
    const { examenId } = req.params;

    const examen = await Examen.findById(examenId).populate("submissions.studentId", "nom prenom");
    if (!examen) {
      return res.status(404).json({ message: "Examen introuvable" });
    }

    // Check if teacher has access to this exam
    if (req.user.role === "enseignant" && examen.enseignantId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    const submissions = examen.submissions.filter(sub => sub.file);

    if (submissions.length === 0) {
      return res.status(404).json({ message: "Aucun fichier soumis" });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${examen.nom}_submissions.zip"`);

    archive.pipe(res);

    for (const submission of submissions) {
      const filePath = path.join(__dirname, "../public/assignments", submission.file);
      if (fs.existsSync(filePath)) {
        const student = submission.studentId;
        const studentName = student ? `${student.prenom}_${student.nom}` : `student_${submission.studentId}`;
        const fileName = `${studentName}_${submission.file}`;
        archive.file(filePath, { name: fileName });
      }
    }

    archive.finalize();
  } catch (error) {
    console.error("❌ Erreur downloadAllAssignmentFiles:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   📊 GET ASSIGNMENT STATS
=========================================================== */
module.exports.getAssignmentStats = async (req, res) => {
  try {
    const { examenId } = req.params;

    const examen = await Examen.findById(examenId).populate("classeId", "etudiants");
    if (!examen) {
      return res.status(404).json({ message: "Examen introuvable" });
    }

    // Check if teacher has access to this exam
    if (req.user.role === "enseignant" && examen.enseignantId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    const totalStudents = examen.classeId?.etudiants?.length || 0;
    const submissions = examen.submissions || [];
    const submittedCount = submissions.length;
    const gradedCount = submissions.filter(sub => sub.note !== null && sub.note !== undefined).length;

    const grades = submissions
      .filter(sub => sub.note !== null && sub.note !== undefined)
      .map(sub => sub.note);

    const stats = {
      totalStudents,
      submittedCount,
      gradedCount,
      pendingCount: submittedCount - gradedCount,
      submissionRate: totalStudents > 0 ? (submittedCount / totalStudents * 100).toFixed(1) : 0,
      gradingRate: submittedCount > 0 ? (gradedCount / submittedCount * 100).toFixed(1) : 0,
      averageGrade: grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : null,
      highestGrade: grades.length > 0 ? Math.max(...grades) : null,
      lowestGrade: grades.length > 0 ? Math.min(...grades) : null,
      gradeDistribution: calculateGradeDistribution(grades, examen.noteMax)
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("❌ Erreur getAssignmentStats:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   📤 EXPORT ASSIGNMENT DATA
=========================================================== */
module.exports.exportAssignmentData = async (req, res) => {
  try {
    const { examenId } = req.params;
    const { format = 'csv' } = req.query;

    const examen = await Examen.findById(examenId)
      .populate("submissions.studentId", "nom prenom email")
      .populate("enseignantId", "nom prenom")
      .populate("coursId", "nom code")
      .populate("classeId", "nom");

    if (!examen) {
      return res.status(404).json({ message: "Examen introuvable" });
    }

    // Check if teacher has access to this exam
    if (req.user.role === "enseignant" && examen.enseignantId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    const submissions = examen.submissions || [];

    if (format === 'csv') {
      const csvData = [
        ['Student Name', 'Email', 'Submission Date', 'Grade', 'Max Grade', 'Status', 'File Submitted'],
        ...submissions.map(sub => [
          sub.studentId ? `${sub.studentId.prenom} ${sub.studentId.nom}` : 'Unknown',
          sub.studentId?.email || '',
          sub.dateSubmission ? new Date(sub.dateSubmission).toLocaleDateString() : '',
          sub.note !== null && sub.note !== undefined ? sub.note : '',
          examen.noteMax || '',
          sub.note !== null && sub.note !== undefined ? 'Graded' : 'Submitted',
          sub.file ? 'Yes' : 'No'
        ])
      ];

      const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${examen.nom}_results.csv"`);
      res.send(csvContent);
    } else {
      // JSON format
      const jsonData = {
        assignment: {
          name: examen.nom,
          description: examen.description,
          dueDate: examen.date,
          maxGrade: examen.noteMax,
          course: examen.coursId?.nom,
          class: examen.classeId?.nom,
          teacher: examen.enseignantId ? `${examen.enseignantId.prenom} ${examen.enseignantId.nom}` : ''
        },
        submissions: submissions.map(sub => ({
          student: {
            name: sub.studentId ? `${sub.studentId.prenom} ${sub.studentId.nom}` : 'Unknown',
            email: sub.studentId?.email || ''
          },
          submissionDate: sub.dateSubmission,
          grade: sub.note,
          maxGrade: examen.noteMax,
          status: sub.note !== null && sub.note !== undefined ? 'graded' : 'submitted',
          fileSubmitted: !!sub.file,
          feedback: sub.commentaire || ''
        }))
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${examen.nom}_results.json"`);
      res.json(jsonData);
    }
  } catch (error) {
    console.error("❌ Erreur exportAssignmentData:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

/* ===========================================================
   ⚙️ UTILITY FUNCTIONS
=========================================================== */
function calculateGradeDistribution(grades, maxGrade) {
  if (grades.length === 0) return {};

  const distribution = {
    'A (90-100%)': 0,
    'B (80-89%)': 0,
    'C (70-79%)': 0,
    'D (60-69%)': 0,
    'F (0-59%)': 0
  };

  grades.forEach(grade => {
    const percentage = maxGrade > 0 ? (grade / maxGrade) * 100 : 0;
    if (percentage >= 90) distribution['A (90-100%)']++;
    else if (percentage >= 80) distribution['B (80-89%)']++;
    else if (percentage >= 70) distribution['C (70-79%)']++;
    else if (percentage >= 60) distribution['D (60-69%)']++;
    else distribution['F (0-59%)']++;
  });

  return distribution;
}

/* ===========================================================
   ⚙️ FONCTION UTILITAIRE : envoi notification + socket
=========================================================== */
async function sendExamNotification(req, classe, message) {
  try {
    if (!classe || !classe.etudiants?.length) return;

    const io = req.app.io; // ✅ Changed from req.io to req.app.io
    if (!io) {
      console.warn("⚠️ io non trouvé dans req.app (socket non initialisé)");
      return;
    }

    for (const etu of classe.etudiants) {
      const notif = await Notification.create({
        message,
        type: "rappel",
        utilisateur: etu._id,
      });

      await User.findByIdAndUpdate(etu._id, { $push: { notifications: notif._id } });

      io.to(etu._id.toString()).emit("receiveNotification", {
        message,
        type: "rappel",
        date: new Date(),
      });
    }
  } catch (err) {
    console.error("⚠️ Erreur lors de l'envoi des notifications :", err);
  }
}
