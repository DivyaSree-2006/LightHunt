// LHT-8 On-Site Photography Guidance - owner: Karri Eakshith
// Tells the creator where to stand and which way to face during the best light.
const router = require('express').Router();
const db = require('../db');
const { requireLogin } = require('../middleware/auth');
const { getLight, sunAt, todayStr } = require('./sunlight');

const DIRS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const dirName = (deg) => DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
const norm180 = (d) => ((d + 540) % 360) - 180;   // -180..180

function buildGuidance(spot, light) {
  const facing = Number(spot.facing_degrees);
  const camera = (facing + 180) % 360;             // you look back at the front face
  const w = light.bestWindow;
  // sun position at the middle of the best window (or golden hour if there is no direct light)
  const at = w ? new Date((new Date(w.start).getTime() + new Date(w.end).getTime()) / 2)
               : new Date(light.goldenEvening.start || light.sunset);
  const sun = sunAt(at, Number(spot.latitude), Number(spot.longitude));

  // where is the sun relative to the photographer? 0 = in front, +90 = right, -90 = left, ±180 = behind
  const rel = norm180(sun.bearing - camera);
  let sunNote;
  if (Math.abs(rel) >= 150) sunNote = 'The sun is right behind you, so the front face is evenly lit.';
  else if (rel >= 90) sunNote = 'The sun is over your right shoulder.';
  else if (rel <= -90) sunNote = 'The sun is over your left shoulder.';
  else sunNote = 'The sun is in front of you. Expect silhouettes, or use it for a backlit shot.';

  // stand slightly off-centre on the side away from the sun, so your own shadow stays out of frame
  const sideStep = rel > 0 ? 'left' : 'right';
  const shadowDir = (sun.bearing + 180) % 360;

  return {
    title: { stand: dirName(facing), shoot: dirName(camera) },
    at: at.toISOString(),
    facing,
    cameraBearing: camera,
    sun,
    sunRelative: rel,
    steps: [
      {
        title: `Stand on the ${dirName(facing)} side`,
        text: `Walk to the ${dirName(facing)} side of the spot and step a little to your ${sideStep} of centre. ${sunNote}`
      },
      {
        title: `Face ${dirName(camera)} (bearing ${camera}°)`,
        text: `Point the camera at a bearing of about ${camera}°. The front face of the spot will fill your frame.`
      },
      {
        title: w ? 'Shadows fall behind' : 'Soft light today',
        text: w
          ? `The spot's shadow points ${dirName(shadowDir)}, away from you, so the front stays clean.`
          : 'The sun does not reach this face directly today. Come at golden hour for soft, even light.'
      }
    ]
  };
}

// GET /api/guidance/:spotId?date=
router.get('/:spotId(\\d+)', requireLogin, async (req, res, next) => {
  try {
    const [[spot]] = await db.query("SELECT id, name, latitude, longitude, facing_degrees FROM spots WHERE id = ? AND status = 'approved'", [req.params.spotId]);
    if (!spot) return res.status(404).json({ error: 'Spot not found.' });
    const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : todayStr();
    res.json(buildGuidance(spot, getLight(spot, date)));
  } catch (err) { next(err); }
});

module.exports = router;
