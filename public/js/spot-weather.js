// LHT-5 Weather and Suitability Scoring - owner: Navya Durga
(async () => {
  const spot = await LH.spotReady;
  const date = LH.param('date') || '';
  const box = document.getElementById('section-weather');

  document.head.insertAdjacentHTML('beforeend', `<style>
    .worth { display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start; }
    @media (max-width: 860px) { .worth { grid-template-columns: 1fr; } }
    .gauge-card { text-align: center; padding: 22px; }
    .gauge-card .at { font-size: 13px; color: var(--ink-2); }
    .gauge { position: relative; width: 210px; margin: 10px auto 0; }
    .gauge svg { width: 100%; display: block; }
    .gauge .num { position: absolute; left: 0; right: 0; bottom: 6px; }
    .gauge .num strong { font-family: var(--serif); font-weight: 500; font-size: 58px; line-height: 1; display: block; }
    .gauge .num span { font-size: 12px; color: var(--ink-3); }
    .verdict { display: inline-block; margin: 16px 0 12px; padding: 10px 30px; border-radius: 999px; color: #fff; font-weight: 700; letter-spacing: .04em; }
    .why .row-r { display: flex; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--line); }
    .why .row-r:last-child { border-bottom: 0; }
    .why .ic { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; flex: none; font-size: 15px; }
    .why .tt { font-weight: 600; font-size: 14px; }
    .why .sub { font-size: 12px; color: var(--ink-3); }
    .why .pts { margin-left: auto; font-weight: 700; font-size: 14px; }
    .clouds { display: flex; gap: 10px; align-items: flex-end; height: 120px; margin-top: 12px; }
    .clouds .c { flex: 1; text-align: center; font-size: 11px; color: var(--ink-3); display: flex; flex-direction: column; justify-content: flex-end; height: 100%; }
    .clouds .bar { border-radius: 8px; background: #d9dfee; min-height: 6px; margin: 4px 0; }
    .clouds .c.sel .bar { background: var(--navy); }
    .clouds .c.sel { color: var(--ink); font-weight: 600; }
  </style>`);

  const ICON = { cloud: ['☁', '#eef1fb', '#4d5bb8'], sun: ['☀', '#fdf0d6', '#d98a1c'], low: ['◐', '#fde3d0', '#d4643b'], haze: ['≋', '#fbe4e1', '#c2493d'] };
  const COLOR = { GO: 'var(--navy)', MAYBE: '#b8862a', SKIP: 'var(--skip)' };

  try {
    const s = await LH.api(`/api/weather/${spot.id}${date ? '?date=' + encodeURIComponent(date) : ''}`);
    // semicircle gauge: arc length proportional to the score
    const R = 80, C = Math.PI * R;
    const filled = C * s.score / 100;
    box.innerHTML = `
      <h2>Is the trip <em>worth it?</em></h2>
      ${s.weatherError ? `<div class="msg error">${LH.escape(s.weatherError)}</div>` : ''}
      <div class="worth">
        <div class="card gauge-card">
          <div class="at">${LH.escape(spot.name)} at ${LH.time(s.at)}</div>
          <div class="gauge">
            <svg viewBox="0 0 200 110" aria-hidden="true">
              <defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0" stop-color="#f6c27a"/><stop offset=".6" stop-color="#f2a33a"/><stop offset="1" stop-color="#e0875a"/></linearGradient></defs>
              <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#efe9df" stroke-width="16" stroke-linecap="round"/>
              <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#gg)" stroke-width="16" stroke-linecap="round"
                    stroke-dasharray="${filled} ${C}"/>
            </svg>
            <div class="num"><strong>${s.score}</strong><span>out of 100</span></div>
          </div>
          <div class="verdict" style="background:${COLOR[s.verdict]}">${s.verdict}</div>
          <div class="hint">Go is 75 and above. Maybe is 50 to 74. Skip is below 50.</div>
        </div>
        <div class="stack">
          <div class="card why">
            <h3>Why <em>${s.score}</em></h3>
            ${s.reasons.map(r => {
              const [ch, bg, fg] = ICON[r.icon];
              return `<div class="row-r">
                <div class="ic" style="background:${bg};color:${fg}">${ch}</div>
                <div><div class="tt">${LH.escape(r.title)}</div><div class="sub">${LH.escape(r.text)}</div></div>
                <div class="pts" style="color:${r.points >= 0 ? 'var(--go)' : 'var(--skip)'}">${r.points >= 0 ? '+' : ''}${r.points}</div>
              </div>`;
            }).join('')}
          </div>
          ${s.hours.length ? `
            <div class="card">
              <div class="row spread"><h3 style="margin:0">Cloud forecast</h3><span class="hint">${s.demo ? 'Demo forecast' : 'Checked ' + LH.time(s.checkedAt)}</span></div>
              <div class="clouds">
                ${s.hours.map(h => `<div class="c ${h.selected ? 'sel' : ''}">
                  <div>${h.cloud}%</div>
                  <div class="bar" style="height:${Math.max(6, h.cloud * 0.8)}px"></div>
                  <div>${LH.time(h.time + ':00+05:30').replace(/ (AM|PM)/, '')}</div>
                </div>`).join('')}
              </div>
            </div>` : ''}
        </div>
      </div>`;
  } catch (err) {
    box.innerHTML = `<h2>Is the trip <em>worth it?</em></h2><div class="msg error">The weather score could not load: ${LH.escape(err.message)}. The rest of the page still works.</div>`;
  }
})();
