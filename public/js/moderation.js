// LHT-2 Spot Moderation - owner: Jadwika
(async () => {
  await LH.requireUser(['moderator', 'admin']);
  await LH.nav('moderation');

  LH.todo(document.getElementById('pending-table'), {
    epic: 'LHT-2', owner: 'Jadwika', title: 'Pending spots table',
    items: ['GET /api/moderation/pending', 'Columns: Spot (photo + name), Faces, Good for, Submitted, Status', 'Click a row to open it in the review panel']
  });

  LH.todo(document.getElementById('review-panel'), {
    epic: 'LHT-2', owner: 'Jadwika', title: 'Review panel',
    items: ['Photos, location, front faces, good for', 'Note to the contributor', 'Approve / Send back / Reject buttons -> POST /api/moderation/:id/...']
  });
})();
