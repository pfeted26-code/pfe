const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  prenom: { type: String, required: true, trim: true },
  nom: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [/.+@.+\..+/, 'Veuillez entrer une adresse email valide']
  },
  password: { 
    type: String, 
    required: true,
    match: [/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/, 'Mot de passe faible']
  },
  role: { type: String, enum: ["etudiant", "enseignant", "admin"], default: "etudiant" ,required: true },
  image_User:  String ,
  verified: { type: Boolean, default: false },
  Status: { type: String , default: false },

  // Étudiant
  NumTel: String,
  Adresse: String,
  datedeNaissance: Date,
  classe: { type: mongoose.Schema.Types.ObjectId, ref: "Classe" },
  dateInscription: Date,

  // Enseignant
  specialite: String,
  dateEmbauche: Date,
  NumTelEnseignant: String,

  // Admin
  adminCode: String,

  // Relations
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Classe" }],
  coursEnseignes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cours" }],
  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Note" }],
  presences: [{ type: mongoose.Schema.Types.ObjectId, ref: "Presence" }],
  demandes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Demande" }],
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
  emploi: [{ type: mongoose.Schema.Types.ObjectId, ref: "EmploiDuTemps" }],
  notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notification" }],
  examensCrees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Examen" }],

  // Reset Password
  resetCode: String,
  resetCodeExpires: Date,
}, { timestamps: true });

/* ===========================================================
   🧂 Hash password before saving
=========================================================== */
userSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.Status = false;
    next();
  } catch (error) {
    next(error);
  }
});

/* ===========================================================
   🔐 Compare password method (for instance)
=========================================================== */
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/* ===========================================================
   🔑 Static login method
=========================================================== */
userSchema.statics.login = async function(email, password) {
  const user = await this.findOne({ email });
  if (!user) {
    throw Error('incorrect email');
  }

  const auth = await bcrypt.compare(password, user.password);
  if (!auth) {
    throw Error('incorrect password');
  }

  

  return user;
};



const User = mongoose.model('User', userSchema);
module.exports = User;
