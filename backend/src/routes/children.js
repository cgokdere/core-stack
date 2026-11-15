const express = require('express');
const { childAccess } = require('../middleware/childAccess');
const { toChild } = require('../mappers');

module.exports = function childrenRoutes(db) {
  const router = express.Router();

  // The children the caller may work with, depending on their role.
  router.get('/', (req, res) => {
    const { user } = req;
    let rows;
    if (user.role === 'parent') {
      rows = db.prepare('SELECT * FROM children WHERE parent_id = ? ORDER BY name').all(user.id);
    } else if (user.role === 'specialist') {
      rows = db
        .prepare(
          `SELECT c.* FROM children c JOIN links l ON l.child_id = c.id
           WHERE l.specialist_id = ? ORDER BY c.name`
        )
        .all(user.id);
    } else {
      rows = db.prepare('SELECT * FROM children WHERE user_id = ?').all(user.id);
    }
    res.json({ children: rows.map(toChild) });
  });

  router.get('/:childId', childAccess(db, ['parent', 'specialist', 'child']), (req, res) => {
    res.json({ child: toChild(req.child), role: req.childRole });
  });

  return router;
};
