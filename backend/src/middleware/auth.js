const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    }

    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      const u = req.user;
      const role = u.role === 'admin' ? 'admin' : 'user';
      req.user = {
        id: u.id,
        email: u.email,
        role,
      };
      return next();
    }

    return res.status(401).json({ detail: 'No token provided' });
  } catch (error) {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Admin access required' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
