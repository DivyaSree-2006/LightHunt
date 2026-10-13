// LHT-8 On-Site Photography Guidance - owner: Karri Eakshith
(async () => {
  const spot = await LH.spotReady;
  LH.todo(document.getElementById('section-guidance'), {
    epic: 'LHT-8', owner: 'Karri', title: 'Where to stand',
    items: ['GET /api/guidance/' + spot.id, 'Heading like "Stand west, shoot east"', 'Steps: where to stand, which way to face (bearing), where shadows fall', 'Simple diagram: spot, sun direction, "You" marker', '"Navigate here" -> Google Maps link']
  });
})();
