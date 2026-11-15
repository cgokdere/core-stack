const express = require('express');
const { childAccess } = require('../middleware/childAccess');
const { FEEDBACK_RATINGS } = require('../constants');
const { resolveWeek } = require('../services/weeks');

// M8 - the reader says whether an AI summary was helpful or contained wrong information.
// Only the parent and linked specialists may do this, the same people who may ask for a summary.
module.exports = function aiFeedbackRoutes(db) {
  const router = express.Router({ mergeParams: true });

  router.post('/', childAccess(db, ['parent', 'specialist']), (req, res) => {
    const { week, rating } = req.body || {};
    const range = resolveWeek(week);
    if (!FEEDBACK_RATINGS.includes(rating)) {
      return res.status(400).json({ error: 'Geri bildirim "faydalı" ya da "hatalı" olmalıdır.' });
    }
    const createdAt = new Date().toISOString();
    const info = db
      .prepare(
        `INSERT INTO ai_feedback (child_id, user_id, role, week_start, rating, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(req.child.id, req.user.id, req.childRole, range.start, rating, createdAt);
    res.status(201).json({
      feedback: { id: Number(info.lastInsertRowid), rating, weekStart: range.start, role: req.childRole, createdAt },
    });
  });

  return router;
};
