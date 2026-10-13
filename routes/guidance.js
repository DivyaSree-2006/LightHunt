// LHT-8 On-Site Photography Guidance - owner: Karri Eakshith
// Every endpoint below is a placeholder that returns 501 ("not built yet").
// Replace each TODO with real code. Use db.query(...) from ../db.
const router = require('express').Router();
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

// TODO (Karri): ?time= -> where to stand and which direction to face (use the sun position from LHT-4 and the spot's facing_degrees)
router.get('/:spotId', requireLogin, async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-8).' });
});

module.exports = router;
