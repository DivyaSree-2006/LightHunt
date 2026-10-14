// LHT-10 Ratings and Reviews - owner: Jadwika
//   LHT-100 form for submitting a rating and review
//   LHT-101 save the feedback   LHT-102 display ratings and reviews
(async () => {
  const spot = await LH.spotReady;
  const box = document.getElementById('section-reviews');

  document.head.insertAdjacentHTML('beforeend', `<style>
    .stars { color:var(--sun); letter-spacing:2px; }
    .stars .off { color:var(--line); }
    .avg { display:flex; align-items:baseline; gap:10px; margin:6px 0 16px; }
    .avg .stat { font-size:38px; }
    .star-pick { display:flex; gap:4px; }
    .star-pick button { background:none; border:0; font-size:28px; line-height:1; cursor:pointer; color:var(--line); padding:0 2px; }
    .star-pick button.on { color:var(--sun); }
    .review { padding:12px 0; border-top:1px solid var(--line); }
    .review p { margin:4px 0 0; color:var(--ink-2); font-size:14px; }
  </style>`);

  const stars = (n) => '★★★★★'.slice(0, n) + `<span class="off">${'★★★★★'.slice(n)}</span>`;

  async function load() {
    box.className = 'card';
    box.innerHTML = '<p class="hint">Loading reviews…</p>';
    try {
      const { average, count, reviews, mine } = await LH.api('/api/reviews/spot/' + spot.id);
      box.innerHTML = `
        <h3>Ratings &amp; <em>reviews</em></h3>
        <div class="avg">
          <span class="stat">${average ?? '–'}</span>
          <span class="stars" aria-label="${average ?? 0} out of 5">${stars(Math.round(average || 0))}</span>
          <span class="hint">${count} review${count === 1 ? '' : 's'}</span>
        </div>

        <form id="review-form" class="card soft" style="padding:16px">
          <label>${mine ? 'Update your review' : 'Rate this spot'}</label>
          <div class="star-pick" id="star-pick" role="radiogroup" aria-label="Rating">
            ${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}" aria-label="${n} star${n > 1 ? 's' : ''}">★</button>`).join('')}
          </div>
          <textarea id="review-comment" placeholder="How was the light? Any tips for other creators?" style="margin-top:10px">${LH.escape(mine?.comment || '')}</textarea>
          <div id="review-msg" class="msg hidden" style="margin:10px 0 0"></div>
          <button class="btn primary small" type="submit" style="margin-top:10px">${mine ? 'Update review' : 'Post review'}</button>
        </form>

        <div style="margin-top:12px">
          ${reviews.length ? reviews.map(r => `
            <div class="review">
              <div class="row spread">
                <strong>${LH.escape(r.user_name)}</strong>
                <span class="hint">${LH.escape(String(r.created_at).slice(0, 10))}</span>
              </div>
              <div class="stars" style="font-size:14px">${stars(r.rating)}</div>
              ${r.comment ? `<p>${LH.escape(r.comment)}</p>` : ''}
            </div>`).join('') : '<p class="hint">No reviews yet. Be the first!</p>'}
        </div>`;

      // ---- LHT-100: star picker + form ----
      let rating = mine?.rating || 0;
      const pick = document.getElementById('star-pick');
      const paint = () => pick.querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.n) <= rating));
      pick.querySelectorAll('button').forEach(b => b.onclick = () => { rating = Number(b.dataset.n); paint(); });
      paint();

      // ---- LHT-101: save ----
      document.getElementById('review-form').onsubmit = async (e) => {
        e.preventDefault();
        const msg = document.getElementById('review-msg');
        if (!rating) { msg.className = 'msg error'; msg.textContent = 'Pick 1 to 5 stars.'; return; }
        try {
          await LH.api('/api/reviews/spot/' + spot.id, {
            method: 'POST',
            body: { rating, comment: document.getElementById('review-comment').value }
          });
          await load();
        } catch (err) {
          msg.className = 'msg error'; msg.textContent = err.message;
        }
      };
    } catch (err) {
      box.innerHTML = `<div class="msg error">${LH.escape(err.message)}</div>`;
    }
  }
  load();
})();
