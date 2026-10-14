// LHT-2 Photo-Spot Management - owner: Jadwika
//   LHT-50 spot submission form ("Drop a pin")
//   LHT-51 photo upload    LHT-52 save the spot
//   LHT-53 / LHT-54 my submissions with their review status
(async () => {
  await LH.requireUser(['contributor', 'moderator', 'admin']);
  await LH.nav('submit');

  // Page-only styles (kept here so the shared style.css is untouched)
  document.head.insertAdjacentHTML('beforeend', `<style>
    .step { display:flex; gap:14px; margin-bottom:22px; }
    .step-num { flex:none; width:28px; height:28px; border-radius:50%; background:var(--navy); color:#fff;
                display:grid; place-items:center; font-size:13px; font-weight:600; }
    .step-body { flex:1; min-width:0; }
    .step-title { font-weight:600; margin-bottom:8px; }
    #pin-map { height:240px; border-radius:var(--radius-sm); border:1px solid var(--line); margin-top:10px; background:var(--surface-2); }
    .dial-wrap { display:flex; gap:18px; align-items:center; }
    .dial { width:132px; height:132px; cursor:pointer; touch-action:none; flex:none; }
    .dial-label strong { font-family:var(--serif); font-size:22px; font-weight:500; display:block; }
    .photo-drop { border:2px dashed var(--line); border-radius:var(--radius-sm); padding:18px; text-align:center;
                  background:var(--surface-2); cursor:pointer; }
    .photo-drop:hover { border-color:var(--navy); }
    .previews { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin-top:10px; }
    .previews .thumb { aspect-ratio:1; }
    .sub-item { display:flex; gap:12px; align-items:center; padding:10px 0; border-bottom:1px solid var(--line); }
    .sub-item:last-child { border-bottom:0; }
    .sub-item .thumb { width:52px; flex:none; aspect-ratio:1; }
    .sub-item .note { font-size:13px; color:var(--ink-2); margin-top:4px; }
  </style>`);

  // ---------------- LHT-50: the form ----------------
  const formBox = document.getElementById('submit-form');
  formBox.innerHTML = `
    <form id="spot-form" class="card" novalidate>
      <div id="form-msg" class="msg hidden"></div>

      <div class="step">
        <div class="step-num">1</div>
        <div class="step-body">
          <div class="step-title">Place the pin</div>
          <div class="row">
            <button type="button" class="btn small" id="use-location">📍 Use my location</button>
            <span class="hint">or click on the map, or type the coordinates</span>
          </div>
          <div id="pin-map"></div>
          <div class="grid grid-2" style="gap:12px;margin-top:10px">
            <div><label for="latitude">Latitude</label><input id="latitude" name="latitude" type="number" step="any" placeholder="17.3616"></div>
            <div><label for="longitude">Longitude</label><input id="longitude" name="longitude" type="number" step="any" placeholder="78.4747"></div>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="step-num">2</div>
        <div class="step-body">
          <div class="step-title">Turn the dial to where it faces</div>
          <div class="dial-wrap">
            <svg class="dial" id="dial" viewBox="0 0 120 120" role="slider" aria-label="Facing direction" tabindex="0">
              <circle cx="60" cy="60" r="54" fill="#fff" stroke="var(--line)" stroke-width="2"/>
              <g font-size="10" font-family="Inter, sans-serif" fill="var(--ink-2)" text-anchor="middle">
                <text x="60" y="18">N</text><text x="104" y="64">E</text><text x="60" y="110">S</text><text x="16" y="64">W</text>
              </g>
              <line id="needle" x1="60" y1="60" x2="60" y2="20" stroke="var(--navy)" stroke-width="4" stroke-linecap="round"/>
              <circle cx="60" cy="60" r="6" fill="var(--navy)"/>
              <circle id="needle-tip" cx="60" cy="20" r="5" fill="var(--sun)"/>
            </svg>
            <div class="dial-label">
              <strong id="facing-name">North</strong>
              <span class="hint">Bearing <span id="facing-deg">0</span>°</span>
              <input type="hidden" id="facing_degrees" name="facing_degrees" value="0">
              <div class="hint" style="margin-top:6px">Drag the needle, or use ← → keys</div>
            </div>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="step-num">3</div>
        <div class="step-body">
          <div class="step-title">Name it</div>
          <div class="field"><input id="name" name="name" type="text" maxlength="150" placeholder="Rooftop near Laad Bazaar"></div>
          <div class="field" style="margin-bottom:0"><textarea id="description" name="description" placeholder="What makes the light good here? Best time, access tips…"></textarea></div>
        </div>
      </div>

      <div class="step">
        <div class="step-num">4</div>
        <div class="step-body">
          <div class="step-title">What is it good for?</div>
          <div class="chips">
            <label class="chip"><input type="checkbox" name="content_types" value="portraits">Portraits</label>
            <label class="chip"><input type="checkbox" name="content_types" value="reels">Reels</label>
            <label class="chip"><input type="checkbox" name="content_types" value="architecture">Architecture</label>
            <label class="chip"><input type="checkbox" name="content_types" value="landscapes">Landscapes</label>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="step-num">5</div>
        <div class="step-body">
          <div class="step-title">Add photos</div>
          <label class="photo-drop" for="photos">
            <div>Click to choose photos</div>
            <div class="hint">1 to 5 images, up to 5 MB each</div>
          </label>
          <input id="photos" name="photos" type="file" accept="image/*" multiple class="hidden">
          <div class="previews" id="previews"></div>
        </div>
      </div>

      <button type="submit" class="btn primary block" id="submit-btn">Submit for review</button>
      <p class="hint" style="text-align:center;margin:10px 0 0">A moderator checks every spot before it goes public.</p>
    </form>`;

  const $ = (id) => document.getElementById(id);
  const latInput = $('latitude'), lngInput = $('longitude');

  // ---- Map (Leaflet, free). If it cannot load, typing coordinates still works. ----
  let map = null, marker = null;
  function setPin(lat, lng, fromMap) {
    if (!fromMap) { /* typed or GPS */ }
    latInput.value = Number(lat).toFixed(6);
    lngInput.value = Number(lng).toFixed(6);
    if (map) {
      if (marker) marker.setLatLng([lat, lng]); else marker = L.marker([lat, lng]).addTo(map);
      if (!fromMap) map.setView([lat, lng], 16);
    }
  }
  loadLeaflet().then(() => {
    map = L.map('pin-map').setView([17.385, 78.4867], 12); // Hyderabad
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    map.on('click', (e) => setPin(e.latlng.lat, e.latlng.lng, true));
  }).catch(() => {
    $('pin-map').innerHTML = '<div class="hint" style="padding:16px">Map could not load. Type the latitude and longitude below.</div>';
  });
  [latInput, lngInput].forEach(inp => inp.addEventListener('change', () => {
    const lat = Number(latInput.value), lng = Number(lngInput.value);
    if (latInput.value && lngInput.value && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) setPin(lat, lng, false);
  }));

  $('use-location').onclick = () => {
    if (!navigator.geolocation) return showMsg('error', 'Your browser cannot share location. Please type the coordinates.');
    $('use-location').textContent = 'Finding you…';
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPin(pos.coords.latitude, pos.coords.longitude, false); $('use-location').textContent = '📍 Use my location'; },
      () => { showMsg('error', 'Location permission was denied. Click the map or type the coordinates.'); $('use-location').textContent = '📍 Use my location'; },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ---- Facing-direction dial ----
  const NAMES = ['North', 'North-east', 'East', 'South-east', 'South', 'South-west', 'West', 'North-west'];
  function setFacing(deg) {
    deg = ((Math.round(deg / 5) * 5) % 360 + 360) % 360;   // snap to 5°
    const rad = (deg - 90) * Math.PI / 180;
    const x = 60 + 40 * Math.cos(rad), y = 60 + 40 * Math.sin(rad);
    $('needle').setAttribute('x2', x); $('needle').setAttribute('y2', y);
    $('needle-tip').setAttribute('cx', x); $('needle-tip').setAttribute('cy', y);
    $('facing_degrees').value = deg;
    $('facing-deg').textContent = deg;
    $('facing-name').textContent = NAMES[Math.round(deg / 45) % 8];
    $('dial').setAttribute('aria-valuenow', deg);
  }
  const dial = $('dial');
  function dialFromPointer(e) {
    const r = dial.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    setFacing(Math.atan2(dy, dx) * 180 / Math.PI + 90);
  }
  let dragging = false;
  dial.addEventListener('pointerdown', (e) => { dragging = true; dial.setPointerCapture(e.pointerId); dialFromPointer(e); });
  dial.addEventListener('pointermove', (e) => { if (dragging) dialFromPointer(e); });
  dial.addEventListener('pointerup', () => { dragging = false; });
  dial.addEventListener('keydown', (e) => {
    const cur = Number($('facing_degrees').value);
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setFacing(cur + 5); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setFacing(cur - 5); e.preventDefault(); }
  });
  setFacing(0);

  // ---- LHT-51: photo previews ----
  $('photos').addEventListener('change', () => {
    const files = [...$('photos').files];
    $('previews').innerHTML = '';
    files.slice(0, 5).forEach(f => {
      const img = document.createElement('img');
      img.className = 'thumb';
      img.src = URL.createObjectURL(f);
      img.alt = f.name;
      $('previews').appendChild(img);
    });
    if (files.length > 5) showMsg('error', 'Only the first 5 photos will be used. Please choose up to 5.');
  });

  // ---- Validation + submit (LHT-52) ----
  function showMsg(type, text) {
    const m = $('form-msg');
    m.className = 'msg ' + type;
    m.textContent = text;
    m.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  $('spot-form').onsubmit = async (e) => {
    e.preventDefault();
    const lat = latInput.value, lng = lngInput.value;
    const types = [...document.querySelectorAll('input[name=content_types]:checked')];
    const files = [...$('photos').files];
    const name = $('name').value.trim();

    if (!lat || !lng || Math.abs(lat) > 90 || Math.abs(lng) > 180) return showMsg('error', 'Place the pin: use your location, click the map, or type valid coordinates.');
    if (name.length < 3) return showMsg('error', 'Give the spot a name (at least 3 letters).');
    if (types.length === 0) return showMsg('error', 'Pick at least one content type.');
    if (files.length === 0) return showMsg('error', 'Add at least one photo.');
    if (files.some(f => f.size > 5 * 1024 * 1024)) return showMsg('error', 'Each photo must be under 5 MB.');

    const data = new FormData();
    data.append('name', name);
    data.append('description', $('description').value.trim());
    data.append('latitude', lat);
    data.append('longitude', lng);
    data.append('facing_degrees', $('facing_degrees').value);
    types.forEach(t => data.append('content_types', t.value));
    files.slice(0, 5).forEach(f => data.append('photos', f));

    const btn = $('submit-btn');
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      await LH.api('/api/spots', { method: 'POST', body: data });
      $('spot-form').reset();
      $('previews').innerHTML = '';
      if (marker) { map.removeLayer(marker); marker = null; }
      setFacing(0);
      showMsg('ok', 'Spot submitted for review! You can track its status on the right.');
      loadMine();
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Submit for review';
    }
  };

  // ---------------- LHT-53 / LHT-54: my submissions ----------------
  const LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', sent_back: 'Sent back' };
  async function loadMine() {
    const box = $('my-submissions');
    box.className = 'card';
    box.innerHTML = '<h3>My <em>submissions</em></h3><div id="mine-list" class="hint">Loading…</div>';
    try {
      const { spots } = await LH.api('/api/spots/mine');
      $('mine-list').classList.remove('hint');
      $('mine-list').innerHTML = spots.length ? spots.map(s => `
        <div class="sub-item">
          ${s.photo ? `<img class="thumb" src="${LH.escape(s.photo)}" alt="">` : '<div class="thumb"></div>'}
          <div style="flex:1;min-width:0">
            <div class="row spread"><strong>${LH.escape(s.name)}</strong><span class="badge ${s.status}">${LABELS[s.status]}</span></div>
            <div class="hint">Faces ${LH.compass(s.facing_degrees)} · ${LH.escape(String(s.created_at).slice(0, 10))}</div>
            ${s.moderator_note ? `<div class="note">Moderator: “${LH.escape(s.moderator_note)}”</div>` : ''}
          </div>
        </div>`).join('') : '<p class="hint">You have not submitted any spots yet.</p>';
    } catch (err) {
      $('mine-list').textContent = err.message;
    }
  }
  loadMine();

  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
      setTimeout(() => window.L ? resolve() : reject(new Error('timeout')), 8000);
    });
  }
})();
