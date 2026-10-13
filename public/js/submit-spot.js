// LHT-2 Photo-Spot Management - owner: Jadwika
// Jira: LHT-50 "Build the spot submission form."
(async () => {
  await LH.requireUser(['contributor', 'moderator', 'admin']);
  await LH.nav('submit');

  LH.todo(document.getElementById('submit-form'), {
    epic: 'LHT-2 · LHT-50', owner: 'Jadwika', title: 'Spot submission form',
    items: [
      'Spot name and short description',
      'Location: "Use my location" button and/or latitude + longitude inputs',
      'Facing direction: dial or dropdown (N, NE, E ... or 0-360°)',
      'Photos upload (1-5 images)',
      'Content types: Portraits, Reels, Architecture, Landscapes (pick one or more)',
      'Validate, then POST FormData to /api/spots -> show "Submitted for review"'
    ]
  });

  LH.todo(document.getElementById('my-submissions'), {
    epic: 'LHT-2', owner: 'Jadwika', title: 'My submissions',
    items: ['GET /api/spots/mine', 'Show each spot with a Pending / Approved / Rejected / Sent back badge', 'Show the moderator note if any']
  });
})();
