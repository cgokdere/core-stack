import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useLoad } from '../lib/useLoad.js';
import { avatarTone, initials } from '../lib/labels.js';
import { useAuth } from '../auth.jsx';
import { EmptyState, ErrorMessage, Loading } from '../components/ui.jsx';
import { Item, Stagger } from '../components/motion.jsx';
import { ArrowRightIcon, UsersIcon } from '../components/icons.jsx';

// M2 - a specialist sees only the children they are linked to; a parent sees their own.
export default function ChildrenList() {
  const { user } = useAuth();
  const { data, error, loading } = useLoad(() => api.get('/children'), []);
  const children = data ? data.children : [];

  if (user.role === 'parent' && children.length === 1) {
    return <Navigate to={`/children/${children[0].id}`} replace />;
  }

  return (
    <section aria-labelledby="children-title">
      <div className="hero">
        <div className="hero-greeting">
          <h1 id="children-title">{user.role === 'parent' ? 'Çocuklarım' : 'Çocuklarım (bağlı olduklarınız)'}</h1>
          <p className="muted">Bir çocuk seçin: program, görevler, girdiler ve belgeler orada.</p>
        </div>
      </div>
      <Loading loading={loading && !data} rows={2} />
      <ErrorMessage message={error} />
      {!loading && !error && children.length === 0 && (
        <EmptyState icon={UsersIcon}>
          {user.role === 'parent'
            ? 'Hesabınıza bağlı çocuk yok.'
            : 'Henüz size bağlanmış bir çocuk yok. Aile sizi e-posta adresinizle bağladığında burada görünür.'}
        </EmptyState>
      )}
      <Stagger className="plain cards">
        {children.map((child) => (
          <Item key={child.id} className="card">
            <span className={`avatar lg ${avatarTone(child.name)}`} aria-hidden="true">
              {initials(child.name)}
            </span>
            <h2 style={{ marginTop: '0.6rem' }}>{child.name}</h2>
            <p className="muted">{child.grade}</p>
            <Link to={`/children/${child.id}`} className="button primary">
              Aç: {child.name}
              <ArrowRightIcon size={17} />
            </Link>
          </Item>
        ))}
      </Stagger>
    </section>
  );
}
