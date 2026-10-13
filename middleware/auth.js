// Use these on any API route that needs a signed-in user or a specific role.
//   router.get('/x', requireLogin, handler)
//   router.post('/approve', requireRole('moderator', 'admin'), handler)

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Please sign in first.' });
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ error: 'Please sign in first.' });
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Your role cannot do this.' });
    }
    next();
  };
}

module.exports = { requireLogin, requireRole };
