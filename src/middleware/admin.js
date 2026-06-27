const adminAuth = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

const superAdminOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== 'super_admin' && req.user.role !== 'server_owner')) {
    return res.status(403).json({ success: false, message: 'Super Admin access required' });
  }
  next();
};

const serverOwnerOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'server_owner') {
    return res.status(403).json({ success: false, message: 'Server Owner access required' });
  }
  next();
};

module.exports = { adminAuth, superAdminOnly, serverOwnerOnly };
