// LHT-9 Admin Reports (+ user management from LHT-1) - owner: Divya Sree
(async () => {
  await LH.requireUser(['admin']);
  await LH.nav('admin');

  LH.todo(document.getElementById('users'), {
    epic: 'LHT-1 · LHT-9', owner: 'Divya Sree', title: 'Users',
    items: ['GET /api/admin/users -> table of name, email, role, status', 'Change role dropdown', 'Block / unblock button']
  });

  LH.todo(document.getElementById('reports'), {
    epic: 'LHT-9', owner: 'Divya Sree', title: 'Reports',
    items: ['GET /api/admin/reports', 'Stat cards: users per role, spots per status, reviews, trips planned']
  });
})();
