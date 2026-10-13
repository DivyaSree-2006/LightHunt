// LHT-3 Location and Map Services - owner: Likitha Challa
// The spot list on the right already works (base). Build the real map on the left.
(async () => {
  await LH.requireUser();
  await LH.nav('map');

  LH.todo(document.getElementById('map-area'), {
    epic: 'LHT-3', owner: 'Likitha', title: 'Interactive map',
    items: [
      'Show approved spots as markers on a map (Leaflet + OpenStreetMap is free, no key)',
      '"Use my location" button (ask permission first, per SRS)',
      'Search box for a place or address, plus manual location entry',
      'Click a marker -> open /spot.html?id=<spot id>'
    ]
  });

  // Working: list of approved spots
  const list = document.getElementById('spot-list');
  try {
    const { spots } = await LH.api('/api/spots');
    list.classList.remove('hint');
    list.innerHTML = spots.map(s => `
      <a class="spot-card" href="/spot.html?id=${s.id}" style="text-decoration:none">
        ${s.photo ? `<img class="thumb" src="${LH.escape(s.photo)}" alt="">` : '<div class="thumb"></div>'}
        <div>
          <strong>${LH.escape(s.name)}</strong>
          <div class="hint">Faces ${LH.compass(s.facing_degrees)} · ${LH.escape(s.content_types.replace(/,/g, ', '))}</div>
        </div>
      </a>`).join('') || 'No approved spots yet.';
  } catch (err) {
    list.textContent = err.message;
  }
})();
