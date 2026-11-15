import React from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api.js';
import { useLoad } from '../lib/useLoad.js';
import { AREA_LABELS } from '../lib/labels.js';
import { ErrorMessage, Loading } from './ui.jsx';
import { EASE, ProgressRing } from './motion.jsx';

// M7 - task completion rate of the selected week, in total and by area.
export default function Stats({ childId, weekStart }) {
  const { data, error, loading } = useLoad(
    () => api.get(`/children/${childId}/stats?week=${weekStart}`),
    [childId, weekStart]
  );
  const stats = data ? data.stats : null;

  return (
    <section aria-labelledby="stats-title" className="card">
      <h2 id="stats-title">Haftalık istatistik</h2>
      <Loading loading={loading && !data} rows={2} />
      <ErrorMessage message={error} />
      {stats && (
        <div className="stats-layout" key={`${weekStart}-${stats.done}-${stats.total}`}>
          <div>
            <ProgressRing value={stats.rate}>
              <p className="big" data-testid="total-rate">
                %{stats.rate}
              </p>
            </ProgressRing>
            <p className="stat-caption" data-testid="total-count" style={{ textAlign: 'center' }}>
              {stats.done} / {stats.total} görev tamamlandı
            </p>
          </div>
          <div>
            <h3 style={{ marginBottom: '0.9rem' }}>Alanlara göre tamamlanma</h3>
            <ul className="plain bars">
              {stats.byArea.map((a, i) => (
                <li key={a.area} data-testid={`area-${a.area}`}>
                  <span className={`bar-label area-${a.area}`}>{AREA_LABELS[a.area]}</span>
                  <div
                    className="bar-track"
                    role="progressbar"
                    aria-label={`${AREA_LABELS[a.area]} tamamlanma oranı`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={a.rate}
                  >
                    <motion.div
                      className={`bar-fill area-${a.area}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: a.rate / 100 }}
                      transition={{ duration: 0.8, ease: EASE, delay: 0.15 + i * 0.07 }}
                    />
                  </div>
                  <span>
                    {a.done}/{a.total}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
