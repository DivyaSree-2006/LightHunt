require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 }
}));

// Static files: pages, CSS, JS, and uploaded photos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- API routes: one file per module (see README for owners) ----
app.use('/api/auth',            require('./routes/auth'));            // LHT-1  Divya Sree
app.use('/api/spots',           require('./routes/spots'));           // LHT-2  Jadwika
app.use('/api/moderation',      require('./routes/moderation'));      // LHT-2  Jadwika
app.use('/api/location',        require('./routes/location'));        // LHT-3  Likitha
app.use('/api/sunlight',        require('./routes/sunlight'));        // LHT-4  Karri Eakshith
app.use('/api/weather',         require('./routes/weather'));         // LHT-5  Navya Durga
app.use('/api/recommendations', require('./routes/recommendations')); // LHT-6  Navya Durga
app.use('/api/trips',           require('./routes/trips'));           // LHT-7  Likitha
app.use('/api/guidance',        require('./routes/guidance'));        // LHT-8  Karri Eakshith
app.use('/api/admin',           require('./routes/admin'));           // LHT-9  Divya Sree
app.use('/api/reviews',         require('./routes/reviews'));         // LHT-10 Jadwika

// Unknown API path -> JSON 404
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler (shows DB errors clearly while developing)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LightHunt running at http://localhost:${PORT}`));
