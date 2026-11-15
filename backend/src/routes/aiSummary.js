const express = require('express');
const { childAccess } = require('../middleware/childAccess');
const { resolveWeek } = require('../services/weeks');
const { weeklyStats } = require('../services/stats');
const { generateSummary } = require('../services/aiService');

const AREA_FALLBACK = 'academic';

// Collects the week's records with the same access rules as the plain routes
// (the child is not allowed here at all) and numbers them as citable sources.
function collectRecords(db, childId, week) {
  const entries = db
    .prepare(
      `SELECT e.*, u.name AS author_name FROM entries e JOIN users u ON u.id = e.author_id
       WHERE e.child_id = ? AND e.entry_date BETWEEN ? AND ? ORDER BY e.entry_date, e.id`
    )
    .all(childId, week.start, week.end);
  const events = db
    .prepare(
      `SELECT * FROM events WHERE child_id = ? AND substr(starts_at, 1, 10) BETWEEN ? AND ?
       ORDER BY starts_at, id`
    )
    .all(childId, week.start, week.end);
  const tasks = db
    .prepare(
      `SELECT * FROM tasks WHERE child_id = ? AND due_date BETWEEN ? AND ? ORDER BY due_date, id`
    )
    .all(childId, week.start, week.end);

  const records = [];
  const add = (record) => records.push({ ref: records.length + 1, area: AREA_FALLBACK, ...record });
  entries.forEach((e) =>
    add({ type: 'entry', id: e.id, date: e.entry_date, title: e.title, detail: e.body, area: e.area, author: e.author_name })
  );
  events.forEach((e) =>
    add({ type: 'event', id: e.id, date: e.starts_at.slice(0, 10), title: e.title, detail: '', area: e.area })
  );
  tasks.forEach((t) =>
    add({
      type: 'task',
      id: t.id,
      date: t.due_date,
      title: t.title,
      detail: t.status === 'done' ? 'completed' : 'not completed',
      area: t.area,
      status: t.status,
    })
  );
  return records;
}

// M8 - role-based AI summary. Always labelled and linked to its sources.
module.exports = function aiSummaryRoutes(db, config, aiFetch) {
  const router = express.Router({ mergeParams: true });

  router.post('/', childAccess(db, ['parent', 'specialist']), async (req, res, next) => {
    // Express 4 does not catch errors thrown in async handlers, so a bad
    // "week" is handed to the error middleware explicitly.
    let week;
    try {
      week = resolveWeek((req.body || {}).week);
    } catch (err) {
      return next(err);
    }
    const records = collectRecords(db, req.child.id, week);
    const base = {
      label: 'AI-generated',
      role: req.childRole,
      weekStart: week.start,
      weekEnd: week.end,
      provider: config.ai.provider,
    };
    const sources = records.map(({ ref, type, id, date, title }) => ({ ref, type, id, date, title }));

    if (records.length === 0) {
      return res.json({ ...base, summary: 'Bu hafta için özetlenecek kayıt bulunamadı.', sources: [] });
    }

    try {
      const summary = await generateSummary(
        config.ai,
        {
          role: req.childRole,
          childName: req.child.name,
          weekStart: week.start,
          weekEnd: week.end,
          records,
          stats: weeklyStats(db, req.child.id, week),
        },
        aiFetch
      );
      res.json({ ...base, summary, sources });
    } catch (err) {
      console.error('AI summary failed:', err.message);
      res.status(502).json({ error: 'AI özeti şu anda üretilemedi. Daha sonra tekrar deneyin.' });
    }
  });

  return router;
};
