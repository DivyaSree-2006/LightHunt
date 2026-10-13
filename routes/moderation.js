// LHT-2 Spot Moderation - owner: Jadwika Nakkanaboyina
// Every endpoint below is a placeholder that returns 501 ("not built yet").
// Replace each TODO with real code. Use db.query(...) from ../db.
const router = require('express').Router();
const db = require('../db');
const { requireRole } = require('../middleware/auth');

// TODO (Jadwika): List spots with status 'pending' (with first photo) for the review table
router.get('/pending', requireRole('moderator', 'admin'), async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-2).' });
});

// TODO (Jadwika): Set status = 'approved', reviewed_by, reviewed_at
router.post('/:id/approve', requireRole('moderator', 'admin'), async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-2).' });
});

// TODO (Jadwika): Set status = 'rejected' with moderator_note
router.post('/:id/reject', requireRole('moderator', 'admin'), async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-2).' });
});

// TODO (Jadwika): Set status = 'sent_back' with moderator_note (ask contributor to fix)
router.post('/:id/send-back', requireRole('moderator', 'admin'), async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-2).' });
});

module.exports = router;
