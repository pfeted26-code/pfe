const jwt = require("jsonwebtoken");
const userModel = require("../models/userSchema");

/**
 * 🧩 Middleware d'authentification via JWT
 * Vérifie la présence, la validité et l'appartenance du token utilisateur.
 */
const requireAuthUser = async (req, res, next) => {
  try {
    // 🔍 Récupération du token depuis cookies ou headers
    const token =
      req.cookies?.jwt ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({ message: "⛔ Accès refusé : aucun token fourni" });
    }

    // ✅ Vérification et décodage du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Token invalide" });
    }

    // 🔍 Récupération de l'utilisateur depuis la base
    const user = await userModel.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // 🔓 Authentification réussie → On attache l’utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Erreur Auth Middleware:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "⏰ Session expirée, veuillez vous reconnecter" });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "⚠️ Token non valide" });
    }

    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

module.exports = { requireAuthUser };
