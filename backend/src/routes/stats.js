const express = require('express');
const { childAccess } = require('../middleware/childAccess');
const { resolveWeek } = require('../services/weeks');
const { weeklyStats } = require('../services/stats');

// M7 - weekly task completion rate, in total and by development area.
module.exports = function statsRoutes(db) {
  const router = express.Router({ mergeParams: true });

  router.get('/', childAccess(db, ['parent', 'specialist']), (req, res) => {
    const week = resolveWeek(req.query.week);
    res.json({ stats: weeklyStats(db, req.child.id, week) });
  });

  return router;
};
