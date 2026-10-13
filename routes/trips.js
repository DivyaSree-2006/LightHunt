// LHT-7 Route Planning and Navigation - owner: Likitha Challa
// Every endpoint below is a placeholder that returns 501 ("not built yet").
// Replace each TODO with real code. Use db.query(...) from ../db.
const router = require('express').Router();
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

// TODO (Likitha): Body: { spotIds:[], date, startLat, startLng } -> ordered stops with arrive_at and leave_by times; save to trip_routes / route_stops
router.post('/plan', requireLogin, async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-7).' });
});

// TODO (Likitha): Get a saved trip with its stops
router.get('/:id', requireLogin, async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-7).' });
});

module.exports = router;
