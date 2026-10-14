// Attaches photos from public/images/spots/ to the spots with the same name.
//   charminar.jpg -> "Charminar",  hussain-sagar.jpg -> "Hussain Sagar"
// Run:  npm run photos   (safe to run again; it skips photos already added)
const fs = require('fs');
const path = require('path');
const db = require('../db');

const dir = path.join(__dirname, '..', 'public', 'images', 'spots');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

(async () => {
  const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  if (!files.length) { console.log('No photos found in public/images/spots/'); process.exit(0); }
  const [spots] = await db.query('SELECT id, name FROM spots');
  let added = 0;
  for (const file of files) {
    const spot = spots.find(s => slug(s.name) === slug(path.parse(file).name));
    if (!spot) { console.log(`  skipped ${file} (no spot named like it)`); continue; }
    const webPath = '/images/spots/' + file;
    const [[exists]] = await db.query('SELECT id FROM spot_photos WHERE spot_id = ? AND file_path = ?', [spot.id, webPath]);
    if (exists) continue;
    // the first photo added to a spot becomes its cover photo
    await db.query('INSERT INTO spot_photos (spot_id, file_path) VALUES (?, ?)', [spot.id, webPath]);
    console.log(`  ✔ ${file} -> ${spot.name}`);
    added++;
  }
  console.log(`Done. ${added} photo(s) added.`);
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
