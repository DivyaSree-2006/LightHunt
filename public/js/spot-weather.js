// LHT-5 Weather and Suitability Scoring - owner: Navya Durga
(async () => {
  const spot = await LH.spotReady;
  LH.todo(document.getElementById('section-weather'), {
    epic: 'LHT-5', owner: 'Navya', title: 'Is the trip worth it?',
    items: ['GET /api/weather/' + spot.id, 'Score out of 100 with a GO / MAYBE / SKIP badge', '"Why" list with + / - points per reason', 'Cloud forecast bars for the evening', 'If the weather service is down, show a message and keep the rest of the page working']
  });
})();
