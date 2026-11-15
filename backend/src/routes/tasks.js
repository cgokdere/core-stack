const express = require('express');
const { childAccess } = require('../middleware/childAccess');
const { toTask } = require('../mappers');
const { AREAS } = require('../constants');
const { isDate, cleanString } = require('../validate');
const { resolveWeek } = require('../services/weeks');

const SELECT_TASK = `SELECT t.*, u.name AS assigner_name FROM tasks t
  JOIN users u ON u.id = t.assigned_by`;

// M4 - tasks. Parent and linked specialists assign, only the child marks done.
module.exports = function taskRoutes(db) {
  const router = express.Router({ mergeParams: true });

  router.get('/', childAccess(db, ['parent', 'specialist', 'child']), (req, res) => {
    let rows;
    if (req.query.week !== undefined) {
      const week = resolveWeek(req.query.week);
      rows = db
        .prepare(
          `${SELECT_TASK} WHERE t.child_id = ? AND t.due_date BETWEEN ? AND ?
           ORDER BY t.due_date, t.id`
        )
        .all(req.child.id, week.start, week.end);
    } else {
      rows = db
        .prepare(`${SELECT_TASK} WHERE t.child_id = ? ORDER BY t.due_date, t.id`)
        .all(req.child.id);
    }
    res.json({ tasks: rows.map(toTask) });
  });

  router.post('/', childAccess(db, ['parent', 'specialist']), (req, res) => {
    const { title, description, area, dueDate } = req.body || {};
    const cleanTitle = cleanString(title, 120);
    if (!cleanTitle) {
      return res.status(400).json({ error: 'Görev başlığı gereklidir (en fazla 120 karakter).' });
    }
    let cleanDescription = '';
    if (description !== undefined && description !== null && description !== '') {
      cleanDescription = cleanString(description, 500);
      if (!cleanDescription) {
        return res.status(400).json({ error: 'Açıklama en fazla 500 karakter olabilir.' });
      }
    }
    if (!AREAS.includes(area)) {
      return res.status(400).json({ error: 'Geçersiz gelişim alanı.' });
    }
    if (!isDate(dueDate)) {
      return res.status(400).json({ error: 'Son gün geçersiz.' });
    }

    const info = db
      .prepare(
        `INSERT INTO tasks (child_id, title, description, area, due_date, assigned_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(req.child.id, cleanTitle, cleanDescription, area, dueDate, req.user.id, new Date().toISOString());
    const row = db.prepare(`${SELECT_TASK} WHERE t.id = ?`).get(info.lastInsertRowid);
    res.status(201).json({ task: toTask(row) });
  });

  router.patch('/:taskId/done', childAccess(db, ['child']), (req, res) => {
    const task = db
      .prepare('SELECT id, status FROM tasks WHERE id = ? AND child_id = ?')
      .get(Number(req.params.taskId), req.child.id);
    if (!task) {
      return res.status(404).json({ error: 'Görev bulunamadı.' });
    }
    if (task.status !== 'done') {
      db.prepare("UPDATE tasks SET status = 'done', done_at = ? WHERE id = ?").run(
        new Date().toISOString(),
        task.id
      );
    }
    res.json({ task: toTask(db.prepare(`${SELECT_TASK} WHERE t.id = ?`).get(task.id)) });
  });

  return router;
};
