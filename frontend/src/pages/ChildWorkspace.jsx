import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useLoad } from '../lib/useLoad.js';
import { avatarTone, initials } from '../lib/labels.js';
import { ErrorMessage, Loading } from '../components/ui.jsx';
import { ChevronLeftIcon } from '../components/icons.jsx';
import Links from '../components/Links.jsx';

export default function ChildWorkspace() {
  const { childId } = useParams();
  const { data, error, loading } = useLoad(() => api.get(`/children/${childId}`), [childId]);

  if (loading) return <Loading loading rows={4} />;
  if (error) {
    return (
      <>
        <ErrorMessage message={error} />
        <Link to="/children">Çocuk listesine dön</Link>
      </>
    );
  }

  const { child, role } = data;
  return (
    <section>
      <p className="breadcrumb">
        <ChevronLeftIcon size={15} />
        <Link to="/children">Çocuklarım</Link> / {child.name}
      </p>
      <div className="hero">
        <span className={`avatar lg ${avatarTone(child.name)}`} aria-hidden="true">
          {initials(child.name)}
        </span>
        <div className="hero-greeting">
          <h1>{child.name}</h1>
          <p className="muted">{child.grade}</p>
        </div>
      </div>
      {role === 'parent' && (
        <div role="tablist" aria-label="Bölümler" className="tabs">
          <button role="tab" type="button" aria-selected="true" className="tab">
            Bağlı uzmanlar
          </button>
        </div>
      )}
      {role === 'parent' && <Links childId={child.id} childName={child.name} />}
    </section>
  );
}
