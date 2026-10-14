// LHT-2 Photo-Spot Management - owner: Jadwika Nakkanaboyina
//   LHT-51 photo upload and storage
//   LHT-52 save location, facing direction, content types and photos
//   LHT-53 / LHT-54 contributor's submitted spots with their review status
//   LHT-59 / LHT-60 only approved spots are shown to everyone else
const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../db');
const { requireLogin, requireRole } = require('../middleware/auth');

const CONTENT_TYPES = ['portraits', 'reels', 'architecture', 'landscapes'];

// ---- LHT-51: photo upload (max 5 images, 5 MB each) ----
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'))
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/'))
});

function removeFiles(files = []) {
  for (const f of files) fs.unlink(f.path, () => {});
}

// GET /api/spots -> all APPROVED spots (LHT-59, LHT-60)
router.get('/', requireLogin, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, (SELECT file_path FROM spot_photos p WHERE p.spot_id = s.id ORDER BY p.id LIMIT 1) AS photo
       FROM spots s WHERE s.status = 'approved' ORDER BY s.name`
    );
    res.json({ spots: rows });
  } catch (err) { next(err); }
});

// GET /api/spots/mine -> the signed-in contributor's own submissions (LHT-53, LHT-54)
router.get('/mine', requireLogin, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.name, s.status, s.moderator_note, s.created_at, s.facing_degrees, s.content_types,
              (SELECT file_path FROM spot_photos p WHERE p.spot_id = s.id ORDER BY p.id LIMIT 1) AS photo
       FROM spots s WHERE s.contributor_id = ? ORDER BY s.created_at DESC, s.id DESC`,
      [req.session.user.id]
    );
    res.json({ spots: rows });
  } catch (err) { next(err); }
});

// GET /api/spots/:id -> one APPROVED spot with its photos
router.get('/:id(\\d+)', requireLogin, async (req, res, next) => {
  try {
    const [[spot]] = await db.query("SELECT * FROM spots WHERE id = ? AND status = 'approved'", [req.params.id]);
    if (!spot) return res.status(404).json({ error: 'Spot not found.' });
    const [photos] = await db.query('SELECT file_path FROM spot_photos WHERE spot_id = ? ORDER BY id', [spot.id]);
    res.json({ spot, photos: photos.map(p => p.file_path) });
  } catch (err) { next(err); }
});

// POST /api/spots -> submit a new spot, saved as 'pending' (LHT-50, LHT-51, LHT-52)
router.post('/', requireRole('contributor', 'moderator', 'admin'), (req, res, next) => {
  upload.array('photos', 5)(req, res, async (uploadErr) => {
    const files = req.files || [];
    const fail = (msg) => { removeFiles(files); res.status(400).json({ error: msg }); };
    if (uploadErr) return fail(uploadErr.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be under 5 MB.' : 'Upload failed: ' + uploadErr.message);

    try {
      const name = (req.body.name || '').trim();
      const description = (req.body.description || '').trim();
      const lat = Number(req.body.latitude);
      const lng = Number(req.body.longitude);
      const facing = Number(req.body.facing_degrees);
      let types = req.body.content_types || [];
      if (!Array.isArray(types)) types = [types];
      types = [...new Set(types)].filter(t => CONTENT_TYPES.includes(t));

      if (name.length < 3) return fail('Please give the spot a name (at least 3 letters).');
      if (req.body.latitude === '' || !Number.isFinite(lat) || lat < -90 || lat > 90) return fail('Latitude must be between -90 and 90.');
      if (req.body.longitude === '' || !Number.isFinite(lng) || lng < -180 || lng > 180) return fail('Longitude must be between -180 and 180.');
      if (!Number.isInteger(facing) || facing < 0 || facing > 359) return fail('Facing direction must be 0 to 359 degrees.');
      if (types.length === 0) return fail('Pick at least one content type.');
      if (files.length === 0) return fail('Add at least one photo (JPG or PNG).');

      const [result] = await db.query(
        `INSERT INTO spots (name, description, latitude, longitude, facing_degrees, content_types, contributor_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [name, description, lat.toFixed(6), lng.toFixed(6), facing, types.join(','), req.session.user.id]
      );
      for (const f of files) {
        await db.query('INSERT INTO spot_photos (spot_id, file_path) VALUES (?, ?)', [result.insertId, '/uploads/' + f.filename]);
      }
      res.status(201).json({ id: result.insertId, status: 'pending' });
    } catch (err) {
      removeFiles(files);
      next(err);
    }
  });
});

module.exports = router;
