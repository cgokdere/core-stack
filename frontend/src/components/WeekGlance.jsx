import React from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api.js';
import { useLoad } from '../lib/useLoad.js';
import { timeOf } from '../lib/dates.js';
import { CountUp, EASE } from './motion.jsx';

function nowLocal(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function Tile({ label, value, suffix = '', note, hot, index }) {
  return (
    <motion.article
      className={hot ? 'tile hot' : 'tile'}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay: 0.06 * index }}
    >
      <span className="tile-label">{label}</span>
      <strong className="tile-value">
        <CountUp value={value} format={(n) => `${n}${suffix}`} delay={0.1 + 0.06 * index} />
        <span className="sr-only">
          {value}
          {suffix}
        </span>
      </strong>
      <span className="tile-note">{note}</span>
    </motion.article>
  );
}

// A quick look at the selected week for parents and specialists. It is only a convenience:
// if the numbers cannot be loaded it simply does not appear, the tabs below still work.
export default function WeekGlance({ childId, weekStart, version = 0 }) {
  const stats = useLoad(() => api.get(`/children/${childId}/stats?week=${weekStart}`), [childId, weekStart, version]);
  const events = useLoad(() => api.get(`/children/${childId}/events?week=${weekStart}`), [childId, weekStart, version]);

  if (stats.loading && !stats.data) {
    return (
      <div className="glance" aria-hidden="true">
        <span className="tile-skel" />
        <span className="tile-skel" />
        <span className="tile-skel" />
      </div>
    );
  }
  if (!stats.data) return null;

  const { rate, done, total } = stats.data.stats;
  const eventList = events.data ? events.data.events : null;
  const upcoming = eventList ? eventList.find((e) => e.startsAt >= nowLocal()) : null;

  return (
    <div className="glance" aria-label="Haftaya genel bakış" role="group" key={`${weekStart}-${version}`}>
      <Tile index={0} hot label="Haftalık tamamlanma" value={rate} suffix="%" note={`${done} / ${total} görev tamamlandı`} />
      <Tile index={1} label="Bekleyen görev" value={total - done} note="Bu hafta son günü gelenler" />
      {eventList && (
        <Tile
          index={2}
          label="Programdaki etkinlik"
          value={eventList.length}
          note={upcoming ? `Sıradaki: ${upcoming.title} · ${timeOf(upcoming.startsAt)}` : 'Bu hafta başka etkinlik yok'}
        />
      )}
    </div>
  );
}
