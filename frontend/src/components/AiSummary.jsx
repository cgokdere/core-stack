import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api.js';
import { formatDate } from '../lib/dates.js';
import { SOURCE_TYPE_LABELS } from '../lib/labels.js';
import { ErrorMessage } from './ui.jsx';
import { EASE, itemVariants, listVariants } from './motion.jsx';
import { FlagIcon, ShieldIcon, SparkleIcon, ThumbUpIcon } from './icons.jsx';
import { useToast } from './toast.jsx';

// Turns "[2]" into a link to the matching source record below the text.
export function renderWithCitations(text) {
  return text.split(/(\[\d+\])/g).map((part, i) => {
    const match = /^\[(\d+)\]$/.exec(part);
    if (!match) return <React.Fragment key={i}>{part}</React.Fragment>;
    return (
      <a key={i} href={`#source-${match[1]}`} className="citation">
        {part}
      </a>
    );
  });
}

// M8 - AI summary of the week. Always labelled, always shows its sources.
export default function AiSummary({ childId, weekStart }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const toast = useToast();

  useEffect(() => {
    setResult(null);
    setError('');
    setFeedback(null);
  }, [childId, weekStart]);

  async function generate() {
    setBusy(true);
    setError('');
    setFeedback(null);
    try {
      setResult(await api.post(`/children/${childId}/ai-summary`, { week: weekStart }));
    } catch (err) {
      setResult(null);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // M8 - the reader tells us whether the summary helped or contained wrong information.
  async function sendFeedback(rating) {
    setError('');
    try {
      await api.post(`/children/${childId}/ai-summary/feedback`, { week: result.weekStart, rating });
      setFeedback(rating);
      toast('Geri bildiriminiz alındı');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section aria-labelledby="ai-title" className="card">
      <h2 id="ai-title">Haftalık AI özeti</h2>
      <div className="notice">
        <ShieldIcon size={18} />
        <p>
          Özet yalnızca bu haftanın kayıtlarına dayanır. Yapay zekâ karar vermez, teşhis veya tedavi önermez; kararı siz
          verirsiniz.
        </p>
      </div>
      <button type="button" className="primary" onClick={generate} disabled={busy}>
        <SparkleIcon size={17} />
        {busy ? 'Özet hazırlanıyor…' : 'Özet oluştur'}
      </button>
      <ErrorMessage message={error} />
      {busy && (
        <div className="skeleton" style={{ marginTop: '1.25rem' }} role="status">
          <span className="short" />
          <span />
          <span />
        </div>
      )}
      {result && (
        <motion.article
          className="ai-result"
          aria-label="AI özeti"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <div className="ai-meta">
            <span className="badge ai">
              <SparkleIcon size={13} />
              AI-generated
            </span>
            <span className="muted small">Yapay zekâ tarafından üretildi</span>
          </div>
          <motion.div className="ai-text" data-testid="ai-text" variants={listVariants} initial="hidden" animate="show">
            {result.summary.split('\n').map((line, i) => (
              <motion.p key={i} variants={itemVariants}>
                {renderWithCitations(line)}
              </motion.p>
            ))}
          </motion.div>
          {result.sources.length > 0 && (
            <>
              <h3>Dayanak kayıtlar</h3>
              <ol className="plain sources">
                {result.sources.map((s) => (
                  <li key={s.ref} id={`source-${s.ref}`}>
                    <strong>[{s.ref}]</strong> {SOURCE_TYPE_LABELS[s.type]} · {s.title}{' '}
                    <span className="muted small">{formatDate(s.date)}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
          <div className="feedback" role="group" aria-label="Özet hakkında geri bildirim">
            <span>Bu özet işinize yaradı mı?</span>
            <button type="button" onClick={() => sendFeedback('helpful')} disabled={feedback !== null}>
              <ThumbUpIcon size={16} />
              Faydalı
            </button>
            <button type="button" onClick={() => sendFeedback('incorrect')} disabled={feedback !== null}>
              <FlagIcon size={16} />
              Hatalı bilgi bildir
            </button>
            {feedback && (
              <span className="feedback-thanks" role="status">
                Geri bildiriminiz için teşekkürler.
              </span>
            )}
          </div>
        </motion.article>
      )}
    </section>
  );
}
