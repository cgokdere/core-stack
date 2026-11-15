// Weeks run Monday to Sunday and are addressed by any date inside them.
const { isDate, HttpError } = require('../validate');

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function todayLocal(now = new Date()) {
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function weekRange(dateStr) {
  const date = new Date(`${dateStr}T00:00:00Z`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  const start = new Date(date.getTime() - daysSinceMonday * 86400000);
  const end = new Date(start.getTime() + 6 * 86400000);
  return { start: toIsoDate(start), end: toIsoDate(end) };
}

// Resolves the optional ?week=YYYY-MM-DD query parameter.
function resolveWeek(weekParam, now = new Date()) {
  if (weekParam === undefined || weekParam === '') return weekRange(todayLocal(now));
  if (!isDate(weekParam)) throw new HttpError(400, 'Hafta tarihi YYYY-AA-GG biçiminde olmalıdır.');
  return weekRange(weekParam);
}

module.exports = { weekRange, resolveWeek, todayLocal };
