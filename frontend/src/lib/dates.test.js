import { describe, it, expect } from 'vitest';
import { addDays, formatDate, formatShort, formatWeek, timeOf, todayIso, weekDays, weekStartOf } from './dates.js';
import { formatSize } from './labels.js';

describe('dates', () => {
  it('finds the Monday of a week', () => {
    expect(weekStartOf('2026-10-14')).toBe('2026-10-12');
    expect(weekStartOf('2026-10-12')).toBe('2026-10-12');
    expect(weekStartOf('2026-10-18')).toBe('2026-10-12');
    expect(weekStartOf('2027-01-01')).toBe('2026-12-28');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-10-12', -7)).toBe('2026-10-05');
  });

  it('lists the seven days of a week', () => {
    const days = weekDays('2026-10-12');
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({ name: 'Pzt', date: '2026-10-12' });
    expect(days[6]).toEqual({ name: 'Paz', date: '2026-10-18' });
  });

  it('formats dates in Turkish', () => {
    expect(formatShort('2026-10-12')).toBe('12 Eki');
    expect(formatDate('2026-02-03')).toBe('3 Şub 2026');
    expect(formatWeek('2026-10-12')).toBe('12 Eki – 18 Eki 2026');
    expect(timeOf('2026-10-12T16:30')).toBe('16:30');
  });

  it('computes today in local time', () => {
    expect(todayIso(new Date('2026-10-14T12:00:00'))).toBe('2026-10-14');
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('formatSize', () => {
  it('uses B, KB and MB', () => {
    expect(formatSize(500)).toBe('500 B');
    expect(formatSize(2048)).toBe('2 KB');
    expect(formatSize(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});
