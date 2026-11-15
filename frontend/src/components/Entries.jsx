import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { useLoad } from '../lib/useLoad.js';
import { formatDate, todayIso } from '../lib/dates.js';
import { AREAS, AREA_LABELS, SPECIALTY_LABELS } from '../lib/labels.js';
import { AreaBadge, EmptyState, ErrorMessage, Loading } from './ui.jsx';
import { Item, Stagger } from './motion.jsx';
import { NotebookIcon, PencilIcon, PlusIcon } from './icons.jsx';
import { useToast } from './toast.jsx';

function EntryForm({ childId, entry, onSaved, onCancel }) {
  const [entryDate, setEntryDate] = useState(entry ? entry.entryDate : todayIso());
  const [title, setTitle] = useState(entry ? entry.title : '');
  const [body, setBody] = useState(entry ? entry.body : '');
  const [area, setArea] = useState(entry ? entry.area : 'academic');
  const [error, setError] = useState('');
  const toast = useToast();

  async function submit(e) {
    e.preventDefault();
    setError('');
    const payload = { entryDate, title, body, area };
    try {
      if (entry) await api.put(`/children/${childId}/entries/${entry.id}`, payload);
      else await api.post(`/children/${childId}/entries`, payload);
      if (!entry) {
        setTitle('');
        setBody('');
      }
      toast(entry ? 'Girdi güncellendi' : 'Girdi kaydedildi');
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  const heading = entry ? 'Girdiyi düzenle' : 'Yeni girdi ekle';
  return (
    <form onSubmit={submit} className="form" aria-label={heading}>
      <h3>{heading}</h3>
      <div className="row">
        <label>
          Tarih
          <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
        </label>
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
      </div>
      <label>
        Başlık
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
      </label>
      <label>
        Gözlem ve görüş
        <textarea value={body} onChange={(e) => setBody(e.target.value)} required maxLength={2000} rows={4} />
      </label>
      <ErrorMessage message={error} />
      <div className="row">
        <button type="submit" className="primary">
          {!entry && <PlusIcon size={17} />}
          {entry ? 'Değişiklikleri kaydet' : 'Girdiyi kaydet'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Vazgeç
          </button>
        )}
      </div>
    </form>
  );
}

// M5 - dated observations by linked specialists. The parent reads them; the child never sees this tab.
export default function Entries({ childId, user }) {
  const { data, error, loading, reload } = useLoad(() => api.get(`/children/${childId}/entries`), [childId]);
  const [editingId, setEditingId] = useState(null);
  const entries = data ? data.entries : [];
  const isSpecialist = user.role === 'specialist';

  return (
    <section aria-labelledby="entries-title" className="card">
      <h2 id="entries-title">Uzman girdileri</h2>
      <Loading loading={loading && !data} />
      <ErrorMessage message={error} />
      {!loading && entries.length === 0 && <EmptyState icon={NotebookIcon}>Henüz girdi yok.</EmptyState>}
      <Stagger className="plain entries">
        {entries.map((entry) =>
          editingId === entry.id ? (
            <li key={entry.id}>
              <EntryForm
                childId={childId}
                entry={entry}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  reload();
                }}
              />
            </li>
          ) : (
            <Item key={entry.id} className="entry">
              <div className="entry-head">
                <strong>{entry.title}</strong>
                <AreaBadge area={entry.area} />
                {entry.edited && <span className="badge edited">Düzenlendi</span>}
              </div>
              <p className="muted small">
                {formatDate(entry.entryDate)} · {entry.authorName}
                {entry.authorSpecialty ? ` (${SPECIALTY_LABELS[entry.authorSpecialty]})` : ''}
              </p>
              <p>{entry.body}</p>
              {isSpecialist && entry.authorId === user.id && (
                <button type="button" onClick={() => setEditingId(entry.id)} aria-label={`Düzenle: ${entry.title}`}>
                  <PencilIcon size={15} />
                  Düzenle
                </button>
              )}
            </Item>
          )
        )}
      </Stagger>
      {isSpecialist && editingId === null && <EntryForm childId={childId} onSaved={reload} />}
    </section>
  );
}
