import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api.js';
import { useLoad } from '../lib/useLoad.js';
import { formatDate } from '../lib/dates.js';
import { SPECIALTIES, SPECIALTY_LABELS, avatarTone, initials } from '../lib/labels.js';
import { EmptyState, ErrorMessage, Loading } from './ui.jsx';
import { EASE, Item, Stagger } from './motion.jsx';
import { PlusIcon, UsersIcon } from './icons.jsx';
import { useToast } from './toast.jsx';

// M2 - the parent links and unlinks specialists. Unlinking asks for confirmation.
export default function Links({ childId, childName }) {
  const { data, error, loading, reload } = useLoad(() => api.get(`/children/${childId}/links`), [childId]);
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('doctor');
  const [formError, setFormError] = useState('');
  const [confirming, setConfirming] = useState(null);
  const toast = useToast();
  const links = data ? data.links : [];

  async function link(e) {
    e.preventDefault();
    setFormError('');
    try {
      await api.post(`/children/${childId}/links`, { email, specialty });
      setEmail('');
      reload();
      toast('Uzman bağlandı');
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function unlink(specialistId) {
    setFormError('');
    try {
      await api.delete(`/children/${childId}/links/${specialistId}`);
      setConfirming(null);
      reload();
      toast('Bağlantı kaldırıldı');
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <section aria-labelledby="links-title" className="card">
      <h2 id="links-title">Bağlı uzmanlar</h2>
      <p className="muted small" style={{ marginBottom: '1rem', maxWidth: '62ch' }}>
        Bağladığınız uzmanlar {childName} için program, görev, girdi ve belgeleri görebilir ve bunlara kayıt ekleyebilir.
        Bağlı olmayan hiç kimse bilgilere erişemez.
      </p>
      <Loading loading={loading && !data} rows={2} />
      <ErrorMessage message={error} />
      {!loading && links.length === 0 && <EmptyState icon={UsersIcon}>Henüz bağlı uzman yok.</EmptyState>}
      <Stagger className="plain links">
        {links.map((l) => (
          <Item key={l.specialistId} className="link-row">
            <div className="link-who">
              <span className={`avatar ${avatarTone(l.name)}`} aria-hidden="true">
                {initials(l.name)}
              </span>
              <div>
                <strong>{l.name}</strong> <span className="badge plain">{SPECIALTY_LABELS[l.specialty]}</span>
                <p className="muted small">
                  {l.email} · {formatDate(l.linkedAt.slice(0, 10))}’den beri
                </p>
              </div>
            </div>
            {confirming === l.specialistId ? (
                <motion.div
                  key="confirm"
                  className="confirm"
                  role="alertdialog"
                  aria-label={`${l.name} bağlantısını kaldır`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.18, ease: EASE }}
                >
                  <p>{l.name} bağlantısı kaldırılsın mı? Artık kayıtları göremez ve yeni kayıt ekleyemez.</p>
                  <div className="row">
                    <button type="button" className="danger" onClick={() => unlink(l.specialistId)}>
                      Evet, kaldır
                    </button>
                    <button type="button" onClick={() => setConfirming(null)}>
                      Vazgeç
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button type="button" onClick={() => setConfirming(l.specialistId)} aria-label={`Kaldır: ${l.name}`}>
                    Kaldır
                  </button>
              )}
          </Item>
        ))}
      </Stagger>

      <form onSubmit={link} className="form" aria-label="Uzman bağla">
        <h3>Uzman bağla</h3>
        <label>
          Uzmanın e-postası
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Uzman türü
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {SPECIALTY_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <ErrorMessage message={formError} />
        <button type="submit" className="primary">
          <PlusIcon size={17} />
          Bağla
        </button>
      </form>
    </section>
  );
}
