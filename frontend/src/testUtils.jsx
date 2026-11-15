import { vi } from 'vitest';

// Replaces fetch with a table of canned API answers.
//   routes: { 'GET /children/1/tasks': {tasks: []}, 'POST /auth/login': (init) => ({ status: 401, body: {...} }) }
// A key may include the query string; if there is no exact match the path without it is tried.
export function mockFetch(routes) {
  const fn = vi.fn(async (url, init = {}) => {
    const method = init.method || 'GET';
    const path = String(url).replace(/^\/api/, '');
    const handler = routes[`${method} ${path}`] ?? routes[`${method} ${path.split('?')[0]}`];
    if (handler === undefined) {
      return new Response(JSON.stringify({ error: `no mock for ${method} ${path}` }), { status: 500 });
    }
    const result = typeof handler === 'function' ? handler(init) : handler;
    const isResponse = result && typeof result === 'object' && 'status' in result && 'body' in result;
    const status = isResponse ? result.status : 200;
    const body = isResponse ? result.body : result;
    if (status === 204) return new Response(null, { status });
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

export const WEEK_START = '2026-10-12';

export const parentUser = { id: 1, name: 'Selin Yıldız', email: 'selin.yildiz@example.com', role: 'parent', specialty: null };
export const childUser = { id: 3, name: 'Deniz Yıldız', email: 'deniz.yildiz@example.com', role: 'child', specialty: null };
export const specialistUser = {
  id: 6,
  name: 'Elif Arslan',
  email: 'elif.arslan@example.com',
  role: 'specialist',
  specialty: 'psychologist',
};

export const sampleTasks = [
  {
    id: 1,
    title: '15 dakika sesli okuma',
    description: 'Her akşam oku.',
    area: 'academic',
    dueDate: '2026-10-12',
    status: 'done',
    doneAt: '2026-10-12T19:00:00.000Z',
    assignedBy: 5,
    assignerName: 'Murat Kaya',
  },
  {
    id: 2,
    title: '5 dakika nefes egzersizi',
    description: '',
    area: 'health',
    dueDate: '2026-10-14',
    status: 'todo',
    doneAt: null,
    assignedBy: 6,
    assignerName: 'Elif Arslan',
  },
];
