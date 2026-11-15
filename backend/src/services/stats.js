const { AREAS } = require('../constants');

function percent(done, total) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

// Completion rate of the tasks that are due in the given week.
function weeklyStats(db, childId, week) {
  const rows = db
    .prepare(
      `SELECT area, COUNT(*) AS total, SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done
       FROM tasks WHERE child_id = ? AND due_date BETWEEN ? AND ? GROUP BY area`
    )
    .all(childId, week.start, week.end);

  const byAreaMap = new Map(rows.map((r) => [r.area, r]));
  const byArea = AREAS.map((area) => {
    const row = byAreaMap.get(area);
    const total = row ? row.total : 0;
    const done = row ? row.done : 0;
    return { area, total, done, rate: percent(done, total) };
  });

  const total = byArea.reduce((sum, a) => sum + a.total, 0);
  const done = byArea.reduce((sum, a) => sum + a.done, 0);
  return { weekStart: week.start, weekEnd: week.end, total, done, rate: percent(done, total), byArea };
}

module.exports = { weeklyStats, percent };
