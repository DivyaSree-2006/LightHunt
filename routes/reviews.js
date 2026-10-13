// LHT-10 Ratings and Reviews - owner: Jadwika Nakkanaboyina
// Every endpoint below is a placeholder that returns 501 ("not built yet").
// Replace each TODO with real code. Use db.query(...) from ../db.
const router = require('express').Router();
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

// TODO (Jadwika): List reviews + average rating for a spot
router.get('/spot/:spotId', requireLogin, async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-10).' });
});

// TODO (Jadwika): Add a review: rating 1-5 and comment
router.post('/spot/:spotId', requireLogin, async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-10).' });
});

module.exports = router;
