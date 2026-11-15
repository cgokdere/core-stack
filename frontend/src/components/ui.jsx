import React from 'react';
import { AREA_LABELS } from '../lib/labels.js';
import { addDays, formatWeek, todayIso, weekStartOf } from '../lib/dates.js';
import { ChevronLeftIcon, ChevronRightIcon, InboxIcon } from './icons.jsx';

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="error">
      {message}
    </p>
  );
}

export function AreaBadge({ area }) {
  return <span className={`badge area-${area}`}>{AREA_LABELS[area] || area}</span>;
}

// Skeleton rows instead of a spinner: the placeholder has the shape of the content that is coming.
export function Loading({ loading, rows = 3 }) {
  if (!loading) return null;
  return (
    <div className="skeleton" role="status" aria-live="polite">
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} />
      ))}
      <span className="sr-only">Yükleniyor…</span>
    </div>
  );
}

export function EmptyState({ children, icon: Icon = InboxIcon }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={22} />
      </span>
      <p>{children}</p>
    </div>
  );
}

export function WeekNav({ weekStart, onChange }) {
  const thisWeek = weekStartOf(todayIso());
  return (
    <div className="week-nav" role="group" aria-label="Hafta seçimi">
      <button type="button" onClick={() => onChange(addDays(weekStart, -7))} aria-label="Önceki hafta">
        <ChevronLeftIcon size={18} />
      </button>
      <strong data-testid="week-label">{formatWeek(weekStart)}</strong>
      <button type="button" onClick={() => onChange(addDays(weekStart, 7))} aria-label="Sonraki hafta">
        <ChevronRightIcon size={18} />
      </button>
      {weekStart !== thisWeek && (
        <button type="button" className="ghost" onClick={() => onChange(thisWeek)} style={{ width: 'auto', padding: '0 0.7rem' }}>
          Bu hafta
        </button>
      )}
    </div>
  );
}
