// LHT-10 Ratings and Reviews - owner: Jadwika Nakkanaboyina
//   LHT-101 save submitted feedback for the selected spot
//   LHT-102 display ratings and reviews on the spot details page
const router = require('express').Router();
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

async function approvedSpot(id) {
  const [[spot]] = await db.query("SELECT id FROM spots WHERE id = ? AND status = 'approved'", [id]);
  return spot;
}

// GET /api/reviews/spot/:spotId -> average rating + all reviews (LHT-102)
router.get('/spot/:spotId(\\d+)', requireLogin, async (req, res, next) => {
  try {
    if (!(await approvedSpot(req.params.spotId))) return res.status(404).json({ error: 'Spot not found.' });
    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, r.user_id, u.name AS user_name
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.spot_id = ? ORDER BY r.created_at DESC, r.id DESC`,
      [req.params.spotId]
    );
    const count = reviews.length;
    const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : null;
    const mine = reviews.find(r => r.user_id === req.session.user.id) || null;
    res.json({ average, count, reviews, mine });
  } catch (err) { next(err); }
});

// POST /api/reviews/spot/:spotId -> add or update MY review (one per user per spot) (LHT-101)
router.post('/spot/:spotId(\\d+)', requireLogin, async (req, res, next) => {
  try {
    const spotId = req.params.spotId;
    if (!(await approvedSpot(spotId))) return res.status(404).json({ error: 'Spot not found.' });
    const rating = Number(req.body.rating);
    const comment = (req.body.comment || '').trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Pick a rating from 1 to 5 stars.' });
    if (comment.length > 1000) return res.status(400).json({ error: 'Comment is too long (max 1000 characters).' });

    const userId = req.session.user.id;
    const [[existing]] = await db.query('SELECT id FROM reviews WHERE spot_id = ? AND user_id = ?', [spotId, userId]);
    if (existing) {
      await db.query('UPDATE reviews SET rating = ?, comment = ?, created_at = NOW() WHERE id = ?', [rating, comment, existing.id]);
    } else {
      await db.query('INSERT INTO reviews (spot_id, user_id, rating, comment) VALUES (?, ?, ?, ?)', [spotId, userId, rating, comment]);
    }
    res.status(existing ? 200 : 201).json({ ok: true, updated: Boolean(existing) });
  } catch (err) { next(err); }
});

module.exports = router;
