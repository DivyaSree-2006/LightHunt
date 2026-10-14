// LHT-8 On-Site Photography Guidance - owner: Karri Eakshith
(async () => {
  const spot = await LH.spotReady;
  const date = LH.param('date') || '';
  const box = document.getElementById('section-guidance');

  document.head.insertAdjacentHTML('beforeend', `<style>
    .guide { display: grid; grid-template-columns: minmax(0, 1.15fr) 1fr; gap: 20px; align-items: start; }
    @media (max-width: 860px) { .guide { grid-template-columns: 1fr; } }
    .guide-photo { position: relative; border-radius: var(--radius); overflow: hidden; aspect-ratio: 4/3;
      background-size: cover; background-position: center; box-shadow: var(--shadow); }
    .guide-photo svg { position: absolute; inset: 0; width: 100%; height: 100%; }
    .guide-photo .cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 10px 14px; font-size: 12px; color: #fff;
      background: linear-gradient(0deg, rgba(0,0,0,.55), rgba(0,0,0,0)); }
    .gstep { display: flex; gap: 14px; padding: 16px 18px; }
    .gstep + .gstep { margin-top: 12px; }
    .gstep .n { flex: none; width: 28px; height: 28px; border-radius: 50%; background: var(--navy); color: #fff;
      display: grid; place-items: center; font-size: 13px; font-weight: 600; }
    .gstep .t { font-weight: 600; }
    .gstep p { margin: 4px 0 0; color: var(--ink-2); font-size: 14px; }
    .g-actions { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
    .g-actions .btn { flex: 1; }
  </style>`);

  try {
    const g = await LH.api(`/api/guidance/${spot.id}${date ? '?date=' + encodeURIComponent(date) : ''}`);
    const cap = (s) => s[0].toUpperCase() + s.slice(1);

    // Overhead diagram: circle = the area around the spot, "You" stands on the front side.
    // SVG angles: compass bearing b -> point (cx + r sin b, cy - r cos b)
    const pt = (b, r) => [200 + r * Math.sin(b * Math.PI / 180), 150 - r * Math.cos(b * Math.PI / 180)];
    const [yx, yy] = pt(g.facing, 105);
    const [sx, sy] = pt(g.sun.bearing, 135);
    const [ax, ay] = pt(g.sun.bearing, 60);
    const photo = spot.photos[0] ? `url("${spot.photos[0].replace(/"/g, '')}"),` : '';

    box.innerHTML = `
      <h2>Stand ${g.title.stand}, <em>shoot ${g.title.shoot}</em></h2>
      <div class="guide">
        <div>
          <div class="guide-photo" style="background-image:${photo}linear-gradient(160deg,#f6c27a,#e0875a 45%,#6b4e7a)">
            <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-label="Where to stand diagram">
              <circle cx="200" cy="150" r="105" fill="rgba(255,255,255,.08)" stroke="#fff" stroke-width="1.5" stroke-dasharray="4 5"/>
              <text x="200" y="36" fill="#fff" font-size="13" text-anchor="middle" font-family="Inter, sans-serif">N</text>
              <line x1="${ax}" y1="${ay}" x2="200" y2="150" stroke="#f8d66b" stroke-width="2.5" stroke-dasharray="6 5"/>
              <circle cx="${sx}" cy="${sy}" r="14" fill="#f8d66b" stroke="#fff" stroke-width="2"/>
              <text x="${sx}" y="${sy + 4}" fill="#6b4e1a" font-size="11" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600">Sun</text>
              <rect x="186" y="136" width="28" height="28" rx="4" fill="rgba(35,42,69,.85)" stroke="#fff"/>
              <line x1="${yx}" y1="${yy}" x2="${200 + (yx - 200) * 0.35}" y2="${150 + (yy - 150) * 0.35}" stroke="#fff" stroke-width="2.5" marker-end="url(#arr)"/>
              <defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fff"/></marker></defs>
              <circle cx="${yx}" cy="${yy}" r="17" fill="#fff"/>
              <text x="${yx}" y="${yy + 4}" fill="#232a45" font-size="12" text-anchor="middle" font-family="Inter, sans-serif" font-weight="700">You</text>
            </svg>
            <div class="cap">Seen from above at ${LH.time(g.at)}. The arrow shows where you point the camera.</div>
          </div>
        </div>
        <div>
          ${g.steps.map((s, i) => `
            <div class="card gstep"><div class="n">${i + 1}</div><div><div class="t">${LH.escape(cap(s.title))}</div><p>${LH.escape(s.text)}</p></div></div>`).join('')}
          <div class="g-actions">
            <a class="btn primary" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${Number(spot.latitude)},${Number(spot.longitude)}">Navigate here</a>
            <a class="btn" href="#section-reviews">Read reviews</a>
          </div>
        </div>
      </div>`;
  } catch (err) {
    box.innerHTML = `<div class="msg error">Guidance could not load: ${LH.escape(err.message)}</div>`;
  }
})();
