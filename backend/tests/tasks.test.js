const request = require('supertest');
const { makeApp, login, auth, WEEK } = require('./helpers');

const newTask = { title: 'Şiir ezberle', description: 'Dört dize', area: 'academic', dueDate: '2026-10-16' };

describe('M4 - tasks', () => {
  it('lets the parent and a linked specialist assign tasks', async () => {
    const { app, ids } = makeApp();
    for (const email of ['selin.yildiz@example.com', 'elif.arslan@example.com']) {
      const res = await request(app)
        .post(`/api/children/${ids.deniz}/tasks`)
        .set(auth(await login(app, email)))
        .send(newTask);
      expect(res.status).toBe(201);
      expect(res.body.task).toMatchObject({ title: 'Şiir ezberle', status: 'todo', dueDate: '2026-10-16' });
    }
  });

  it('shows the assigner and the status to everyone allowed to see tasks', async () => {
    const { app, ids } = makeApp();
    const res = await request(app)
      .get(`/api/children/${ids.deniz}/tasks`)
      .set(auth(await login(app, 'murat.kaya@example.com')));
    expect(res.status).toBe(200);
    const reading = res.body.tasks.find((t) => t.title === '15 dakika sesli okuma');
    expect(reading).toMatchObject({ assignerName: 'Murat Kaya', status: 'done' });
    expect(res.body.tasks.some((t) => t.status === 'todo')).toBe(true);
  });

  it('filters tasks by week', async () => {
    const { app, ids } = makeApp();
    const token = await login(app, 'selin.yildiz@example.com');
    const thisWeek = await request(app).get(`/api/children/${ids.deniz}/tasks?week=${WEEK.start}`).set(auth(token));
    expect(thisWeek.body.tasks).toHaveLength(6);
    const other = await request(app).get(`/api/children/${ids.deniz}/tasks?week=2026-11-02`).set(auth(token));
    expect(other.body.tasks).toEqual([]);
    expect((await request(app).get(`/api/children/${ids.deniz}/tasks?week=x`).set(auth(token))).status).toBe(400);
  });

  it('lets the child mark a task done and the assigner see it', async () => {
    const { app, ids } = makeApp();
    const child = await login(app, 'deniz.yildiz@example.com');
    const parent = await login(app, 'selin.yildiz@example.com');
    const base = `/api/children/${ids.deniz}/tasks`;

    const open = (await request(app).get(base).set(auth(child))).body.tasks.find((t) => t.status === 'todo');
    const res = await request(app).patch(`${base}/${open.id}/done`).set(auth(child));
    expect(res.status).toBe(200);
    expect(res.body.task).toMatchObject({ id: open.id, status: 'done' });
    expect(res.body.task.doneAt).toEqual(expect.any(String));

    const seen = (await request(app).get(base).set(auth(parent))).body.tasks.find((t) => t.id === open.id);
    expect(seen.status).toBe('done');

    // marking again keeps the first completion time
    const again = await request(app).patch(`${base}/${open.id}/done`).set(auth(child));
    expect(again.body.task.doneAt).toBe(res.body.task.doneAt);
  });

  it('does not let anyone but the child mark a task done', async () => {
    const { app, ids } = makeApp();
    const base = `/api/children/${ids.deniz}/tasks`;
    const parent = await login(app, 'selin.yildiz@example.com');
    const taskId = (await request(app).get(base).set(auth(parent))).body.tasks[0].id;
    for (const email of ['selin.yildiz@example.com', 'murat.kaya@example.com', 'ece.korkmaz@example.com']) {
      const res = await request(app).patch(`${base}/${taskId}/done`).set(auth(await login(app, email)));
      expect(res.status).toBe(403);
    }
  });

  it('returns 404 for a task that belongs to another child', async () => {
    const { app, ids, db } = makeApp();
    const eceTask = db.prepare('SELECT id FROM tasks WHERE child_id = ?').get(ids.ece).id;
    const res = await request(app)
      .patch(`/api/children/${ids.deniz}/tasks/${eceTask}/done`)
      .set(auth(await login(app, 'deniz.yildiz@example.com')));
    expect(res.status).toBe(404);
  });

  it('does not let the child, an unlinked specialist or another parent assign tasks', async () => {
    const { app, ids } = makeApp();
    for (const email of ['deniz.yildiz@example.com', 'can.demir@example.com', 'aylin.korkmaz@example.com']) {
      const res = await request(app)
        .post(`/api/children/${ids.deniz}/tasks`)
        .set(auth(await login(app, email)))
        .send(newTask);
      expect(res.status).toBe(403);
    }
  });

  it('keeps one child from reading the tasks of another', async () => {
    const { app, ids } = makeApp();
    const res = await request(app)
      .get(`/api/children/${ids.ece}/tasks`)
      .set(auth(await login(app, 'deniz.yildiz@example.com')));
    expect(res.status).toBe(403);
  });

  it('validates task input', async () => {
    const { app, ids } = makeApp();
    const token = await login(app, 'selin.yildiz@example.com');
    const post = (body) => request(app).post(`/api/children/${ids.deniz}/tasks`).set(auth(token)).send(body);
    expect((await post({ ...newTask, title: '' })).status).toBe(400);
    expect((await post({ ...newTask, description: 'x'.repeat(501) })).status).toBe(400);
    expect((await post({ ...newTask, area: 'music' })).status).toBe(400);
    expect((await post({ ...newTask, dueDate: '2026-02-30' })).status).toBe(400);
    expect((await post({ ...newTask, description: undefined })).status).toBe(201);
  });
});
