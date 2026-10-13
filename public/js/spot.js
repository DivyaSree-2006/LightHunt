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
  document.getElementById('spot-meta').textContent =
    `Faces ${LH.compass(spot.facing_degrees)} (${spot.facing_degrees}°) · Good for ${spot.content_types.replace(/,/g, ', ')}`;
  return LH.spot;
})().catch(err => {
  document.getElementById('page-title').textContent = 'Spot not found';
  document.getElementById('spot-meta').textContent = err.message;
  throw err;
});
