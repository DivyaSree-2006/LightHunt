// LHT-6 Creator Preferences and Recommendations - owner: Navya Durga
(async () => {
  await LH.requireUser(['creator', 'admin']);
  await LH.nav('for-you');

  document.head.insertAdjacentHTML('beforeend', `<style>
    .fy { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }
    @media (max-width: 900px) { .fy { grid-template-columns: 1fr; } }
    .shoot h3 { margin-bottom: 14px; }
    .shoot .q { font-size: 13px; font-weight: 600; margin: 16px 0 8px; }
    .times { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .times label { font-size: 11px; color: var(--ink-3); font-weight: 400; margin-bottom: 4px; }
    .km-row { display: flex; justify-content: space-between; align-items: center; }
    input[type=range] { width: 100%; accent-color: var(--navy); }
    .loc { font-size: 12px; color: var(--ink-3); margin-top: 14px; display: flex; justify-content: space-between; gap: 8px; align-items: center; }
    .rank-head { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; align-items: baseline; margin-bottom: 10px; }
    .rank { display: grid; grid-template-columns: 28px 92px 1fr auto auto auto; gap: 14px; align-items: center; padding: 12px 14px; }
    .rank + .rank { margin-top: 10px; }
    .rank .no { width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid var(--ink); display: grid; place-items: center; font-size: 12px; font-weight: 600; }
    .rank.top .no { background: var(--navy); color: #fff; border-color: var(--navy); }
    .rank .ph { width: 92px; aspect-ratio: 4/3; border-radius: 10px; object-fit: cover; background: linear-gradient(160deg,#f6c27a,#e0875a 45%,#6b4e7a); }
    .rank .nm { font-weight: 600; }
    .rank .sub { font-size: 12px; color: var(--ink-3); }
    .rank .tm { font-weight: 600; font-size: 14px; white-space: nowrap; }
    .ring { width: 44px; height: 44px; position: relative; }
    .ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .ring b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 13px; }
    @media (max-width: 700px) { .rank { grid-template-columns: 28px 70px 1fr; } .rank .tm, .rank .ring, .rank .act { grid-column: 3; } .rank .ph { width: 70px; } }
  </style>`);

  const root = document.getElementById('preferences').parentElement;
  root.className = 'fy';
  root.removeAttribute('style');
  root.innerHTML = `
    <form class="card shoot" id="prefs">
      <h3>Your shoot</h3>
      <div class="q" style="margin-top:0">When are you free?</div>
      <div class="times">
        <div><label for="from">From</label><input type="time" id="from" required></div>
        <div><label for="to">Until</label><input type="time" id="to" required></div>
      </div>
      <div class="q km-row"><span>How far will you travel?</span><span id="km-val" class="hint"></span></div>
      <input type="range" id="km" min="1" max="25" step="1">
      <div class="q">What are you shooting?</div>
      <div class="chips" id="types">
        ${['reels', 'portraits', 'architecture', 'landscapes'].map(t => `<label class="chip"><input type="radio" name="type" value="${t}">${t[0].toUpperCase() + t.slice(1)}</label>`).join('')}
      </div>
      <div class="loc"><span id="loc-text">Near Hyderabad city centre</span><button type="button" class="btn small" id="locate">Use my location</button></div>
      <div id="pref-msg" class="msg hidden" style="margin:12px 0 0"></div>
      <button class="btn primary block" type="submit" style="margin-top:16px">Find my light</button>
      <button class="btn block" type="button" id="plan" style="margin-top:10px" disabled>Plan a route from the top 3</button>
    </form>
    <div>
      <div class="rank-head"><h3 id="rank-title" style="margin:0">Finding spots…</h3><span class="hint" id="rank-sub"></span></div>
      <div id="rank-list"></div>
    </div>`;

  const $ = (id) => document.getElementById(id);
  let here = { lat: 17.385, lng: 78.4867 };     // default: Hyderabad centre (not stored anywhere)
  let results = [];

  const { preferences: p } = await LH.api('/api/recommendations/preferences');
  $('from').value = p.free_from; $('to').value = p.free_to; $('km').value = p.max_distance_km;
  $('km-val').textContent = p.max_distance_km + ' km';
  const radio = document.querySelector(`input[name=type][value="${p.content_type}"]`);
  if (radio) radio.checked = true;
  $('km').oninput = () => { $('km-val').textContent = $('km').value + ' km'; };

  $('locate').onclick = () => {
    if (!navigator.geolocation) return;
    $('loc-text').textContent = 'Finding you…';
    navigator.geolocation.getCurrentPosition(
      (pos) => { here = { lat: pos.coords.latitude, lng: pos.coords.longitude }; $('loc-text').textContent = 'Using your current location'; search(); },
      () => { $('loc-text').textContent = 'Location blocked, using city centre'; },
      { timeout: 10000 }
    );
  };

  function ring(score, verdict) {
    const c = 2 * Math.PI * 18, col = verdict === 'GO' ? '#f2a33a' : verdict === 'MAYBE' ? '#d9b25a' : '#c2493d';
    return `<div class="ring"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="#efe9df" stroke-width="4"/>
      <circle cx="22" cy="22" r="18" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${c * score / 100} ${c}"/></svg><b>${score}</b></div>`;
  }

  async function search() {
    $('rank-title').textContent = 'Finding spots…';
    try {
      const data = await LH.api(`/api/recommendations?lat=${here.lat}&lng=${here.lng}`);
      results = data.spots;
      const pr = data.preferences;
      $('rank-title').innerHTML = results.length ? `${results.length} spot${results.length > 1 ? 's' : ''} match, <em>best first</em>` : 'No spots match yet';
      $('rank-sub').textContent = `Within ${pr.max_distance_km} km · good for ${pr.content_type} · light inside your free time`;
      $('rank-list').innerHTML = results.length ? results.map((s, i) => `
        <div class="card rank ${i === 0 ? 'top' : ''}">
          <div class="no">${i + 1}</div>
          ${s.photo ? `<img class="ph" src="${LH.escape(s.photo)}" alt="">` : '<div class="ph"></div>'}
          <div><div class="nm">${LH.escape(s.name)}</div><div class="sub">${s.distanceKm} km · ${LH.escape(s.window.label)}</div></div>
          <div class="tm">${LH.time(s.window.start).replace(/ (AM|PM)/, '')} – ${LH.time(s.window.end)}</div>
          ${ring(s.score, s.verdict)}
          <a class="btn small ${s.verdict === 'GO' ? 'primary' : ''} act" href="/spot.html?id=${s.id}">${s.verdict === 'GO' ? 'Go' : 'Check'}</a>
        </div>`).join('')
        : '<div class="card"><p class="muted" style="margin:0">Try a longer free time, a bigger distance, or a different content type.</p></div>';
      if (results.some(s => s.weatherError)) $('rank-sub').textContent += ' · weather unavailable, ranked by light only';
      $('plan').disabled = results.length === 0;
    } catch (err) {
      $('rank-title').textContent = 'Could not load spots';
      $('rank-list').innerHTML = `<div class="msg error">${LH.escape(err.message)}</div>`;
    }
  }

  $('prefs').onsubmit = async (e) => {
    e.preventDefault();
    const msg = $('pref-msg');
    msg.classList.add('hidden');
    const type = document.querySelector('input[name=type]:checked');
    try {
      await LH.api('/api/recommendations/preferences', { method: 'POST', body: {
        free_from: $('from').value, free_to: $('to').value, max_distance_km: Number($('km').value), content_type: type ? type.value : ''
      }});
      search();
    } catch (err) { msg.className = 'msg error'; msg.textContent = err.message; }
  };

  $('plan').onclick = () => {
    const ids = results.slice(0, 3).map(s => s.id).join(',');
    location.href = `/routes.html?spots=${ids}&lat=${here.lat}&lng=${here.lng}`;
  };

  search();
})();
