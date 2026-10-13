// Shared helpers for every page. Load it before your own page script:
//   <script src="/js/common.js"></script>
//   <script src="/js/your-module.js"></script>
//
// What you get:
//   await LH.api('/api/spots')                       -> GET JSON (throws on error)
//   await LH.api('/api/x', { method:'POST', body:{} }) -> POST JSON
//   await LH.requireUser(['moderator','admin'])      -> current user or redirect to login
//   LH.nav('map')                                    -> draws the top navbar
//   LH.todo(el, {...})                               -> "not built yet" card
//   LH.escape(text)                                  -> safe text for innerHTML
//   LH.compass(deg)                                  -> 'E', 'NW', ...

const LH = {
  user: null,

  async api(url, opts = {}) {
    const init = { method: opts.method || 'GET', headers: {}, credentials: 'same-origin' };
    if (opts.body instanceof FormData) {
      init.body = opts.body;                       // file uploads
    } else if (opts.body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }
    const res = await fetch(url, init);
    let data = {};
    try { data = await res.json(); } catch (e) { /* empty body */ }
    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  },

  async me() {
    if (this.user) return this.user;
    const { user } = await this.api('/api/auth/me');
    this.user = user;
    return user;
  },

  // Redirects to login if not signed in, or home if the role is not allowed.
  async requireUser(roles) {
    const user = await this.me();
    if (!user) { location.href = '/login.html?next=' + encodeURIComponent(location.pathname + location.search); return new Promise(() => {}); }
    if (roles && !roles.includes(user.role)) { location.href = '/map.html'; return new Promise(() => {}); }
    return user;
  },

  // Navbar. Links show only for roles that can use them.
  async nav(active) {
    const user = await this.me().catch(() => null);
    const all = [
      { key: 'map',        href: '/map.html',         label: 'Map',        roles: ['creator','contributor','moderator','admin'] },
      { key: 'for-you',    href: '/for-you.html',     label: 'For you',    roles: ['creator','admin'] },
      { key: 'routes',     href: '/routes.html',      label: 'Routes',     roles: ['creator','admin'] },
      { key: 'submit',     href: '/submit-spot.html', label: 'Add a spot', roles: ['contributor','moderator','admin'] },
      { key: 'moderation', href: '/moderation.html',  label: 'Moderation', roles: ['moderator','admin'] },
      { key: 'admin',      href: '/admin.html',       label: 'Admin',      roles: ['admin'] }
    ];
    const links = user ? all.filter(l => l.roles.includes(user.role)) : [];
    const initials = user ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '';
    const nav = document.createElement('header');
    nav.className = 'nav';
    nav.innerHTML = `
      <a class="brand" href="/">LightHunt</a>
      <nav class="links">
        ${links.map(l => `<a href="${l.href}" class="${l.key === active ? 'active' : ''}">${l.label}</a>`).join('')}
      </nav>
      ${user ? `
        <div class="user-menu">
          <button class="avatar" aria-label="Account">${this.escape(initials)}</button>
          <div class="user-pop">
            <div><strong>${this.escape(user.name)}</strong></div>
            <div class="hint role">${this.escape(user.role)}</div>
            <hr style="border:0;border-top:1px solid var(--line);margin:10px 0">
            <button class="btn small block" data-logout>Sign out</button>
          </div>
        </div>` : `<a class="btn primary small" href="/login.html" style="margin-left:auto">Sign in</a>`}
    `;
    document.body.prepend(nav);
    const btn = nav.querySelector('.avatar');
    if (btn) {
      const pop = nav.querySelector('.user-pop');
      btn.onclick = () => pop.classList.toggle('open');
      nav.querySelector('[data-logout]').onclick = async () => {
        await this.api('/api/auth/logout', { method: 'POST' });
        location.href = '/';
      };
    }
  },

  // Placeholder card. Delete the call when you build the real thing.
  todo(el, { epic, owner, title, items = [] }) {
    el.innerHTML = `
      <div class="todo-card">
        <div class="tag">${this.escape(epic)} · ${this.escape(owner)}</div>
        <h3>${this.escape(title)}</h3>
        <div class="hint">Not built yet. What to build:</div>
        <ul>${items.map(i => `<li>${this.escape(i)}</li>`).join('')}</ul>
      </div>`;
  },

  escape(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  compass(deg) {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
  },

  param(name) { return new URLSearchParams(location.search).get(name); }
};
