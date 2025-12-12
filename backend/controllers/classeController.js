const Classe = require("../models/classeSchema");
const User = require("../models/userSchema");
const Cours = require("../models/coursSchema");

// 🟢 Create
module.exports.createClasse = async (req, res) => {
  try {
    const newClasse = await Classe.create(req.body);
    res.status(201).json({
      message: "Classe créée avec succès ✅",
      classe: newClasse,
    });
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la création", error: error.message });
  }
};

// 🔵 Get All
module.exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Classe.find()
      .populate("cours", "nom code semestre credits")
      .populate("etudiants", "prenom nom email")
      .populate("enseignants", "prenom nom email specialite");
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🟡 Get by ID
module.exports.getClasseById = async (req, res) => {
  try {
    const classe = await Classe.findById(req.params.id)
      .populate({
        path: "cours",
        select: "nom code semestre",
        populate: {
          path: "emplois",
          select: "jourSemaine heureDebut heureFin salle",
        },
      })
      .populate("etudiants", "prenom nom email")
      .populate("enseignants", "prenom nom email");

    if (!classe)
      return res.status(404).json({ message: "Classe introuvable" });

    res.status(200).json({
      message: "Classe trouvée ✅",
      classe,
    });
  } catch (error) {
    console.error("❌ Erreur getClasseById:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🟠 Update (avec mise à jour des relations)
module.exports.updateClasse = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const classe = await Classe.findById(id);
    if (!classe) return res.status(404).json({ message: "Classe introuvable" });

    // Store old relations before update
    const oldEnseignants = [...classe.enseignants];
    const oldEtudiants = [...classe.etudiants];

    // 🔹 Mise à jour simple des champs
    Object.assign(classe, updateData);
    await classe.save();

    // 🔹 Synchronisation relations enseignants
    if (updateData.enseignants) {
      // Supprimer la classe des anciens enseignants
      await User.updateMany(
        { _id: { $in: oldEnseignants } },
        { $pull: { classes: classe._id } }
      );

      // Ajouter la classe aux nouveaux enseignants
      await User.updateMany(
        { _id: { $in: updateData.enseignants } },
        { $addToSet: { classes: classe._id } }
      );
    }

    // 🔹 Synchronisation relations étudiants
    if (updateData.etudiants) {
      // Retirer la classe des anciens étudiants
      await User.updateMany(
        { _id: { $in: oldEtudiants } },
        { $unset: { classe: "" } }
      );

      // Ajouter la classe aux nouveaux étudiants
      await User.updateMany(
        { _id: { $in: updateData.etudiants } },
        { $set: { classe: classe._id } }
      );
    }

    res.status(200).json({
      message: "Classe et relations mises à jour avec succès ✅",
      classe,
    });
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

// 🔴 Delete (avec suppression relationnelle)
module.exports.deleteClasse = async (req, res) => {
  try {
    const { id } = req.params;
    const classe = await Classe.findById(id);
    if (!classe) return res.status(404).json({ message: "Classe introuvable" });

    // 🔹 Supprimer la référence dans les enseignants
    await User.updateMany(
      { _id: { $in: classe.enseignants } },
      { $pull: { classes: classe._id } }
    );

    // 🔹 Supprimer la référence dans les étudiants
    await User.updateMany(
      { _id: { $in: classe.etudiants } },
      { $unset: { classe: "" } }
    );

    // 🔹 Supprimer les cours liés à cette classe
    await Cours.deleteMany({ classe: classe._id });

    // 🔹 Supprimer la classe elle-même
    await Classe.findByIdAndDelete(id);

    res.status(200).json({ message: "Classe et ses relations supprimées avec succès 🗑️" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
  }
};

// 🛑 Delete all classes (cascade)
module.exports.deleteAllClasses = async (req, res) => {
  try {
    const allClasses = await Classe.find();
    const classIds = allClasses.map((c) => c._id);

    // Supprimer relations dans Users et Cours
    await User.updateMany({}, { $pull: { classes: { $in: classIds } }, $unset: { classe: "" } });
    await Cours.deleteMany({ classe: { $in: classIds } });

    const result = await Classe.deleteMany({});
    res.status(200).json({
      message: `Toutes les classes et leurs relations ont été supprimées ✅`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📊 Get class statistics
module.exports.getClasseStats = async (req, res) => {
  try {
    const { id } = req.params;
    const classe = await Classe.findById(id)
      .populate("etudiants", "prenom nom")
      .populate("enseignants", "prenom nom")
      .populate("cours", "nom");

    if (!classe) return res.status(404).json({ message: "Classe introuvable" });

    const stats = {
      nom: classe.nom,
      totalEtudiants: classe.etudiants.length,
      totalEnseignants: classe.enseignants.length,
      totalCours: classe.cours.length,
      annee: classe.annee,
      specialisation: classe.specialisation,
      anneeAcademique: classe.anneeAcademique,
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👥 Add students to class
module.exports.addStudentsToClasse = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: "studentIds doit être un tableau" });
    }

    const classe = await Classe.findById(id);
    if (!classe) return res.status(404).json({ message: "Classe introuvable" });

    // Add students to class
    classe.etudiants.push(...studentIds);
    await classe.save();

    // Update students' class reference
    await User.updateMany(
      { _id: { $in: studentIds } },
      { $set: { classe: classe._id } }
    );

    res.status(200).json({
      message: "Étudiants ajoutés avec succès ✅",
      classe,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 👥 Remove students from class
module.exports.removeStudentsFromClasse = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: "studentIds doit être un tableau" });
    }

    const classe = await Classe.findById(id);
    if (!classe) return res.status(404).json({ message: "Classe introuvable" });

    // Remove students from class
    classe.etudiants = classe.etudiants.filter(
      (studentId) => !studentIds.includes(studentId.toString())
    );
    await classe.save();

    // Remove class reference from students
    await User.updateMany(
      { _id: { $in: studentIds } },
      { $unset: { classe: "" } }
    );

    res.status(200).json({
      message: "Étudiants retirés avec succès ✅",
      classe,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 👨‍🏫 Add teachers to class
module.exports.addTeachersToClasse = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherIds } = req.body;

    if (!teacherIds || !Array.isArray(teacherIds)) {
      return res.status(400).json({ message: "teacherIds doit être un tableau" });
    }

    const classe = await Classe.findById(id);
    if (!classe) return res.status(404).json({ message: "Classe introuvable" });

    // Add teachers to class
    classe.enseignants.push(...teacherIds);
    await classe.save();

    // Update teachers' classes reference
    await User.updateMany(
      { _id: { $in: teacherIds } },
      { $addToSet: { classes: classe._id } }
    );

    res.status(200).json({
      message: "Enseignants ajoutés avec succès ✅",
      classe,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 👨‍🏫 Remove teachers from class
module.exports.removeTeachersFromClasse = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherIds } = req.body;

    if (!teacherIds || !Array.isArray(teacherIds)) {
      return res.status(400).json({ message: "teacherIds doit être un tableau" });
    }

    const classe = await Classe.findById(id);
    if (!classe) return res.status(404).json({ message: "Classe introuvable" });

    // Remove teachers from class
    classe.enseignants = classe.enseignants.filter(
      (teacherId) => !teacherIds.includes(teacherId.toString())
    );
    await classe.save();

    // Remove class reference from teachers
    await User.updateMany(
      { _id: { $in: teacherIds } },
      { $pull: { classes: classe._id } }
    );

    res.status(200).json({
      message: "Enseignants retirés avec succès ✅",
      classe,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 📚 Get all students in a class
module.exports.getClasseStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const classe = await Classe.findById(id).populate(
      "etudiants",
      "prenom nom email NumTel Adresse datedeNaissance"
    );

    if (!classe) return res.status(404).json({ message: "Classe introuvable" });

    res.status(200).json({
      classe: classe.nom,
      totalStudents: classe.etudiants.length,
      students: classe.etudiants,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👨‍🏫 Get all teachers in a class
module.exports.getClasseTeachers = async (req, res) => {
  try {
    const { id } = req.params;
    const classe = await Classe.findById(id).populate(
      "enseignants",
      "prenom nom email specialite NumTelEnseignant"
    );

    if (!classe) return res.status(404).json({ message: "Classe introuvable" });

    res.status(200).json({
      classe: classe.nom,
      totalTeachers: classe.enseignants.length,
      teachers: classe.enseignants,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📚 Get all courses in a class
module.exports.getClasseCourses = async (req, res) => {
  try {
    const { id } = req.params;
    const classe = await Classe.findById(id).populate(
      "cours",
      "nom code semestre credits description"
    );

    if (!classe) return res.status(404).json({ message: "Classe introuvable" });

    res.status(200).json({
      classe: classe.nom,
      totalCourses: classe.cours.length,
      courses: classe.cours,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
