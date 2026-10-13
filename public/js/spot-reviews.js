// LHT-10 Ratings and Reviews - owner: Jadwika
(async () => {
  const spot = await LH.spotReady;
  LH.todo(document.getElementById('section-reviews'), {
    epic: 'LHT-10', owner: 'Jadwika', title: 'Reviews',
    items: ['GET /api/reviews/spot/' + spot.id, 'Average rating + list of reviews', 'Form: 1-5 stars + comment -> POST /api/reviews/spot/' + spot.id]
  });
})();
