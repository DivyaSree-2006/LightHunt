// LHT-2 Photo-Spot Management - owner: Jadwika Nakkanaboyina
// Working in the base: list approved spots and get one spot (everyone needs these).
// TODO (Jadwika): POST /api/spots  -> spot submission form (LHT-50)
//                 GET  /api/spots/mine -> contributor sees status of their submissions
const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const db = require('../db');
const { requireLogin, requireRole } = require('../middleware/auth');

// Photo upload setup, ready to use: upload.array('photos', 5)
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'))
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/'))
});

// GET /api/spots -> all APPROVED spots (only approved spots are public, per SRS)
router.get('/', requireLogin, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, (SELECT file_path FROM spot_photos p WHERE p.spot_id = s.id LIMIT 1) AS photo
       FROM spots s WHERE s.status = 'approved' ORDER BY s.name`
    );
    res.json({ spots: rows });
  } catch (err) { next(err); }
});

// GET /api/spots/:id -> one approved spot with its photos
router.get('/:id(\\d+)', requireLogin, async (req, res, next) => {
  try {
    const [[spot]] = await db.query("SELECT * FROM spots WHERE id = ? AND status = 'approved'", [req.params.id]);
    if (!spot) return res.status(404).json({ error: 'Spot not found.' });
    const [photos] = await db.query('SELECT file_path FROM spot_photos WHERE spot_id = ?', [spot.id]);
    res.json({ spot, photos: photos.map(p => p.file_path) });
  } catch (err) { next(err); }
});

// TODO (Jadwika): submit a new spot. Save it with status 'pending'.
// Fields: name, description, latitude, longitude, facing_degrees, content_types[], photos (files)
router.post('/', requireRole('contributor', 'moderator', 'admin'), upload.array('photos', 5), async (req, res) => {
  res.status(501).json({ error: 'Spot submission is not built yet (LHT-2 / LHT-50).' });
});

// TODO (Jadwika): list the signed-in contributor's own submissions with their status
router.get('/mine', requireLogin, async (req, res) => {
  res.status(501).json({ error: 'Not built yet (LHT-2).' });
});

module.exports = router;
