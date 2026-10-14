// LHT-6 Creator Preferences and Recommendations - owner: Bandaru Navya Durga
// Finds approved spots within the creator's distance, for their content type,
// whose good light falls inside their free time, and ranks them by the LHT-5 score.
const router = require('express').Router();
const db = require('../db');
const { requireRole } = require('../middleware/auth');
const { getLight, todayStr } = require('./sunlight');
const { scoreSpot } = require('./weather');

const onlyCreators = requireRole('creator', 'admin');
const TYPES = ['portraits', 'reels', 'architecture', 'landscapes'];
const OFFSET = process.env.APP_TZ_OFFSET || '+05:30';
const DEFAULT_PREFS = { free_from: '16:30', free_to: '19:00', max_distance_km: 5, content_type: 'reels' };

function km(aLat, aLng, bLat, bLng) {            // haversine distance
  const R = 6371, toR = (d) => d * Math.PI / 180;
  const dLat = toR(bLat - aLat), dLng = toR(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(aLat)) * Math.cos(toR(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const hhmm = (t) => String(t || '').slice(0, 5);
const validTime = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

// GET /api/recommendations/preferences
router.get('/preferences', onlyCreators, async (req, res, next) => {
  try {
    const [[p]] = await db.query('SELECT * FROM preferences WHERE user_id = ?', [req.session.user.id]);
    res.json({ preferences: p ? { free_from: hhmm(p.free_from), free_to: hhmm(p.free_to), max_distance_km: Number(p.max_distance_km), content_type: p.content_type } : DEFAULT_PREFS });
  } catch (err) { next(err); }
});

// POST /api/recommendations/preferences { free_from, free_to, max_distance_km, content_type }
router.post('/preferences', onlyCreators, async (req, res, next) => {
  try {
    const { free_from, free_to, content_type } = req.body;
    const dist = Number(req.body.max_distance_km);
    if (!validTime(free_from) || !validTime(free_to)) return res.status(400).json({ error: 'Times must look like 16:30.' });
    if (free_to <= free_from) return res.status(400).json({ error: '"Until" must be later than "From".' });
    if (!(dist >= 1 && dist <= 50)) return res.status(400).json({ error: 'Distance must be between 1 and 50 km.' });
    if (!TYPES.includes(content_type)) return res.status(400).json({ error: 'Pick a content type.' });
    await db.query(
      `INSERT INTO preferences (user_id, free_from, free_to, max_distance_km, content_type) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE free_from = VALUES(free_from), free_to = VALUES(free_to),
         max_distance_km = VALUES(max_distance_km), content_type = VALUES(content_type)`,
      [req.session.user.id, free_from, free_to, dist, content_type]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// GET /api/recommendations?lat=&lng=  (location is used for this search only, never stored)
router.get('/', onlyCreators, async (req, res, next) => {
  try {
    const lat = Number(req.query.lat), lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ error: 'Location is needed (lat and lng).' });
    const [[saved]] = await db.query('SELECT * FROM preferences WHERE user_id = ?', [req.session.user.id]);
    const prefs = saved ? { free_from: hhmm(saved.free_from), free_to: hhmm(saved.free_to), max_distance_km: Number(saved.max_distance_km), content_type: saved.content_type } : DEFAULT_PREFS;
    const date = todayStr();
    const from = new Date(`${date}T${prefs.free_from}:00${OFFSET}`).getTime();
    const to = new Date(`${date}T${prefs.free_to}:00${OFFSET}`).getTime();

    const [spots] = await db.query(
      `SELECT s.*, (SELECT file_path FROM spot_photos p WHERE p.spot_id = s.id ORDER BY p.id LIMIT 1) AS photo
       FROM spots s WHERE s.status = 'approved'`
    );

    const results = [];
    for (const s of spots) {
      const dist = km(lat, lng, Number(s.latitude), Number(s.longitude));
      if (dist > prefs.max_distance_km) continue;
      if (!s.content_types.split(',').includes(prefs.content_type)) continue;

      const L = getLight(s, date);
      const windows = [
        L.bestWindow && { label: 'Direct light on the front face', start: L.bestWindow.start, end: L.bestWindow.end },
        { label: 'Golden hour', start: L.goldenEvening.start, end: L.goldenEvening.end },
        { label: 'Blue hour', start: L.blueEvening.start, end: L.blueEvening.end },
        { label: 'Morning golden hour', start: L.goldenMorning.start, end: L.goldenMorning.end }
      ].filter(w => w && w.start && w.end);
      // the window with the most minutes inside the free time
      let pick = null, best = 0;
      for (const w of windows) {
        const overlap = Math.min(to, new Date(w.end).getTime()) - Math.max(from, new Date(w.start).getTime());
        if (overlap > best) { best = overlap; pick = w; }
      }
      if (!pick) continue;   // its good light is outside the creator's free time

      const shownStart = Math.max(from, new Date(pick.start).getTime());
      const shownEnd = Math.min(to, new Date(pick.end).getTime());
      const sc = await scoreSpot(s, date, L, new Date((shownStart + shownEnd) / 2));
      results.push({
        id: s.id, name: s.name, photo: s.photo,
        latitude: Number(s.latitude), longitude: Number(s.longitude),
        distanceKm: Math.round(dist * 10) / 10,
        window: { label: pick.label, start: new Date(shownStart).toISOString(), end: new Date(shownEnd).toISOString() },
        score: sc.score, verdict: sc.verdict, weatherError: sc.weatherError
      });
    }
    results.sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);
    res.json({ date, preferences: prefs, spots: results });
  } catch (err) { next(err); }
});

module.exports = router;
