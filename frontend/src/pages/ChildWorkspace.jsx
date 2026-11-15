import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useLoad } from '../lib/useLoad.js';
import { todayIso, weekStartOf } from '../lib/dates.js';
import { avatarTone, initials } from '../lib/labels.js';
import { ErrorMessage, Loading, WeekNav } from '../components/ui.jsx';
import { ChevronLeftIcon } from '../components/icons.jsx';
import Schedule from '../components/Schedule.jsx';
import Tasks from '../components/Tasks.jsx';
import Entries from '../components/Entries.jsx';
import Links from '../components/Links.jsx';
import { useAuth } from '../auth.jsx';

const TABS = [
  { id: 'schedule', label: 'Program', weekly: true },
  { id: 'tasks', label: 'Görevler', weekly: true },
  { id: 'entries', label: 'Uzman girdileri' },
  { id: 'links', label: 'Bağlı uzmanlar', parentOnly: true },
];

export default function ChildWorkspace() {
  const { childId } = useParams();
  const { user } = useAuth();
  const { data, error, loading } = useLoad(() => api.get(`/children/${childId}`), [childId]);
  const [tab, setTab] = useState('schedule');
  const [weekStart, setWeekStart] = useState(() => weekStartOf(todayIso()));

  if (loading) return <Loading loading rows={4} />;
  if (error) {
    return (
      <>
        <ErrorMessage message={error} />
        <Link to="/children">Çocuk listesine dön</Link>
      </>
    );
  }

  const { child, role } = data;
  const tabs = TABS.filter((item) => !item.parentOnly || role === 'parent');
  const current = tabs.find((item) => item.id === tab) || tabs[0];

  return (
    <section>
      <p className="breadcrumb">
        <ChevronLeftIcon size={15} />
        <Link to="/children">Çocuklarım</Link> / {child.name}
      </p>
      <div className="hero">
        <span className={`avatar lg ${avatarTone(child.name)}`} aria-hidden="true">
          {initials(child.name)}
        </span>
        <div className="hero-greeting">
          <h1>{child.name}</h1>
          <p className="muted">{child.grade}</p>
        </div>
      </div>
      <div className="toolbar">
        <div role="tablist" aria-label="Bölümler" className="tabs">
          {tabs.map((item) => (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={current.id === item.id}
              className="tab"
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {current.weekly && <WeekNav weekStart={weekStart} onChange={setWeekStart} />}
      </div>
      {current.id === 'schedule' && <Schedule childId={child.id} weekStart={weekStart} canAdd />}
      {current.id === 'tasks' && <Tasks childId={child.id} weekStart={weekStart} role={role} userId={user.id} />}
      {current.id === 'entries' && <Entries childId={child.id} user={user} />}
      {current.id === 'links' && <Links childId={child.id} childName={child.name} />}
    </section>
  );
}
