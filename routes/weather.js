// LHT-5 Weather and Suitability Scoring - owner: Bandaru Navya Durga
// Uses the free Open-Meteo forecast (no API key) and the sunlight helper from LHT-4
// to give each visit a Go / Maybe / Skip score out of 100, with reasons.
//
// Reused by recommendations:  const { scoreSpot } = require('./weather');
//
// Offline demo: set WEATHER_DEMO=1 in .env to use a made-up forecast
// (handy if the college Wi-Fi is down during the presentation).
const router = require('express').Router();
const db = require('../db');
const { requireLogin } = require('../middleware/auth');
const { getLight, sunAt, angleDiff, todayStr } = require('./sunlight');

const TZ = process.env.APP_TZ || 'Asia/Kolkata';
const cache = new Map();                 // "lat,lng,date" -> { at, data }
const CACHE_MS = 30 * 60 * 1000;

// "2026-10-14T17:00" in the app time zone, for matching Open-Meteo's hourly times
function localHourKey(date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:00`;
}

function demoForecast(lat, lng, date) {
  // smooth made-up cloud cover so the demo looks realistic and stays the same on refresh
  const seed = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233)) * 100;
  const time = [], cloud = [], vis = [], hum = [];
  for (let h = 0; h < 24; h++) {
    time.push(`${date}T${String(h).padStart(2, '0')}:00`);
    cloud.push(Math.round(Math.max(0, Math.min(100, 30 + 25 * Math.sin((h + seed) / 3) + (h > 18 ? 15 : 0)))));
    vis.push(h > 16 ? 9000 : 18000);
    hum.push(55 + (h > 17 ? 15 : 0));
  }
  return { time, cloud, visibility: vis, humidity: hum, demo: true };
}

async function getForecast(lat, lng, date) {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)},${date}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;
  let data;
  if (process.env.WEATHER_DEMO === '1') {
    data = demoForecast(lat, lng, date);
  } else {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&hourly=cloud_cover,visibility,relative_humidity_2m&timezone=${encodeURIComponent(TZ)}` +
      `&start_date=${date}&end_date=${date}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) throw new Error('Weather service returned ' + res.status);
    const j = await res.json();
    data = { time: j.hourly.time, cloud: j.hourly.cloud_cover, visibility: j.hourly.visibility, humidity: j.hourly.relative_humidity_2m };
  }
  data.checkedAt = new Date().toISOString();
  cache.set(key, { at: Date.now(), data });
  return data;
}

const verdict = (score) => score >= 75 ? 'GO' : score >= 50 ? 'MAYBE' : 'SKIP';

// Score one visit. Never throws because of the weather service:
// if the forecast is unavailable the score uses light only and says so (SRS reliability rule).
// at (optional): the time to score, e.g. the middle of the window shown to the creator
async function scoreSpot(spot, date = todayStr(), light = null, at = null) {
  light = light || getLight(spot, date);
  const lat = Number(spot.latitude), lng = Number(spot.longitude), facing = Number(spot.facing_degrees);
  const w = light.bestWindow;
  const target = at ? new Date(at)
    : w ? new Date((new Date(w.start).getTime() + new Date(w.end).getTime()) / 2)
    : new Date(light.goldenEvening.start);
  const sun = sunAt(target, lat, lng);
  const reasons = [];

  // 1. clouds (up to 40)
  let forecast = null, weatherError = null, cloud = null, i = -1;
  try {
    forecast = await getForecast(lat, lng, date);
    i = forecast.time.indexOf(localHourKey(target));
    if (i >= 0) cloud = forecast.cloud[i];
  } catch (err) { weatherError = 'The weather service is not reachable right now, so clouds are not counted.'; }
  if (cloud !== null) {
    const pts = Math.round(40 * (1 - cloud / 100));
    reasons.push({ icon: 'cloud', title: `Cloud cover is ${cloud}%`,
      text: cloud <= 30 ? 'Thin clouds let the sun through' : cloud <= 60 ? 'Some clouds may block the sun' : 'Heavy clouds will likely hide the sun', points: pts });
  } else {
    reasons.push({ icon: 'cloud', title: 'Cloud forecast unavailable', text: 'Counted as average', points: 20 });
  }

  // 2. sun on the front face (up to 34)
  const off = Math.round(angleDiff(sun.bearing, facing));
  const facePts = sun.altitude <= 0 ? 0 : off <= 30 ? 34 : off <= 60 ? 24 : off <= 90 ? 10 : 0;
  reasons.push({ icon: 'sun', title: facePts >= 24 ? 'Sun is on the front face' : facePts ? 'Sun is at an angle to the face' : 'Sun is not on the front face',
    text: sun.altitude <= 0 ? 'The sun has set by then' : `${off}° off straight-on`, points: facePts });

  // 3. low, warm sun (up to 26)
  const alt = sun.altitude;
  const lowPts = alt <= 0 ? 0 : alt <= 15 ? 26 : alt <= 30 ? 16 : 6;
  reasons.push({ icon: 'low', title: alt <= 0 ? 'Sun is below the horizon' : `Sun is ${alt <= 15 ? 'low' : 'high'}, at ${Math.round(alt)}°`,
    text: alt <= 15 && alt > 0 ? 'Warm colour and long, soft shadows' : alt > 15 ? 'Harder light and shorter shadows' : 'Only blue-hour light', points: lowPts });

  // 4. haze (minus)
  if (forecast && i >= 0) {
    const vis = forecast.visibility?.[i], hum = forecast.humidity?.[i];
    if (vis !== undefined && vis !== null && vis < 5000) reasons.push({ icon: 'haze', title: 'Thick haze', text: 'Distant detail will look flat', points: -12 });
    else if ((vis !== undefined && vis !== null && vis < 10000) || hum > 85) reasons.push({ icon: 'haze', title: 'Light haze', text: 'Slightly softens distant detail', points: -6 });
  }

  const score = Math.max(0, Math.min(100, reasons.reduce((s, r) => s + r.points, 0)));

  // cloud bars: two hours either side of the target time
  let hours = [];
  if (forecast && i >= 0) {
    for (let k = Math.max(0, i - 2); k <= Math.min(forecast.time.length - 1, i + 2); k++) {
      hours.push({ time: forecast.time[k], cloud: forecast.cloud[k], selected: k === i });
    }
  }

  return {
    date, at: target.toISOString(), score, verdict: verdict(score), reasons, hours,
    checkedAt: forecast ? forecast.checkedAt : null, demo: Boolean(forecast && forecast.demo), weatherError
  };
}

// GET /api/weather/:spotId?date=
router.get('/:spotId(\\d+)', requireLogin, async (req, res, next) => {
  try {
    const [[spot]] = await db.query("SELECT id, name, latitude, longitude, facing_degrees FROM spots WHERE id = ? AND status = 'approved'", [req.params.spotId]);
    if (!spot) return res.status(404).json({ error: 'Spot not found.' });
    const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : todayStr();
    res.json({ spot: { id: spot.id, name: spot.name }, ...(await scoreSpot(spot, date)) });
  } catch (err) { next(err); }
});

module.exports = router;
module.exports.scoreSpot = scoreSpot;
