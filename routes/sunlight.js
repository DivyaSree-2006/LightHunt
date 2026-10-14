
const router = require('express').Router();
const db = require('../db');
const SunCalc = require('suncalc');
const { requireLogin } = require('../middleware/auth');

const TZ = process.env.APP_TZ || 'Asia/Kolkata';

// Returns today's date in YYYY-MM-DD format.
function todayStr() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const values = {};
  for (const part of parts) {
    if (part.type !== 'literal') values[part.type] = part.value;
  }

  return `${values.year}-${values.month}-${values.day}`;
}

// Returns the sun's altitude and compass bearing at a given time.
function sunAt(date, lat, lng) {
  const time = date instanceof Date ? date : new Date(date);
  const position = SunCalc.getPosition(time, lat, lng);

  return {
    altitude: position.altitude,
    bearing: (position.azimuth * 180 / Math.PI + 180 + 360) % 360
  };
}

// Smallest angular difference between two compass bearings.
function angleDiff(a, b) {
  return Math.abs(((a - b + 540) % 360) - 180);
}

// Calculates sunlight times and an approximate best direct-light window.
function getLight(spot, date = todayStr()) {
  const lat = Number(spot.latitude);
  const lng = Number(spot.longitude);
  const facing = Number(spot.facing_degrees);

  if (
    !Number.isFinite(lat) || lat < -90 || lat > 90 ||
    !Number.isFinite(lng) || lng < -180 || lng > 180 ||
    !Number.isFinite(facing)
  ) {
    throw new Error('Spot has invalid coordinates or facing direction.');
  }

  const day = new Date(`${date}T12:00:00+05:30`);
  if (Number.isNaN(day.getTime())) {
    throw new Error('Invalid date. Use YYYY-MM-DD.');
  }

  const times = SunCalc.getTimes(day, lat, lng);
  let best = null;
  let bestAltitude = -Infinity;

  const start = times.sunrise;
  const end = times.sunset;

  if (start && end && start < end) {
    for (
      let ms = start.getTime();
      ms <= end.getTime();
      ms += 5 * 60 * 1000
    ) {
      const sun = sunAt(new Date(ms), lat, lng);
      const difference = angleDiff(sun.bearing, facing);

      if (
        sun.altitude > 0 &&
        difference <= 90 &&
        sun.altitude > bestAltitude
      ) {
        bestAltitude = sun.altitude;
        best = new Date(ms);
      }
    }
  }

  return {
    sunrise: times.sunrise,
    sunset: times.sunset,
    goldenHour: times.goldenHour,
    goldenHourEnd: times.goldenHourEnd,
    blueHour: times.dawn,
    blueHourEnd: times.sunrise,
    bestWindow: best
      ? {
          start: new Date(best.getTime() - 15 * 60 * 1000),
          end: new Date(best.getTime() + 15 * 60 * 1000),
          midpoint: best
        }
      : null
  };
}

// LHT-4 sunlight endpoint.
router.get('/:spotId', requireLogin, async (req, res, next) => {
  try {
    const [[spot]] = await db.query(
      `SELECT id, name, latitude, longitude, facing_degrees
       FROM spots
       WHERE id = ? AND status = 'approved'`,
      [req.params.spotId]
    );

    if (!spot) {
      return res.status(404).json({ error: 'Spot not found.' });
    }

    const requestedDate = req.query.date;
    const date =
      typeof requestedDate === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
        ? requestedDate
        : todayStr();

    res.json({
      spot: { id: spot.id, name: spot.name },
      ...getLight(spot, date)
    });
  } catch (err) {
    next(err);
  }
});

// Export the router and helpers for weather/recommendation routes.
module.exports = router;
module.exports.getLight = getLight;
module.exports.sunAt = sunAt;
module.exports.angleDiff = angleDiff;
module.exports.todayStr = todayStr;
