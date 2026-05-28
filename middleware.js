const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  });
}

// Admin or shopkeeper (cooperatore)
function shopMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin' && req.user.role !== 'cooperatore')
      return res.status(403).json({ error: 'Forbidden' });
    next();
  });
}

module.exports = { authMiddleware, adminMiddleware, shopMiddleware };
