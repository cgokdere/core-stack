const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTH_NAMES = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export function toIso(date) {
  return date.toISOString().slice(0, 10);
}

function parse(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`);
}

export function todayIso(now = new Date()) {
  return toIso(new Date(now.getTime() - now.getTimezoneOffset() * 60000));
}

export function addDays(dateStr, days) {
  return toIso(new Date(parse(dateStr).getTime() + days * 86400000));
}

// Monday of the week that contains the given date (weeks run Monday to Sunday).
export function weekStartOf(dateStr) {
  const daysSinceMonday = (parse(dateStr).getUTCDay() + 6) % 7;
  return addDays(dateStr, -daysSinceMonday);
}

export function weekDays(weekStart) {
  return DAY_NAMES.map((name, i) => ({ name, date: addDays(weekStart, i) }));
}

export function formatShort(dateStr) {
  const d = parse(dateStr);
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}`;
}

export function formatWeek(weekStart) {
  const end = addDays(weekStart, 6);
  return `${formatShort(weekStart)} – ${formatShort(end)} ${parse(end).getUTCFullYear()}`;
}

export function formatDate(dateStr) {
  return `${formatShort(dateStr)} ${parse(dateStr).getUTCFullYear()}`;
}

export function timeOf(dateTime) {
  return dateTime.slice(11, 16);
}
