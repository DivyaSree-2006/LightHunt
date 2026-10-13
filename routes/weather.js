// LHT-5 Weather and Suitability Scoring - owner: Bandaru Navya Durga
// Every endpoint below is a placeholder that returns 501 ("not built yet").
// Replace each TODO with real code. Use db.query(...) from ../db.
const router = require('express').Router();
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

// TODO (Navya): ?date= -> hourly cloud cover + Go / Maybe / Skip score with reasons. Tip: Open-Meteo is free with no API key: https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&hourly=cloudcover. If the service fails, return a friendly message (SRS reliability rule).
router.get('/:spotId', requireLogin, async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-5).' });
});

module.exports = router;
