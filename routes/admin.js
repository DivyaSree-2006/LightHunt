// LHT-9 Admin Reports - owner: Vankayala Divya Sree
// Every endpoint below is a placeholder that returns 501 ("not built yet").
// Replace each TODO with real code. Use db.query(...) from ../db.
const router = require('express').Router();
const db = require('../db');
const { requireRole } = require('../middleware/auth');

// TODO (Divya): List all users with role and status
router.get('/users', requireRole('admin'), async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-9).' });
});

// TODO (Divya): Change a user's role
router.post('/users/:id/role', requireRole('admin'), async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-9).' });
});

// TODO (Divya): Block or unblock a user
router.post('/users/:id/status', requireRole('admin'), async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-9).' });
});

// TODO (Divya): Counts: users per role, spots per status, reviews, trips planned
router.get('/reports', requireRole('admin'), async (req, res, next) => {
  res.status(501).json({ error: 'Not built yet (LHT-9).' });
});

module.exports = router;
