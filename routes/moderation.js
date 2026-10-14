// LHT-2 Spot Moderation - owner: Jadwika Nakkanaboyina
//   LHT-55 moderator review queue
//   LHT-56 spot detail view (location, facing, photos, content types)
//   LHT-57 approve / send back / reject actions
//   LHT-58 save the decision and update the spot's moderation status
const router = require('express').Router();
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const onlyModerators = requireRole('moderator', 'admin');

// GET /api/moderation/pending -> queue of spots waiting for review (LHT-55)
router.get('/pending', onlyModerators, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.name, s.facing_degrees, s.content_types, s.status, s.created_at,
              u.name AS contributor_name,
              (SELECT file_path FROM spot_photos p WHERE p.spot_id = s.id ORDER BY p.id LIMIT 1) AS photo
       FROM spots s LEFT JOIN users u ON u.id = s.contributor_id
       WHERE s.status = 'pending'
       ORDER BY s.created_at ASC, s.id ASC`
    );
    // Recently decided spots, so moderators can see what was just approved / rejected
    const [recent] = await db.query(
      `SELECT s.id, s.name, s.facing_degrees, s.content_types, s.status, s.reviewed_at AS created_at,
              (SELECT file_path FROM spot_photos p WHERE p.spot_id = s.id ORDER BY p.id LIMIT 1) AS photo
       FROM spots s
       WHERE s.status <> 'pending' AND s.reviewed_at IS NOT NULL
       ORDER BY s.reviewed_at DESC LIMIT 5`
    );
    res.json({ pending: rows, recent });
  } catch (err) { next(err); }
});

// GET /api/moderation/:id -> full details of one submission (LHT-56)
router.get('/:id(\\d+)', onlyModerators, async (req, res, next) => {
  try {
    const [[spot]] = await db.query(
      `SELECT s.*, u.name AS contributor_name, u.email AS contributor_email
       FROM spots s LEFT JOIN users u ON u.id = s.contributor_id WHERE s.id = ?`,
      [req.params.id]
    );
    if (!spot) return res.status(404).json({ error: 'Spot not found.' });
    const [photos] = await db.query('SELECT file_path FROM spot_photos WHERE spot_id = ? ORDER BY id', [spot.id]);
    res.json({ spot, photos: photos.map(p => p.file_path) });
  } catch (err) { next(err); }
});

// POST /api/moderation/:id/approve | reject | send-back (LHT-57, LHT-58)
const ACTIONS = { 'approve': 'approved', 'reject': 'rejected', 'send-back': 'sent_back' };

router.post('/:id(\\d+)/:action(approve|reject|send-back)', onlyModerators, async (req, res, next) => {
  try {
    const status = ACTIONS[req.params.action];
    const note = (req.body.note || '').trim();
    if (status !== 'approved' && !note) {
      return res.status(400).json({ error: 'Please write a note so the contributor knows why.' });
    }
    const [result] = await db.query(
      `UPDATE spots SET status = ?, moderator_note = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ? AND status = 'pending'`,
      [status, note || null, req.session.user.id, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(409).json({ error: 'This spot was already reviewed or does not exist.' });
    }
    res.json({ id: Number(req.params.id), status });
  } catch (err) { next(err); }
});

module.exports = router;
