// LHT-6 Creator Preferences and Recommendations - owner: Bandaru Navya Durga
// Every endpoint below is a placeholder that returns 501 ("not built yet").
// Replace each TODO with real code. Use db.query(...) from ../db.
const router = require('express').Router();
const db = require('../db');
const { requireRole } = require('../middleware/auth');

// TODO (Navya): Get the signed-in creator's saved preferences
router.get('/preferences', requireRole('creator', 'admin'), async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-6).' });
});

// TODO (Navya): Save free_from, free_to, max_distance_km, content_type
router.post('/preferences', requireRole('creator', 'admin'), async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-6).' });
});

// TODO (Navya): ?lat=&lng= -> spots within distance, matching content type, whose best window fits the free time, ranked by score
router.get('/', requireRole('creator', 'admin'), async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-6).' });
});

module.exports = router;
