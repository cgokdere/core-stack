const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');
const { toUser } = require('../mappers');

// Compared against when the e-mail is unknown, so both failures take similar time.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

module.exports = function authRoutes(db, config) {
  const router = express.Router();

  router.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre gereklidir.' });
    }
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim());
    const ok = bcrypt.compareSync(password, user ? user.password_hash : DUMMY_HASH);
    if (!user || !ok) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
    }
    const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
      expiresIn: '8h',
    });
    res.json({ token, user: toUser(user) });
  });

  router.get('/me', authenticate(db, config), (req, res) => {
    res.json({ user: toUser(req.user) });
  });

  return router;
};
