// Spot page header - shared base. Loads the spot, then each section script fills its own box.
// Section scripts can use:  LH.spot  (the spot object)  and  LH.spotReady (a Promise)

LH.spotReady = (async () => {
  await LH.requireUser();
  await LH.nav('map');
  const id = LH.param('id');
  const { spot, photos } = await LH.api('/api/spots/' + encodeURIComponent(id));
  LH.spot = { ...spot, photos };
  document.title = spot.name + ' · LightHunt';
  document.getElementById('page-title').innerHTML = `${LH.escape(spot.name)}, <em>today's light</em>`;
  const types = spot.content_types.split(',').map(t => t[0].toUpperCase() + t.slice(1)).join(', ');
  document.getElementById('spot-meta').textContent = `Front faces ${LH.compass(spot.facing_degrees)} (${spot.facing_degrees}°) · Good for ${types}`;
  const hero = document.getElementById('spot-hero');
  const bg = ['linear-gradient(160deg,#f6c27a 0%,#e0875a 45%,#6b4e7a 100%)'];
  if (photos[0]) bg.unshift(`url("${photos[0].replace(/"/g, '')}")`);
  hero.style.backgroundImage = bg.join(',');
  return LH.spot;
})().catch(err => {
  document.getElementById('page-title').textContent = 'Spot not found';
  document.getElementById('spot-meta').textContent = err.message;
  throw err;
});
