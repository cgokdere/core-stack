import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api.js';
import { useLoad } from '../lib/useLoad.js';
import { formatShort } from '../lib/dates.js';
import { AREAS, AREA_LABELS } from '../lib/labels.js';
import { AreaBadge, EmptyState, ErrorMessage, Loading } from './ui.jsx';
import { EASE, Item, Stagger } from './motion.jsx';
import { CheckIcon, PlusIcon, TasksIcon } from './icons.jsx';
import { useToast } from './toast.jsx';

function TaskForm({ childId, weekStart, onAdded }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('academic');
  const [dueDate, setDueDate] = useState(weekStart);
  const [error, setError] = useState('');

  useEffect(() => setDueDate(weekStart), [weekStart]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/children/${childId}/tasks`, { title, description, area, dueDate });
      setTitle('');
      setDescription('');
      onAdded();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={submit} className="form" aria-label="Görev ver">
      <h3>Görev ver</h3>
      <label>
        Görev başlığı
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
      </label>
      <label>
        Açıklama
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={2} />
      </label>
      <div className="row">
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
        <label>
          Son gün
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        </label>
      </div>
      <ErrorMessage message={error} />
      <button type="submit" className="primary">
        <PlusIcon size={17} />
        Görevi ver
      </button>
    </form>
  );
}

// M4 - tasks of the selected week. The child marks them done; assigners see the status.
export default function Tasks({ childId, weekStart, role, userId, onChanged }) {
  const { data, error, loading, reload } = useLoad(
    () => api.get(`/children/${childId}/tasks?week=${weekStart}`),
    [childId, weekStart]
  );
  const [actionError, setActionError] = useState('');
  const [filter, setFilter] = useState('all');
  const toast = useToast();
  const tasks = data ? data.tasks : [];
  // A specialist can narrow the list to the tasks they assigned themselves (the status list in the brief).
  const canFilter = role === 'specialist' && userId !== undefined;
  const mine = tasks.filter((t) => t.assignedBy === userId);
  const visible = canFilter && filter === 'mine' ? mine : tasks;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const share = tasks.length ? doneCount / tasks.length : 0;

  async function markDone(task) {
    setActionError('');
    try {
      await api.patch(`/children/${childId}/tasks/${task.id}/done`);
      reload();
      toast('Harika, görev tamamlandı olarak işaretlendi');
      if (onChanged) onChanged();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <section aria-labelledby="tasks-title" className="card">
      <h2 id="tasks-title">{role === 'child' ? 'Görevlerim' : 'Görevler'}</h2>
      <Loading loading={loading && !data} />
      <ErrorMessage message={error || actionError} />
      {canFilter && tasks.length > 0 && (
        <div className="filter-chips" role="group" aria-label="Görev filtresi">
          <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            Tümü ({tasks.length})
          </button>
          <button type="button" aria-pressed={filter === 'mine'} onClick={() => setFilter('mine')}>
            Verdiklerim ({mine.length})
          </button>
        </div>
      )}
      {tasks.length > 0 && (
        <div className="progress-line">
          <span>
            {doneCount}/{tasks.length} tamamlandı
          </span>
          <span className="meter" aria-hidden="true">
            <motion.span
              key={`${weekStart}-${doneCount}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: share }}
              transition={{ duration: 0.7, ease: EASE }}
            />
          </span>
        </div>
      )}
      {!loading && tasks.length === 0 && <EmptyState icon={TasksIcon}>Bu hafta için görev yok.</EmptyState>}
      <Stagger className="plain tasks" key={weekStart}>
        {visible.map((task) => (
          <Item key={task.id} className={`task ${task.status}`}>
            <div className="task-main">
              <motion.span
                key={task.status}
                className="task-check"
                aria-hidden="true"
                initial={{ scale: task.status === 'done' ? 0.5 : 1 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              >
                {task.status === 'done' && <CheckIcon size={15} strokeWidth={2.6} />}
              </motion.span>
              <div>
                <strong className="task-title">{task.title}</strong>
                {task.description && <p className="small muted">{task.description}</p>}
                <p className="task-meta">
                  <span>
                    {task.assignerName} verdi · Son gün {formatShort(task.dueDate)}
                  </span>
                  <AreaBadge area={task.area} />
                </p>
              </div>
            </div>
            {task.status === 'done' ? (
              <span className="badge done" data-testid={`status-${task.id}`}>
                Tamamlandı
              </span>
            ) : role === 'child' ? (
              <button type="button" className="primary" onClick={() => markDone(task)} aria-label={`Yaptım: ${task.title}`}>
                Yaptım!
              </button>
            ) : (
              <span className="badge todo" data-testid={`status-${task.id}`}>
                Bekliyor
              </span>
            )}
          </Item>
        ))}
      </Stagger>
      {role !== 'child' && (
        <TaskForm
          childId={childId}
          weekStart={weekStart}
          onAdded={() => {
            reload();
            toast('Görev verildi');
            if (onChanged) onChanged();
          }}
        />
      )}
    </section>
  );
}
