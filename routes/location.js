// LHT-3 Location and Map Services - owner: Likitha Challa
// Every endpoint below is a placeholder that returns 501 ("not built yet").
// Replace each TODO with real code. Use db.query(...) from ../db.
const router = require('express').Router();
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

// TODO (Likitha): ?lat=&lng=&km= -> approved spots within km (use the haversine formula)
router.get('/nearby', requireLogin, async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-3).' });
});

// TODO (Likitha): ?q= -> search spots by name
router.get('/search', requireLogin, async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-3).' });
});

module.exports = router;
