import React from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { homePath, useAuth } from '../auth.jsx';
import { ROLE_LABELS, SPECIALTY_LABELS, avatarTone, initials } from '../lib/labels.js';
import { EASE } from './motion.jsx';
import { LogoMark, LogoutIcon } from './icons.jsx';

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) return <p className="muted center">Yükleniyor…</p>;
  if (!user) return <Navigate to="/login" replace />;

  const roleText =
    user.role === 'specialist' && user.specialty ? SPECIALTY_LABELS[user.specialty] : ROLE_LABELS[user.role];

  return (
    <>
      <a className="skip-link" href="#main">
        İçeriğe geç
      </a>
      <header className="topbar">
        <Link to={homePath(user)} className="brand">
          <LogoMark size={30} />
          Gelişim Ağı
        </Link>
        <div className="who">
          <span className="who-chip" data-testid="current-user">
            <span className={`avatar ${avatarTone(user.name)}`} aria-hidden="true">
              {initials(user.name)}
            </span>
            <span className="who-name">
              {user.name} <span className="muted">· {roleText}</span>
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogoutIcon size={17} />
            Çıkış
          </button>
        </div>
      </header>
      <main className="page" id="main" tabIndex={-1}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <Outlet />
        </motion.div>
      </main>
    </>
  );
}
