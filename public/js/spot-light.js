// LHT-4 Sunlight Analysis - owner: Karri Eakshith
// Fills the day bar inside the photo header and the light cards below it.
(async () => {
  const spot = await LH.spotReady;
  const date = LH.param('date') || '';

  document.head.insertAdjacentHTML('beforeend', `<style>
    .daybar-card { background: rgba(255,255,255,.93); backdrop-filter: blur(8px); border-radius: var(--radius); padding: 18px 20px 14px; box-shadow: var(--shadow); }
    .daybar-card .lbl { font-size: 13px; font-weight: 600; margin-bottom: 12px; }
    .daybar { position: relative; height: 26px; border-radius: 999px;
      background: linear-gradient(90deg, #4b5a9a 0%, #9a8fc4 6%, #f3b469 12%, #f8d66b 30%, #fbe7a1 50%, #f8d66b 70%, #f0a35a 84%, #8a8fd0 92%, #4b5a9a 100%); }
    .daybar .best { position: absolute; top: -4px; bottom: -4px; border: 2px solid var(--ink); border-radius: 999px; }
    .ticks { position: relative; height: 34px; margin-top: 8px; font-size: 11px; color: var(--ink-2); }
    .ticks span { position: absolute; transform: translateX(-50%); text-align: center; line-height: 1.25; white-space: nowrap; }
    .ticks span b { display: block; font-weight: 500; color: var(--ink); }
    .ticks span.r { transform: translateX(calc(-100% + 6px)); text-align: right; }
    .ticks span.l { transform: translateX(-6px); text-align: left; }
    .ends { display: flex; justify-content: space-between; font-size: 10px; color: var(--ink-3); margin-top: 2px; }
    .light-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    @media (max-width: 760px) { .light-cards { grid-template-columns: repeat(2, 1fr); } }
    .lc { padding: 16px 18px; }
    .lc .k { font-size: 12px; font-weight: 600; }
    .lc .v { font-family: var(--serif); font-size: 26px; margin-top: 6px; }
    .best-card { margin-top: 14px; display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: end;
      border: 1.5px solid #f0c48a; background: linear-gradient(180deg, #fff 0%, #fff8ef 100%); }
    .best-card .big { font-family: var(--serif); font-size: clamp(34px, 5vw, 50px); line-height: 1.05; margin: 6px 0; }
    .best-card .nums { display: flex; gap: 28px; }
    .best-card .nums div { font-size: 12px; color: var(--ink-2); }
    .best-card .nums strong { display: block; font-family: var(--serif); font-weight: 500; font-size: 26px; color: var(--ink); }
    @media (max-width: 760px) { .best-card { grid-template-columns: 1fr; } }
    .light-head { display: flex; justify-content: space-between; align-items: end; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
    .light-head input { width: auto; border-radius: 999px; background: #fff; padding: 8px 14px; }
  </style>`);

  const slot = document.getElementById('hero-slot');
  const box = document.getElementById('section-light');
  try {
    const L = await LH.api(`/api/sunlight/${spot.id}${date ? '?date=' + encodeURIComponent(date) : ''}`);

    // ---- Day bar (5 AM to 8 PM) ----
    const day0 = new Date(L.date + 'T05:00:00+05:30').getTime();
    const span = 15 * 3600000;
    const pos = (iso) => Math.min(100, Math.max(0, (new Date(iso).getTime() - day0) / span * 100));
    // [label, time, position %, anchor] - Golden is right-aligned and Blue left-aligned so they never overlap
    const ticks = [
      ['Sunrise', LH.time(L.sunrise), pos(L.sunrise), 'c'],
      ['Noon', LH.time(L.solarNoon), pos(L.solarNoon), 'c'],
      ['Golden', LH.time(L.goldenEvening.start), pos(L.goldenEvening.start), 'r'],
      ['Blue', LH.time(L.blueEvening.start), pos(L.blueEvening.start), 'l']
    ];
    const bw = L.bestWindow;
    slot.innerHTML = `
      <div class="daybar-card">
        <div class="lbl">The whole day, 5 AM to 8 PM</div>
        <div class="daybar">${bw ? `<div class="best" title="Best direct light" style="left:${pos(bw.start)}%;width:${Math.max(1.5, pos(bw.end) - pos(bw.start))}%"></div>` : ''}</div>
        <div class="ticks">${ticks.map(([k, v, p, a]) => `<span class="${a}" style="left:${p}%">${k}<b>${v}</b></span>`).join('')}</div>
        <div class="ends"><span>5 AM</span><span>8 PM</span></div>
      </div>`;

    // ---- Cards ----
    const dirWord = { N: 'north', NE: 'north-east', E: 'east', SE: 'south-east', S: 'south', SW: 'south-west', W: 'west', NW: 'north-west' };
    const face = dirWord[LH.compass(L.facing)];
    box.innerHTML = `
      <div class="light-head">
        <h2>Today's <em>light</em></h2>
        <label class="hint">Date <input type="date" id="light-date" value="${L.date}"></label>
      </div>
      <div class="light-cards">
        <div class="card lc"><div class="k" style="color:#d4643b">Sunrise</div><div class="v">${LH.time(L.sunrise)}</div></div>
        <div class="card lc"><div class="k" style="color:var(--gold)">Golden hour</div><div class="v">${LH.time(L.goldenEvening.start)} – ${LH.time(L.goldenEvening.end).replace(/ (AM|PM)/, '')}</div></div>
        <div class="card lc"><div class="k" style="color:#c2493d">Sunset</div><div class="v">${LH.time(L.sunset)}</div></div>
        <div class="card lc"><div class="k" style="color:#4d5bb8">Blue hour</div><div class="v">${LH.time(L.blueEvening.start)} – ${LH.time(L.blueEvening.end).replace(/ (AM|PM)/, '')}</div></div>
      </div>
      <div class="card best-card">
        ${bw ? `
          <div>
            <div class="k" style="font-size:13px;font-weight:600">Best direct-light window</div>
            <div class="big">${LH.time(bw.start).replace(/ (AM|PM)/, '')} – ${LH.time(bw.end)}</div>
            <div class="muted" style="font-size:14px">The ${bw.kind === 'low' ? 'low ' : ''}sun falls straight on the ${face} face for ${bw.minutes} minutes.</div>
          </div>
          <div class="nums">
            <div>Sun bearing<strong>${bw.sunBearing}°</strong></div>
            <div>Sun height<strong>${Math.round(bw.sunAltitude)}°</strong></div>
            <div>Face bearing<strong>${L.facing}°</strong></div>
          </div>` : `
          <div>
            <div class="k" style="font-size:13px;font-weight:600">Best direct-light window</div>
            <div class="big" style="font-size:30px">No direct sun on the ${face} face</div>
            <div class="muted" style="font-size:14px">This side stays in soft, even light all day. Golden hour (${LH.time(L.goldenEvening.start)}) still gives warm tones.</div>
          </div>
          <div class="nums"><div>Face bearing<strong>${L.facing}°</strong></div></div>`}
      </div>`;
    document.getElementById('light-date').onchange = (e) => {
      const u = new URL(location.href);
      u.searchParams.set('date', e.target.value);
      location.href = u.toString();
    };
    LH.light = L;   // other sections may reuse it
  } catch (err) {
    box.innerHTML = `<div class="msg error">Light data could not load: ${LH.escape(err.message)}</div>`;
  }
})();
