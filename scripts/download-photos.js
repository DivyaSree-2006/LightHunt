// Downloads free photos (Wikipedia / Wikimedia Commons) for the home page, login cards
// and the 7 sample spots, then attaches the spot photos to the database.
// Run on a laptop with internet:   npm run download-photos
// Already-downloaded photos are kept; use  npm run download-photos -- --force  to replace them.
// Credits are written to public/images/CREDITS.txt (the photos are CC-licensed, please keep it).
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API = process.env.WIKI_API || 'https://en.wikipedia.org/w/api.php';
const UA = 'LightHuntStudentProject/1.0 (college software engineering project)';
const IMG = path.join(__dirname, '..', 'public', 'images');
const force = process.argv.includes('--force');

// file to save  ->  Wikipedia article titles to try, in order
const PHOTOS = [
  ['hero.jpg', ['Charminar']],
  ['spots/charminar.jpg', ['Charminar']],
  ['spots/hussain-sagar.jpg', ['Hussain Sagar']],
  ['spots/laad-bazaar.jpg', ['Laad Bazaar', 'Lad Bazaar']],
  ['spots/qutb-shahi-tombs.jpg', ['Qutb Shahi tombs', 'Qutb Shahi Tombs']],
  ['spots/golconda-fort.jpg', ['Golconda Fort', 'Golconda']],
  ['spots/chowmahalla-palace.jpg', ['Chowmahalla Palace']],
  ['spots/durgam-cheruvu-bridge.jpg', ['Durgam Cheruvu Cable Bridge', 'Durgam Cheruvu']],
  ['roles/creator.jpg', ['Photographer', 'Photography']],
  ['roles/contributor.jpg', ['Smartphone', 'Mobile phone']],
  ['roles/moderator.jpg', ['Tablet computer']],
  ['roles/admin.jpg', ['Laptop']]
];

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

// main photo of an article, about 1280 px wide
async function findPhoto(title) {
  const url = `${API}?action=query&format=json&redirects=1&prop=pageimages&piprop=thumbnail|name&pithumbsize=1280&titles=${encodeURIComponent(title)}`;
  const data = await getJson(url);
  const page = Object.values(data.query?.pages || {})[0];
  if (!page || !page.thumbnail) return null;
  return { src: page.thumbnail.source, file: page.pageimage, article: page.title };
}

async function download(src, dest) {
  const res = await fetch(src, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2000) throw new Error('file too small');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return buf.length;
}

(async () => {
  const credits = [];
  let ok = 0;
  for (const [file, titles] of PHOTOS) {
    const dest = path.join(IMG, file);
    if (fs.existsSync(dest) && !force) { console.log(`  · ${file} already there (kept)`); ok++; continue; }
    let done = false;
    for (const title of titles) {
      try {
        const found = await findPhoto(title);
        if (!found) continue;
        const size = await download(found.src, dest);
        console.log(`  ✔ ${file}  (${Math.round(size / 1024)} KB, from "${found.article}")`);
        credits.push(`${file}: "${found.file}" from https://en.wikipedia.org/wiki/${encodeURIComponent(found.article.replace(/ /g, '_'))} (Wikimedia Commons, see the file page for author and licence)`);
        done = true; ok++;
        break;
      } catch (err) { /* try the next title */ }
    }
    if (!done) console.log(`  ✖ ${file}  could not download, add your own photo with this name`);
  }
  if (credits.length) {
    const creditFile = path.join(IMG, 'CREDITS.txt');
    const old = fs.existsSync(creditFile) ? fs.readFileSync(creditFile, 'utf8') : 'Photo credits\n=============\n';
    fs.writeFileSync(creditFile, old + credits.join('\n') + '\n');
  }
  console.log(`\n${ok} of ${PHOTOS.length} photos ready.`);
  if (process.env.SKIP_ATTACH !== '1') {
    console.log('Attaching spot photos to the database...');
    execSync('node ' + JSON.stringify(path.join(__dirname, 'add-photos.js')), { stdio: 'inherit' });
  }
})().catch(err => { console.error(err.message); process.exit(1); });
