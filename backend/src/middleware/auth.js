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

/** Sets `req.user` when a valid Bearer token is present; otherwise `req.user` is left unset. */
const optionalAuth = (req, res, next) => {
  req.user = undefined;
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch {
    // ignore invalid token for public catalog routes
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware, optionalAuth };
