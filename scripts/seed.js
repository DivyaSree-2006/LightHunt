// Adds demo users (one per role) and some approved Hyderabad spots.
// Run after schema.sql:   npm run seed
const bcrypt = require('bcryptjs');
const db = require('../db');

const users = [
  ['Demo Creator',     'creator@lighthunt.test',     'creator'],
  ['Demo Contributor', 'contributor@lighthunt.test', 'contributor'],
  ['Demo Moderator',   'moderator@lighthunt.test',   'moderator'],
  ['Demo Admin',       'admin@lighthunt.test',       'admin']
];

// name, description, lat, lng, facing (degrees), content types
const spots = [
  ['Charminar',           'Iconic 1591 monument in the Old City.',          17.361564, 78.474665, 90,  'architecture,portraits,reels'],
  ['Hussain Sagar',       'Lake with the Buddha statue; great blue hour.',  17.423900, 78.473800, 270, 'landscapes,reels'],
  ['Laad Bazaar',         'Bangle market lane next to Charminar.',          17.361300, 78.473200, 180, 'portraits,reels'],
  ['Qutb Shahi Tombs',    'Domed tombs of the Qutb Shahi kings.',           17.394900, 78.395800, 90,  'architecture,landscapes'],
  ['Golconda Fort',       'Hilltop fort with wide city views.',             17.383300, 78.401100, 270, 'landscapes,architecture'],
  ['Chowmahalla Palace',  'Courtyard palace of the Nizams.',                17.357800, 78.471700, 0,   'architecture,portraits'],
  ['Durgam Cheruvu Bridge','Cable bridge, lit up at night.',                17.430700, 78.389700, 270, 'reels,landscapes']
];

(async () => {
  const hash = await bcrypt.hash('password123', 10);
  for (const [name, email, role] of users) {
    await db.query(
      'INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, role]
    );
  }
  const [[contributor]] = await db.query("SELECT id FROM users WHERE email = 'contributor@lighthunt.test'");
  for (const [name, desc, lat, lng, facing, types] of spots) {
    await db.query(
      `INSERT INTO spots (name, description, latitude, longitude, facing_degrees, content_types, contributor_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [name, desc, lat, lng, facing, types, contributor.id]
    );
  }
  console.log('Seed done. All demo users use the password: password123');
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
