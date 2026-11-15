import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useLoad } from '../lib/useLoad.js';
import { formatShort, timeOf, todayIso, weekDays } from '../lib/dates.js';
import { AREAS, AREA_LABELS } from '../lib/labels.js';
import { AreaBadge, ErrorMessage, Loading } from './ui.jsx';
import { Item, Stagger } from './motion.jsx';
import { PlusIcon } from './icons.jsx';
import { useToast } from './toast.jsx';

function EventForm({ childId, weekStart, onAdded }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(weekStart);
  const [start, setStart] = useState('16:00');
  const [end, setEnd] = useState('');
  const [area, setArea] = useState('academic');
  const [error, setError] = useState('');

  useEffect(() => setDate(weekStart), [weekStart]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/children/${childId}/events`, {
        title,
        startsAt: `${date}T${start}`,
        endsAt: end ? `${date}T${end}` : undefined,
        area,
      });
      setTitle('');
      onAdded();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={submit} className="form" aria-label="Etkinlik ekle">
      <h3>Etkinlik ekle</h3>
      <label>
        Etkinlik başlığı
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
      </label>
      <label>
        Tarih
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <div className="row">
        <label>
          Başlangıç saati
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
        </label>
        <label>
          Bitiş saati
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
      <label>
        Gelişim alanı
        <select value={area} onChange={(e) => setArea(e.target.value)}>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {AREA_LABELS[a]}
            </option>
          ))}
        </select>
      </label>
      <ErrorMessage message={error} />
      <button type="submit" className="primary">
        <PlusIcon size={17} />
        Etkinliği ekle
      </button>
    </form>
  );
}

// M3 - events of the selected week, one column per day.
export default function Schedule({ childId, weekStart, canAdd, onChanged }) {
  const { data, error, loading, reload } = useLoad(
    () => api.get(`/children/${childId}/events?week=${weekStart}`),
    [childId, weekStart]
  );
  const toast = useToast();
  const events = data ? data.events : [];
  const today = todayIso();

  return (
    <section aria-labelledby="schedule-title" className="card">
      <h2 id="schedule-title">Haftalık program</h2>
      <Loading loading={loading && !data} rows={2} />
      <ErrorMessage message={error} />
      <Stagger as="div" className="week-grid" key={weekStart}>
        {weekDays(weekStart).map((day) => {
          const dayEvents = events.filter((ev) => ev.startsAt.slice(0, 10) === day.date);
          return (
            <Item as="div" key={day.date} className={day.date === today ? 'day today' : 'day'}>
              <h3>
                {day.name} <span className="muted">{formatShort(day.date)}</span>
              </h3>
              {dayEvents.length === 0 ? (
                <p className="day-empty">Etkinlik yok</p>
              ) : (
                <ul className="plain">
                  {dayEvents.map((ev) => (
                    <li key={ev.id} className={`event area-${ev.area}`}>
                      <span className="time">{timeOf(ev.startsAt)}</span>
                      {ev.title}
                      <div style={{ marginTop: '0.35rem' }}>
                        <AreaBadge area={ev.area} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Item>
          );
        })}
      </Stagger>
      {canAdd && (
        <EventForm
          childId={childId}
          weekStart={weekStart}
          onAdded={() => {
            reload();
            toast('Etkinlik eklendi');
            if (onChanged) onChanged();
          }}
        />
      )}
    </section>
  );
}
