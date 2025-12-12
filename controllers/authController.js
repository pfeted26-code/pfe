const User = require('../models/userSchema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

// 1. FORGOT PASSWORD — Send secure code
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet email." });

    // Generate 8 random characters for reset code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const resetCode = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    // Store code + expiration + attempt counter
    user.resetCode = resetCode;
    user.resetCodeExpires = Date.now() + 10 * 60 * 1000; // valid 10 minutes
    user.resetAttempts = 0;
    await user.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '🔒 Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial; max-width: 600px; margin:auto; background:#f9f9f9; padding:20px; border-radius:10px;">
          <h2 style="text-align:center; color:#4F46E5;">EduNex</h2>
          <p>Bonjour <strong>${user.prenom}</strong>,</p>
          <p>Voici votre code de réinitialisation :</p>
          <div style="text-align:center; margin:20px;">
            <span style="background:#4F46E5; color:#fff; padding:10px 20px; border-radius:8px; font-size:22px; font-weight:bold;">${resetCode}</span>
          </div>
          <p>Ce code est valable 10 minutes.</p>
          <p style="font-size:12px; color:#777;">Ignorez cet email si vous n’êtes pas à l’origine de la demande.</p>
        </div>
      `,
    });

    console.log(`Code envoyé à ${user.email}: ${resetCode}`);
    res.status(200).json({ message: "Code de réinitialisation envoyé par email." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la demande de réinitialisation." });
  }
};

// 2. RESET PASSWORD — Check code & change password
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    // Check code & expiration
    if (!user.resetCode || user.resetCodeExpires < Date.now()) {
      return res.status(400).json({ message: "Le code a expiré ou est invalide." });
    }

    // Limit attempts
    if (user.resetAttempts >= 5) {
      return res.status(429).json({ message: "Trop de tentatives. Veuillez redemander un nouveau code." });
    }

    // Case-insensitive comparison for code
    if (user.resetCode.toUpperCase() !== code.toUpperCase()) {
      user.resetAttempts += 1;
      await user.save();
      return res.status(400).json({ message: "Code incorrect." });
    }

    // Password complexity check (add more rules as needed)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
      });
    }

    // Update password (bcrypt handled in Mongoose pre('save'))
    user.password = newPassword;

    // Clean up reset fields
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    user.resetAttempts = undefined;
    await user.save();

    // Confirmation email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '✅ Mot de passe réinitialisé avec succès',
      html: `
        <div style="font-family: Arial; max-width: 600px; margin:auto; background:#f3f4f6; padding:20px; border-radius:10px; text-align:center;">
          <h2 style="color:#4F46E5;">EduNex</h2>
          <p>Bonjour <strong>${user.prenom}</strong>,</p>
          <p>Votre mot de passe a été réinitialisé avec succès 🎉</p>
          <a href="http://localhost:3000/login" style="display:inline-block; margin:20px 0; background:#4F46E5; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none;">Se connecter</a>
          <p style="font-size:12px; color:#666;">Si vous n’êtes pas à l’origine de ce changement, contactez immédiatement l’administrateur.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès et email de confirmation envoyé !" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la réinitialisation du mot de passe." });
  }
};
