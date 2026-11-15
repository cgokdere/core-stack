const request = require('supertest');
const { makeApp, login, auth, WEEK } = require('./helpers');
const { weeklyStats } = require('../src/services/stats');

describe('M7 - weekly statistics', () => {
  it('returns the completion rate in total and by area for the selected week', async () => {
    const { app, ids } = makeApp();
    const res = await request(app)
      .get(`/api/children/${ids.deniz}/stats?week=${WEEK.start}`)
      .set(auth(await login(app, 'selin.yildiz@example.com')));
    expect(res.status).toBe(200);
    const { stats } = res.body;
    expect(stats).toMatchObject({ weekStart: WEEK.start, weekEnd: WEEK.end, total: 6, done: 3, rate: 50 });
    expect(stats.byArea).toEqual([
      { area: 'academic', total: 3, done: 2, rate: 67 },
      { area: 'social', total: 1, done: 0, rate: 0 },
      { area: 'health', total: 1, done: 0, rate: 0 },
      { area: 'sport', total: 1, done: 1, rate: 100 },
    ]);
  });

  it('updates when the child completes a task', async () => {
    const { app, ids } = makeApp();
    const child = await login(app, 'deniz.yildiz@example.com');
    const parent = await login(app, 'selin.yildiz@example.com');
    const tasks = (await request(app).get(`/api/children/${ids.deniz}/tasks`).set(auth(child))).body.tasks;
    const open = tasks.find((t) => t.title === '5 dakika nefes egzersizi');
    await request(app).patch(`/api/children/${ids.deniz}/tasks/${open.id}/done`).set(auth(child));
    const res = await request(app).get(`/api/children/${ids.deniz}/stats?week=${WEEK.start}`).set(auth(parent));
    expect(res.body.stats.done).toBe(4);
    expect(res.body.stats.byArea.find((a) => a.area === 'health')).toMatchObject({ done: 1, rate: 100 });
  });

  it('reports zero for a week without tasks', async () => {
    const { app, ids } = makeApp();
    const res = await request(app)
      .get(`/api/children/${ids.deniz}/stats?week=2026-12-01`)
      .set(auth(await login(app, 'selin.yildiz@example.com')));
    expect(res.body.stats).toMatchObject({ total: 0, done: 0, rate: 0 });
    expect(res.body.stats.byArea).toHaveLength(4);
  });

  it('is available to linked specialists but not to the child or outsiders', async () => {
    const { app, ids } = makeApp();
    const url = `/api/children/${ids.deniz}/stats`;
    expect((await request(app).get(url).set(auth(await login(app, 'zeynep.aydin@example.com')))).status).toBe(200);
    for (const email of ['deniz.yildiz@example.com', 'can.demir@example.com', 'aylin.korkmaz@example.com']) {
      expect((await request(app).get(url).set(auth(await login(app, email)))).status).toBe(403);
    }
  });

  it('rejects a malformed week', async () => {
    const { app, ids } = makeApp();
    const res = await request(app)
      .get(`/api/children/${ids.deniz}/stats?week=31-12-2026`)
      .set(auth(await login(app, 'selin.yildiz@example.com')));
    expect(res.status).toBe(400);
  });

  it('computes the rate directly from the database', () => {
    const { db, ids } = makeApp();
    const stats = weeklyStats(db, ids.ece, WEEK);
    expect(stats).toMatchObject({ total: 1, done: 0, rate: 0 });
  });
});
