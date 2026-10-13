// LHT-4 Sunlight Analysis - owner: Karri Eakshith
(async () => {
  const spot = await LH.spotReady;
  LH.todo(document.getElementById('section-light'), {
    epic: 'LHT-4', owner: 'Karri', title: 'Today\'s light',
    items: ['GET /api/sunlight/' + spot.id, 'Day bar from 5 AM to 8 PM with sunrise, golden hour, sunset, blue hour', 'Cards: Sunrise, Golden hour, Sunset, Blue hour', 'Best direct-light window (big time range) + sun bearing and height']
  });
})();
