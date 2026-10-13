// LHT-6 Creator Preferences and Recommendations - owner: Navya Durga
(async () => {
  await LH.requireUser(['creator', 'admin']);
  await LH.nav('for-you');

  LH.todo(document.getElementById('preferences'), {
    epic: 'LHT-6', owner: 'Navya', title: 'Your shoot',
    items: ['When are you free? (from / until)', 'How far will you travel? (km slider)', 'What are you shooting? (Reels / Portraits / Architecture / Landscapes)', 'Save -> POST /api/recommendations/preferences']
  });

  LH.todo(document.getElementById('recommendations'), {
    epic: 'LHT-6', owner: 'Navya', title: 'Ranked spots',
    items: ['GET /api/recommendations?lat=&lng=', 'Numbered list: photo, name, best window, score circle, Go / Check button', '"Plan a route from the top 3" -> /routes.html?spots=1,2,3']
  });
})();
