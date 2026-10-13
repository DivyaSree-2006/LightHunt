// LHT-4 Sunlight Analysis - owner: Karri Eakshith
// Every endpoint below is a placeholder that returns 501 ("not built yet").
// Replace each TODO with real code. Use db.query(...) from ../db.
const router = require('express').Router();
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

// TODO (Karri): ?date=YYYY-MM-DD -> sunrise, sunset, golden hour, blue hour, and the best direct-light window when the sun is in front of the spot's facing direction. Tip: the 'suncalc' package is already installed (SunCalc.getTimes and SunCalc.getPosition). Export a helper function too, because weather, recommendations, routes and guidance all need it.
router.get('/:spotId', requireLogin, async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-4).' });
});

module.exports = router;
