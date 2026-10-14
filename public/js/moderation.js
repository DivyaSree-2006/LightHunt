// LHT-2 Spot Moderation - owner: Jadwika
//   LHT-55 review queue   LHT-56 spot detail view
//   LHT-57 approve / send back / reject   LHT-58 save the decision
(async () => {
  await LH.requireUser(['moderator', 'admin']);
  await LH.nav('moderation');

  document.head.insertAdjacentHTML('beforeend', `<style>
    .queue tr { cursor:pointer; }
    .queue tr.selected td { background:var(--surface-2); }
    .queue .spot-cell { display:flex; gap:10px; align-items:center; }
    .queue .spot-cell .thumb { width:44px; aspect-ratio:1; flex:none; }
    .gallery { position:relative; }
    .gallery img, .gallery .thumb { width:100%; aspect-ratio:4/3; object-fit:cover; border-radius:var(--radius-sm); }
    .gallery .nav-btn { position:absolute; top:50%; transform:translateY(-50%); width:32px; height:32px; border-radius:50%;
                        border:0; background:rgba(255,255,255,.9); cursor:pointer; font-size:16px; }
    .gallery .prev { left:8px; } .gallery .next { right:8px; }
    .gallery .count { position:absolute; bottom:8px; right:10px; background:rgba(0,0,0,.5); color:#fff; font-size:12px; padding:2px 8px; border-radius:999px; }
    dl.facts { display:grid; grid-template-columns:auto 1fr; gap:8px 16px; margin:16px 0; font-size:14px; }
    dl.facts dt { color:var(--ink-3); } dl.facts dd { margin:0; text-align:right; }
    .actions { display:flex; gap:8px; flex-wrap:wrap; }
    .actions .btn { flex:1; }
    .btn.danger { color:var(--skip); }
  </style>`);

  const table = document.getElementById('pending-table');
  const panel = document.getElementById('review-panel');
  const LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', sent_back: 'Sent back' };
  let selectedId = null;

  function whenText(dateStr) {
    const d = new Date(String(dateStr).replace(' ', 'T'));
    if (isNaN(d)) return LH.escape(dateStr);
    const days = Math.floor((Date.now() - d) / 86400000);
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (days <= 0) return 'Today ' + time;
    if (days === 1) return 'Yesterday';
    return days + ' days ago';
  }

  function row(s) {
    return `
      <tr data-id="${s.id}" class="${s.id === selectedId ? 'selected' : ''}">
        <td><div class="spot-cell">${s.photo ? `<img class="thumb" src="${LH.escape(s.photo)}" alt="">` : '<div class="thumb"></div>'}<strong>${LH.escape(s.name)}</strong></div></td>
        <td>${LH.compass(s.facing_degrees)}</td>
        <td>${LH.escape(s.content_types.split(',').map(t => t[0].toUpperCase() + t.slice(1)).join(', '))}</td>
        <td class="muted">${whenText(s.created_at)}</td>
        <td><span class="badge ${s.status}">${LABELS[s.status]}</span></td>
      </tr>`;
  }

  // ---- LHT-55: the queue ----
  async function loadQueue() {
    table.className = 'card';
    try {
      const { pending, recent } = await LH.api('/api/moderation/pending');
      table.innerHTML = `
        <div class="row spread" style="margin-bottom:8px">
          <h3 style="margin:0">Waiting <em>(${pending.length})</em></h3>
          <button class="btn small" id="refresh">Refresh</button>
        </div>
        ${pending.length ? `
          <div style="overflow-x:auto"><table class="table queue">
            <thead><tr><th>Spot</th><th>Faces</th><th>Good for</th><th>Submitted</th><th>Status</th></tr></thead>
            <tbody>${pending.map(row).join('')}</tbody>
          </table></div>` : '<p class="muted">Nothing to review right now. 🎉</p>'}
        ${recent.length ? `
          <h3 style="margin:24px 0 8px">Recently <em>decided</em></h3>
          <div style="overflow-x:auto"><table class="table">
            <tbody>${recent.map(s => row(s).replace('<tr ', '<tr style="cursor:default" ')).join('')}</tbody>
          </table></div>` : ''}`;
      document.getElementById('refresh').onclick = loadQueue;
      table.querySelectorAll('.queue tbody tr').forEach(tr => tr.onclick = () => openSpot(Number(tr.dataset.id)));
      if (!selectedId && pending.length) openSpot(pending[0].id);
      if (!pending.length) emptyPanel();
    } catch (err) {
      table.innerHTML = `<div class="msg error">${LH.escape(err.message)}</div>`;
    }
  }

  function emptyPanel() {
    selectedId = null;
    panel.className = 'card';
    panel.innerHTML = '<h3>Review</h3><p class="muted">Pick a spot from the list to review it.</p>';
  }

  // ---- LHT-56: detail view ----
  async function openSpot(id) {
    selectedId = id;
    table.querySelectorAll('.queue tbody tr').forEach(tr => tr.classList.toggle('selected', Number(tr.dataset.id) === id));
    panel.className = 'card';
    panel.innerHTML = '<p class="hint">Loading…</p>';
    try {
      const { spot, photos } = await LH.api('/api/moderation/' + id);
      let index = 0;
      const lat = Number(spot.latitude), lng = Number(spot.longitude);
      panel.innerHTML = `
        <div class="gallery" id="gallery"></div>
        <h2 style="margin-top:16px">${LH.escape(spot.name)}</h2>
        ${spot.description ? `<p class="muted" style="margin:6px 0 0">${LH.escape(spot.description)}</p>` : ''}
        <dl class="facts">
          <dt>Location</dt><dd><a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener">${lat.toFixed(4)}, ${lng.toFixed(4)} ↗</a></dd>
          <dt>Front faces</dt><dd>${LH.compass(spot.facing_degrees)} (${spot.facing_degrees}°)</dd>
          <dt>Good for</dt><dd>${LH.escape(spot.content_types.replace(/,/g, ', '))}</dd>
          <dt>Submitted by</dt><dd>${LH.escape(spot.contributor_name || 'Unknown')}</dd>
          <dt>Status</dt><dd><span class="badge ${spot.status}">${LABELS[spot.status]}</span></dd>
        </dl>
        <div id="panel-msg" class="msg hidden"></div>
        ${spot.status === 'pending' ? `
          <div class="field">
            <label for="note">Note to the contributor</label>
            <textarea id="note" placeholder="Good spot! Please add a photo from a lower angle."></textarea>
            <div class="hint">Required for Send back and Reject.</div>
          </div>
          <div class="actions">
            <button class="btn primary" data-act="approve">Approve</button>
            <button class="btn" data-act="send-back">Send back</button>
            <button class="btn danger" data-act="reject">Reject</button>
          </div>` : `<p class="muted">Already reviewed${spot.moderator_note ? ': “' + LH.escape(spot.moderator_note) + '”' : '.'}</p>`}`;

      const gallery = document.getElementById('gallery');
      function drawPhoto() {
        gallery.innerHTML = photos.length
          ? `<img src="${LH.escape(photos[index])}" alt="Photo ${index + 1} of ${spot.name}">
             ${photos.length > 1 ? `<button class="nav-btn prev" aria-label="Previous photo">‹</button><button class="nav-btn next" aria-label="Next photo">›</button>` : ''}
             <span class="count">${index + 1} / ${photos.length}</span>`
          : '<div class="thumb"></div>';
        const prev = gallery.querySelector('.prev'), next = gallery.querySelector('.next');
        if (prev) prev.onclick = () => { index = (index - 1 + photos.length) % photos.length; drawPhoto(); };
        if (next) next.onclick = () => { index = (index + 1) % photos.length; drawPhoto(); };
      }
      drawPhoto();

      // ---- LHT-57 / LHT-58: decisions ----
      panel.querySelectorAll('[data-act]').forEach(btn => btn.onclick = () => decide(spot, btn.dataset.act));
    } catch (err) {
      panel.innerHTML = `<div class="msg error">${LH.escape(err.message)}</div>`;
    }
  }

  async function decide(spot, action) {
    const note = document.getElementById('note').value.trim();
    const msg = document.getElementById('panel-msg');
    if (action !== 'approve' && !note) {
      msg.className = 'msg error'; msg.textContent = 'Please write a note so the contributor knows why.';
      return;
    }
    if (action === 'reject' && !confirm(`Reject "${spot.name}"? This cannot be undone.`)) return;
    panel.querySelectorAll('[data-act]').forEach(b => b.disabled = true);
    try {
      await LH.api(`/api/moderation/${spot.id}/${action}`, { method: 'POST', body: { note } });
      selectedId = null;
      await loadQueue();
      const words = { approve: 'approved, it is now public', 'send-back': 'sent back to the contributor', reject: 'rejected' };
      const top = document.createElement('div');
      top.className = 'msg ok';
      top.textContent = `"${spot.name}" was ${words[action]}.`;
      table.prepend(top);
      setTimeout(() => top.remove(), 4000);
    } catch (err) {
      msg.className = 'msg error'; msg.textContent = err.message;
      panel.querySelectorAll('[data-act]').forEach(b => b.disabled = false);
    }
  }

  emptyPanel();
  loadQueue();
})();
