// middleware/auth.js
const auth = async (req, res, next) => {
  try {
    // For development - simple userId check
    // In production, implement proper JWT authentication
    const userId = req.headers['x-user-id'] || req.body.userId || req.query.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required - userId missing'
      });
    }

    req.userId = userId;
    next();

  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

module.exports = auth;
