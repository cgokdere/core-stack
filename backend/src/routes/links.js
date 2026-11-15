const express = require('express');
const { childAccess } = require('../middleware/childAccess');
const { SPECIALTIES } = require('../constants');

function toLink(row) {
  return {
    specialistId: row.specialist_id,
    name: row.name,
    email: row.email,
    specialty: row.specialty,
    linkedAt: row.created_at,
  };
}

// M2 - the parent links and unlinks specialists. Removing a link is what
// closes the specialist's access, because every child route checks the link.
module.exports = function linkRoutes(db) {
  const router = express.Router({ mergeParams: true });
  router.use(childAccess(db, ['parent']));

  const listQuery = db.prepare(
    `SELECT l.specialist_id, l.specialty, l.created_at, u.name, u.email
     FROM links l JOIN users u ON u.id = l.specialist_id
     WHERE l.child_id = ? ORDER BY l.created_at, l.id`
  );

  router.get('/', (req, res) => {
    res.json({ links: listQuery.all(req.child.id).map(toLink) });
  });

  router.post('/', (req, res) => {
    const { email, specialty } = req.body || {};
    if (typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ error: 'Uzmanın e-posta adresi gereklidir.' });
    }
    if (specialty !== undefined && !SPECIALTIES.includes(specialty)) {
      return res.status(400).json({ error: 'Geçersiz uzman türü.' });
    }
    const specialist = db
      .prepare("SELECT * FROM users WHERE email = ? AND role = 'specialist'")
      .get(email.trim());
    if (!specialist) {
      return res.status(404).json({
        error:
          'Bu e-posta ile kayıtlı bir uzman bulunamadı. Uzmandan önce sisteme kaydolmasını isteyin.',
      });
    }
    const exists = db
      .prepare('SELECT 1 FROM links WHERE child_id = ? AND specialist_id = ?')
      .get(req.child.id, specialist.id);
    if (exists) {
      return res.status(409).json({ error: 'Bu uzman zaten bağlı.' });
    }
    db.prepare(
      'INSERT INTO links (child_id, specialist_id, specialty, created_at) VALUES (?, ?, ?, ?)'
    ).run(req.child.id, specialist.id, specialty || specialist.specialty, new Date().toISOString());
    const link = listQuery.all(req.child.id).find((l) => l.specialist_id === specialist.id);
    res.status(201).json({ link: toLink(link) });
  });

  router.delete('/:specialistId', (req, res) => {
    const result = db
      .prepare('DELETE FROM links WHERE child_id = ? AND specialist_id = ?')
      .run(req.child.id, Number(req.params.specialistId));
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Bu uzman bu çocuğa bağlı değil.' });
    }
    res.status(204).end();
  });

  return router;
};
