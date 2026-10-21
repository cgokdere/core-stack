import React, { useEffect, useState } from 'react';

// Walking skeleton: the page calls the backend through the Vite proxy and shows whether it answers.
// The real screens (login, schedule, tasks, ...) replace this as the modules are built.
export default function App() {
  const [backend, setBackend] = useState('checking');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        if (!cancelled) setBackend(data.status === 'ok' ? 'up' : 'down');
      })
      .catch(() => {
        if (!cancelled) setBackend('down');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const text = {
    checking: 'Backend kontrol ediliyor…',
    up: 'Backend çalışıyor',
    down: 'Backend’e ulaşılamıyor',
  }[backend];

  return (
    <main>
      <h1>Gelişim Ağı</h1>
      <p role="status">{text}</p>
    </main>
  );
}
