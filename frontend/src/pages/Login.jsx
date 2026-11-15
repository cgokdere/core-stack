import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { homePath, useAuth } from '../auth.jsx';
import { ErrorMessage } from '../components/ui.jsx';
import { EASE, Item, itemVariants } from '../components/motion.jsx';
import { ArrowRightIcon, CalendarIcon, LogoMark, NotebookIcon, SparkleIcon } from '../components/icons.jsx';

const DEMO_ACCOUNTS = [
  { label: 'Aile', email: 'selin.yildiz@example.com' },
  { label: 'Çocuk', email: 'deniz.yildiz@example.com' },
  { label: 'Öğretmen', email: 'murat.kaya@example.com' },
  { label: 'Psikolog', email: 'elif.arslan@example.com' },
];

// What the product offers, in the words of the course brief.
const FEATURES = [
  { icon: CalendarIcon, text: 'Ortak program ve görevler' },
  { icon: NotebookIcon, text: 'Tarihli uzman girdileri' },
  { icon: SparkleIcon, text: 'Rolünüze göre AI özetleri, kaynak kayıtlarıyla' },
];

const featureVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 1.1 } },
};

const formVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } },
};

// Each word slides up out of its own mask.
function SplitWords({ text, delay = 0 }) {
  const words = text.split(' ');
  return words.map((word, i) => (
    <React.Fragment key={i}>
      <span className="word">
        <motion.span
          className="word-inner"
          initial={{ y: '118%', rotate: 3 }}
          animate={{ y: 0, rotate: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: delay + i * 0.07 }}
        >
          {word}
        </motion.span>
      </span>
      {i < words.length - 1 ? ' ' : null}
    </React.Fragment>
  ));
}

// Slowly drifting colour fields behind the hero.
function Aurora() {
  const drift = (x, y, duration) => ({
    animate: { x, y, scale: [1, 1.12, 1] },
    transition: { duration, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
  });
  return (
    <div className="aurora" aria-hidden="true">
      <motion.div className="blob lime" {...drift([0, 90, 20], [0, 50, -30], 19)} />
      <motion.div className="blob emerald" {...drift([0, -80, 10], [0, -60, 20], 23)} />
      <motion.div className="blob peach" {...drift([0, 60, -40], [0, -40, 40], 27)} />
      <div className="aurora-grid" />
    </div>
  );
}

// M1 - e-mail and password login. The role comes from the account, never from the user.
export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homePath(user)} replace />;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const loggedIn = await login(email, password);
      navigate(homePath(loggedIn), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <aside className="login-hero">
        <Aurora />
        <motion.div
          className="hero-brand"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <LogoMark size={36} />
          Gelişim Ağı
        </motion.div>
        <h1>
          <SplitWords text="Çocuğunuzun gelişimi," delay={0.15} />{' '}
          <span className="mark">
            <SplitWords text="tek bir ortak alanda." delay={0.4} />
          </span>
        </h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.85 }}>
          Aile, okul ve uzmanlar aynı programı, görevleri ve gözlemleri paylaşır. Yapay zekâ kayıtları rolünüze göre
          özetler; kararı her zaman siz verirsiniz.
        </motion.p>
        <motion.ul className="hero-features plain" variants={featureVariants} initial="hidden" animate="show">
          {FEATURES.map(({ icon: Icon, text }) => (
            <Item key={text} className="hero-feature">
              <span className="hero-feature-icon">
                <Icon size={17} />
              </span>
              {text}
            </Item>
          ))}
        </motion.ul>
        <motion.p
          className="small hero-note"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.6 }}
        >
          Demo ortamı: tüm veriler sentetiktir, gerçek kişilere ait değildir.
        </motion.p>
      </aside>

      <motion.form onSubmit={submit} className="login-form" aria-label="Giriş" variants={formVariants} initial="hidden" animate="show">
        <motion.div variants={itemVariants}>
          <h2>Giriş yap</h2>
          <p className="muted" style={{ marginTop: '0.4rem' }}>
            Rolünüz hesabınıza göre belirlenir; yalnızca yetkili olduğunuz bilgileri görürsünüz.
          </p>
        </motion.div>
        <Item as="label">
          E-posta
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </Item>
        <Item as="label">
          Şifre
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Item>
        <ErrorMessage message={error} />
        <motion.div variants={itemVariants} style={{ display: 'grid' }}>
          <button type="submit" className="primary" disabled={busy}>
            {busy ? <span className="spinner" aria-hidden="true" /> : null}
            Giriş yap
            {!busy && <ArrowRightIcon size={18} />}
          </button>
        </motion.div>
        <Item as="div" className="demo" role="group" aria-labelledby="demo-title">
          <h3 id="demo-title" className="demo-title">
            Demo hesapları
          </h3>
          <p className="muted small">Bir hesap seçin; e-posta alanı dolar. Demo şifresi: Password123!</p>
          <div className="row wrap">
            {DEMO_ACCOUNTS.map((a) => (
              <motion.button
                type="button"
                key={a.email}
                onClick={() => setEmail(a.email)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {a.label}
              </motion.button>
            ))}
          </div>
        </Item>
      </motion.form>
    </div>
  );
}
