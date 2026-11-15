import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { useLoad } from '../lib/useLoad.js';
import { formatDate, todayIso, weekStartOf } from '../lib/dates.js';
import { avatarTone, initials } from '../lib/labels.js';
import { EmptyState, ErrorMessage, Loading, WeekNav } from '../components/ui.jsx';
import Schedule from '../components/Schedule.jsx';
import Tasks from '../components/Tasks.jsx';

// The child sees only their own tasks and schedule (M1, M3, M4).
export default function ChildHome() {
  const { data, error, loading } = useLoad(() => api.get('/children'), []);
  const [weekStart, setWeekStart] = useState(() => weekStartOf(todayIso()));

  if (loading) return <Loading loading rows={4} />;
  if (error) return <ErrorMessage message={error} />;
  const child = data.children[0];
  if (!child) return <EmptyState>Hesabınıza bağlı bir çocuk profili yok.</EmptyState>;

  return (
    <section>
      <div className="hero">
        <span className={`avatar lg ${avatarTone(child.name)}`} aria-hidden="true">
          {initials(child.name)}
        </span>
        <div className="hero-greeting">
          <h1>Merhaba {child.name.split(' ')[0]}!</h1>
          <p className="muted">Bugün {formatDate(todayIso())}. İşte bu haftaki görevlerin ve programın.</p>
        </div>
      </div>
      <div className="toolbar">
        <WeekNav weekStart={weekStart} onChange={setWeekStart} />
      </div>
      <Tasks childId={child.id} weekStart={weekStart} role="child" />
      <Schedule childId={child.id} weekStart={weekStart} canAdd={false} />
    </section>
  );
}
