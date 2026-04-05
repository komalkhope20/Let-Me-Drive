// ============================================
// middleware/authMiddleware.js - JWT Protection
// ============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Token should be in Authorization header: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user info to request (excluding password)
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found. Token invalid.' });
      }

      next();
    } catch (err) {
      console.error('Auth Middleware Error:', err.message);
      return res.status(401).json({ message: 'Not authorized. Token failed.' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized. No token provided.' });
  }
};

module.exports = { protect };
