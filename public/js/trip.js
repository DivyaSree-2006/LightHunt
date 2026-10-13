// LHT-7 Route Planning and Navigation - owner: Likitha Challa
// Arrives here as /routes.html?spots=1,2,3 from the For you page.
(async () => {
  await LH.requireUser(['creator', 'admin']);
  await LH.nav('routes');

  LH.todo(document.getElementById('route-stops'), {
    epic: 'LHT-7', owner: 'Likitha', title: 'Ordered stops',
    items: ['POST /api/trips/plan with the selected spot ids', 'Each stop: number, photo, name, light type, arrive time, "leave by" time', 'Totals: number of stops and time range', '"Open in Google Maps" button (a directions link is enough)']
  });

  LH.todo(document.getElementById('route-map'), {
    epic: 'LHT-7', owner: 'Likitha', title: 'Route map',
    items: ['Map with numbered markers and a line joining them in order']
  });
})();
