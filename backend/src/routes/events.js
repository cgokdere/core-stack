const express = require('express');
const { childAccess } = require('../middleware/childAccess');
const { toEvent } = require('../mappers');
const { AREAS } = require('../constants');
const { isDateTime, cleanString } = require('../validate');
const { resolveWeek } = require('../services/weeks');

// M3 - weekly schedule.
module.exports = function eventRoutes(db) {
  const router = express.Router({ mergeParams: true });

  router.get('/', childAccess(db, ['parent', 'specialist', 'child']), (req, res) => {
    const week = resolveWeek(req.query.week);
    const rows = db
      .prepare(
        `SELECT * FROM events WHERE child_id = ? AND substr(starts_at, 1, 10) BETWEEN ? AND ?
         ORDER BY starts_at, id`
      )
      .all(req.child.id, week.start, week.end);
    res.json({ weekStart: week.start, weekEnd: week.end, events: rows.map(toEvent) });
  });

  router.post('/', childAccess(db, ['parent', 'specialist']), (req, res) => {
    const { title, startsAt, endsAt, area } = req.body || {};
    const cleanTitle = cleanString(title, 120);
    if (!cleanTitle) {
      return res.status(400).json({ error: 'Etkinlik başlığı gereklidir (en fazla 120 karakter).' });
    }
    if (!isDateTime(startsAt)) {
      return res.status(400).json({ error: 'Başlangıç zamanı geçersiz.' });
    }
    if (endsAt !== undefined && endsAt !== null && endsAt !== '') {
      if (!isDateTime(endsAt) || endsAt < startsAt) {
        return res.status(400).json({ error: 'Bitiş zamanı geçersiz veya başlangıçtan önce.' });
      }
    }
    if (!AREAS.includes(area)) {
      return res.status(400).json({ error: 'Geçersiz gelişim alanı.' });
    }

    const info = db
      .prepare(
        'INSERT INTO events (child_id, title, starts_at, ends_at, area, created_by) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(req.child.id, cleanTitle, startsAt, endsAt || null, area, req.user.id);
    const row = db.prepare('SELECT * FROM events WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ event: toEvent(row) });
  });

  return router;
};
