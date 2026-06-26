const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -refreshToken -devices');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'Account is banned' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password -refreshToken -devices');
      if (user && !user.isBanned) {
        req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
};

module.exports = { protect, optionalAuth };
