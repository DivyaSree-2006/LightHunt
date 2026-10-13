# LightHunt: shared base project

This is the **starting base**. Login, the database, the theme and the navbar already work.
Every module page exists but shows a dashed **"Not built yet"** card. Each member replaces only
the cards in **their own files**.

---

## 1. Setup (every member, once)

You need **Node.js 18+**, **MySQL 8**, **VS Code** and **Git**.

```bash
git clone <your GitHub repo link>
cd lighthunt
npm install
```

1. Copy `.env.example` to a new file named `.env` and put your MySQL password in `DB_PASSWORD`.
2. Create the database and demo data:
   ```bash
   mysql -u root -p < database/schema.sql
   npm run seed
   ```
3. Start the site:
   ```bash
   npm run dev
   ```
4. Open **http://localhost:3000**

Demo logins (password for all: `password123`):

| Role | Email |
|---|---|
| Creator | creator@lighthunt.test |
| Contributor | contributor@lighthunt.test |
| Moderator | moderator@lighthunt.test |
| Admin | admin@lighthunt.test |

---

## 2. Who edits which files

**Only edit your own files.** Then there are no merge conflicts.

| Member | Jira epics | Your files |
|---|---|---|
| **Vankayala Divya Sree** | LHT-1 User & Role Mgmt, LHT-9 Admin Reports | `routes/auth.js`, `routes/admin.js`, `public/admin.html`, `public/js/admin.js`, `public/login.html`, `public/register.html` |
| **Jadwika Nakkanaboyina** | LHT-2 Spot Mgmt & Moderation, LHT-10 Ratings & Reviews | `routes/spots.js`, `routes/moderation.js`, `routes/reviews.js`, `public/js/submit-spot.js`, `public/js/moderation.js`, `public/js/spot-reviews.js` |
| **Likitha Challa** | LHT-3 Location & Map, LHT-7 Route Planning | `routes/location.js`, `routes/trips.js`, `public/js/map.js`, `public/js/trip.js` |
| **Karri Eakshith** | LHT-4 Sunlight Analysis, LHT-8 On-Site Guidance | `routes/sunlight.js`, `routes/guidance.js`, `public/js/spot-light.js`, `public/js/spot-guidance.js` |
| **Bandaru Navya Durga** | LHT-5 Weather Scoring, LHT-6 Preferences & Recommendations | `routes/weather.js`, `routes/recommendations.js`, `public/js/spot-weather.js`, `public/js/for-you.js` |

**Shared files (team leader only, ask before changing):**
`server.js`, `db.js`, `database/schema.sql`, `public/css/style.css`, `public/js/common.js`, `public/index.html`, `public/js/spot.js`.

Each file has `TODO` comments that say exactly what to build. Search for your name in VS Code (Ctrl+Shift+F).

### Things that depend on each other

- **Karri:** finish the sunlight helper (LHT-4) **first** and export it, e.g.
  `module.exports.getLight = (spot, date) => {...}`. Weather, recommendations, routes and guidance all use it.
- **Jadwika:** spot submission + moderation (LHT-2) fill the database that everyone else reads.
  Until then, use the 7 seeded Hyderabad spots.

### Free services (no API key needed)

- Sun times and positions: `suncalc` (already installed): `SunCalc.getTimes(date, lat, lng)`, `SunCalc.getPosition(date, lat, lng)`
- Cloud forecast: Open-Meteo, `https://api.open-meteo.com/v1/forecast?latitude=17.36&longitude=78.47&hourly=cloudcover&timezone=Asia/Kolkata`
- Maps: Leaflet + OpenStreetMap, `https://leafletjs.com`
- Navigation: link to `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG`

---

## 3. How to use the theme

Don't write your own colours or fonts. Use the classes from `public/css/style.css`:

```html
<h1 class="title">Spots waiting for <em>review</em></h1>   <!-- <em> = gold italic word -->
<div class="card"> ... </div>
<button class="btn primary">Approve</button>  <button class="btn">Send back</button>
<span class="badge pending">Pending</span>  <span class="badge go">GO</span>
<label class="chip"><input type="checkbox" value="reels">Reels</label>
<table class="table"> ... </table>
<div class="msg ok">Submitted for review</div>
```

In page scripts, use the helpers in `public/js/common.js`:

```js
const { spots } = await LH.api('/api/spots');                    // GET
await LH.api('/api/reviews/spot/3', { method: 'POST', body: { rating: 5, comment: 'Great' } });
await LH.api('/api/spots', { method: 'POST', body: formData });  // file upload
```

On the server, use the shared DB and auth helpers:

```js
const db = require('../db');
const { requireLogin, requireRole } = require('../middleware/auth');
const [rows] = await db.query('SELECT * FROM spots WHERE id = ?', [id]);
// signed-in user: req.session.user  -> { id, name, email, role }
```

---

## 4. Daily Git routine

```bash
git pull                      # before you start
# ...work on YOUR files...
git add .
git commit -m "LHT-2: spot submission form"   # put the Jira key first
git push
```

Putting the Jira key (e.g. `LHT-2`) in the commit message lets Jira link the commit to the work item.

## 5. Jira routine (this is what makes the Gantt chart work)

1. Team leader: open **Timeline**, drag a bar for each epic so every epic has a start and due date.
2. When you **start** a task, move it to **In Progress**.
3. When it **works on your laptop and is pushed**, move it to **Done**.
