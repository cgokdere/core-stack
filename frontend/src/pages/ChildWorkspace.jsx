import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api.js';
import { useLoad } from '../lib/useLoad.js';
import { todayIso, weekStartOf } from '../lib/dates.js';
import { avatarTone, initials } from '../lib/labels.js';
import { useAuth } from '../auth.jsx';
import { ErrorMessage, Loading, WeekNav } from '../components/ui.jsx';
import { EASE } from '../components/motion.jsx';
import {
  CalendarIcon,
  ChartIcon,
  ChevronLeftIcon,
  FolderIcon,
  NotebookIcon,
  SparkleIcon,
  TasksIcon,
  UsersIcon,
} from '../components/icons.jsx';
import Schedule from '../components/Schedule.jsx';
import Tasks from '../components/Tasks.jsx';
import Entries from '../components/Entries.jsx';
import Documents from '../components/Documents.jsx';
import Stats from '../components/Stats.jsx';
import AiSummary from '../components/AiSummary.jsx';
import Links from '../components/Links.jsx';
import WeekGlance from '../components/WeekGlance.jsx';

const TABS = [
  { id: 'schedule', label: 'Program', icon: CalendarIcon, weekly: true },
  { id: 'tasks', label: 'Görevler', icon: TasksIcon, weekly: true },
  { id: 'entries', label: 'Uzman girdileri', icon: NotebookIcon },
  { id: 'documents', label: 'Belgeler', icon: FolderIcon },
  { id: 'stats', label: 'İstatistik', icon: ChartIcon, weekly: true },
  { id: 'ai', label: 'AI özeti', icon: SparkleIcon, weekly: true },
  { id: 'links', label: 'Bağlı uzmanlar', icon: UsersIcon, parentOnly: true },
];

// The page a parent or a linked specialist works in for one child.
export default function ChildWorkspace() {
  const { childId } = useParams();
  const { user } = useAuth();
  const { data, error, loading } = useLoad(() => api.get(`/children/${childId}`), [childId]);
  const [tab, setTab] = useState('schedule');
  const [weekStart, setWeekStart] = useState(() => weekStartOf(todayIso()));
  // Bumped after a schedule or task change so the weekly glance numbers refresh.
  const [version, setVersion] = useState(0);
  const changed = () => setVersion((v) => v + 1);

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
  const tabs = TABS.filter((t) => !t.parentOnly || role === 'parent');
  const current = tabs.find((t) => t.id === tab) || tabs[0];

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

      <WeekGlance childId={child.id} weekStart={weekStart} version={version} />

      <div className="toolbar">
        <div role="tablist" aria-label="Bölümler" className="tabs">
          {tabs.map((t) => {
            const active = current.id === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={active}
                className="tab"
                onClick={() => setTab(t.id)}
              >
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    className="tab-pill"
                    transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                  />
                )}
                <span className="tab-label">
                  <t.icon size={17} />
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
        {current.weekly && <WeekNav weekStart={weekStart} onChange={setWeekStart} />}
      </div>

      <motion.div
        key={current.id}
        role="tabpanel"
        aria-label={current.label}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: EASE }}
      >
        {current.id === 'schedule' && <Schedule childId={child.id} weekStart={weekStart} canAdd onChanged={changed} />}
        {current.id === 'tasks' && <Tasks childId={child.id} weekStart={weekStart} role={role} userId={user.id} onChanged={changed} />}
        {current.id === 'entries' && <Entries childId={child.id} user={user} />}
        {current.id === 'documents' && <Documents childId={child.id} />}
        {current.id === 'stats' && <Stats childId={child.id} weekStart={weekStart} />}
        {current.id === 'ai' && <AiSummary childId={child.id} weekStart={weekStart} />}
        {current.id === 'links' && <Links childId={child.id} childName={child.name} />}
      </motion.div>
    </section>
  );
}
