// middlewares/AccessControllers.js
const ControledAcces = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Utilisateur non authentifié." });
      }

      if (allowedRoles.includes(user.role)) {
        return next(); // ✅ autorisé
      }

      return res.status(403).json({ message: "⛔ Accès refusé : vous n'avez pas les droits nécessaires." });
    } catch (err) {
      console.error("Erreur dans ControledAcces:", err);
      res.status(500).json({ message: "Erreur serveur lors du contrôle d'accès." });
    }
  };
};

module.exports = { ControledAcces };
