// LHT-1 User and Role Management - owner: Vankayala Divya Sree
// Working in the base: register, login, logout, "who am I".
// TODO (Divya Sree): stronger validation, blocked-user message, profile page if wanted.
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

const ROLES = ['creator', 'contributor', 'moderator', 'admin'];

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    // Nobody can make themselves an admin from the sign-up page
    const safeRole = ROLES.includes(role) && role !== 'admin' ? role : 'creator';
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hash, safeRole]
    );
    req.session.user = { id: result.insertId, name: name.trim(), email, role: safeRole };
    res.json({ user: req.session.user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That email is already registered.' });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [[user]] = await db.query('SELECT * FROM users WHERE email = ?', [(email || '').trim().toLowerCase()]);
    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
      return res.status(401).json({ error: 'Wrong email or password.' });
    }
    if (user.status === 'blocked') return res.status(403).json({ error: 'This account is blocked.' });
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ user: req.session.user });
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

module.exports = router;
