// LHT-4 Sunlight Analysis - owner: Karri Eakshith
// Calculates sunrise, sunset, golden hour, blue hour and the "best direct-light window"
// (when the low sun shines straight onto the front face of a spot).
//
// Other modules reuse the helper:
//   const { getLight, todayStr } = require('./sunlight');
//   const light = getLight({ latitude, longitude, facing_degrees }, '2026-10-14');
const router = require('express').Router();
const SunCalc = require('suncalc');
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

const TZ = process.env.APP_TZ || 'Asia/Kolkata';

// Today's date (YYYY-MM-DD) in the app time zone
function todayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

// Noon on that date in the app time zone, used as the base for SunCalc
function middayOf(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  // shift so that 12:00 is local noon (works for fixed-offset zones like India)
  const offsetMin = tzOffsetMinutes(d);
  return new Date(d.getTime() - offsetMin * 60000);
}

function tzOffsetMinutes(date) {
  const local = new Date(date.toLocaleString('en-US', { timeZone: TZ }));
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  return Math.round((local - utc) / 60000);
}

const toDeg = (r) => r * 180 / Math.PI;
// SunCalc azimuth is measured from south, clockwise to the west. Convert to a compass bearing (0 = north).
const compassAzimuth = (az) => (toDeg(az) + 180 + 360) % 360;
const angleDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

function sunAt(date, lat, lng) {
  const p = SunCalc.getPosition(date, lat, lng);
  return { bearing: Math.round(compassAzimuth(p.azimuth)), altitude: Math.round(toDeg(p.altitude) * 10) / 10 };
}

// Find the minutes when the sun is up and in front of the face.
function faceWindows(times, lat, lng, facing, maxAngle, maxAltitude) {
  const windows = [];
  let current = null;
  for (let t = times.sunrise.getTime(); t <= times.sunset.getTime(); t += 60000) {
    const s = sunAt(new Date(t), lat, lng);
    const ok = s.altitude > 0 && angleDiff(s.bearing, facing) <= maxAngle && s.altitude <= maxAltitude;
    if (ok && !current) current = { start: t, end: t };
    else if (ok) current.end = t;
    else if (current) { windows.push(current); current = null; }
  }
  if (current) windows.push(current);
  return windows;
}

function getLight(spot, dateStr = todayStr()) {
  const lat = Number(spot.latitude), lng = Number(spot.longitude);
  const facing = Number(spot.facing_degrees) || 0;
  const times = SunCalc.getTimes(middayOf(dateStr), lat, lng);

  // 1) low, warm sun on the face; 2) any sun on the face
  let wins = faceWindows(times, lat, lng, facing, 60, 20);
  let kind = 'low';
  if (!wins.length) { wins = faceWindows(times, lat, lng, facing, 75, 90); kind = 'any'; }
  // pick the longest window (later one wins a tie, evening light is preferred by creators)
  const best = wins.sort((a, b) => (b.end - b.start) - (a.end - a.start) || b.start - a.start)[0] || null;

  let bestWindow = null;
  if (best) {
    const mid = new Date((best.start + best.end) / 2);
    const s = sunAt(mid, lat, lng);
    bestWindow = {
      start: new Date(best.start).toISOString(),
      end: new Date(best.end).toISOString(),
      minutes: Math.round((best.end - best.start) / 60000),
      sunBearing: s.bearing,
      sunAltitude: s.altitude,
      kind
    };
  }

  const iso = (d) => (d instanceof Date && !isNaN(d)) ? d.toISOString() : null;
  return {
    date: dateStr,
    timezone: TZ,
    facing,
    sunrise: iso(times.sunrise),
    sunset: iso(times.sunset),
    solarNoon: iso(times.solarNoon),
    goldenMorning: { start: iso(times.sunrise), end: iso(times.goldenHourEnd) },
    goldenEvening: { start: iso(times.goldenHour), end: iso(times.sunset) },
    blueMorning: { start: iso(times.dawn), end: iso(times.sunrise) },
    blueEvening: { start: iso(times.sunset), end: iso(times.dusk) },
    bestWindow
  };
}

function validDate(d) { return /^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d : todayStr(); }

// GET /api/sunlight/point?lat=&lng=&facing=&date=  -> prediction for any dropped pin
router.get('/point', requireLogin, (req, res) => {
  const lat = Number(req.query.lat), lng = Number(req.query.lng), facing = Number(req.query.facing || 0);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return res.status(400).json({ error: 'Give a valid lat and lng.' });
  }
  res.json(getLight({ latitude: lat, longitude: lng, facing_degrees: facing }, validDate(req.query.date)));
});

// GET /api/sunlight/:spotId?date=YYYY-MM-DD
router.get('/:spotId(\\d+)', requireLogin, async (req, res, next) => {
  try {
    const [[spot]] = await db.query("SELECT id, latitude, longitude, facing_degrees FROM spots WHERE id = ? AND status = 'approved'", [req.params.spotId]);
    if (!spot) return res.status(404).json({ error: 'Spot not found.' });
    res.json(getLight(spot, validDate(req.query.date)));
  } catch (err) { next(err); }
});

module.exports = router;
module.exports.getLight = getLight;
module.exports.todayStr = todayStr;
module.exports.sunAt = sunAt;
module.exports.angleDiff = angleDiff;
