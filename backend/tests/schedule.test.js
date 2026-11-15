const request = require('supertest');
const { makeApp, login, auth, WEEK } = require('./helpers');

describe('M3 - weekly schedule', () => {
  it('lists the events of a week in time order for parent, specialist and child', async () => {
    const { app, ids } = makeApp();
    const url = `/api/children/${ids.deniz}/events?week=${WEEK.start}`;
    for (const email of ['selin.yildiz@example.com', 'murat.kaya@example.com', 'deniz.yildiz@example.com']) {
      const res = await request(app).get(url).set(auth(await login(app, email)));
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ weekStart: WEEK.start, weekEnd: WEEK.end });
      expect(res.body.events).toHaveLength(5);
      const starts = res.body.events.map((e) => e.startsAt);
      expect(starts).toEqual([...starts].sort());
    }
  });

  it('accepts any date inside the week and returns nothing for other weeks', async () => {
    const { app, ids } = makeApp();
    const token = await login(app, 'selin.yildiz@example.com');
    const sunday = await request(app).get(`/api/children/${ids.deniz}/events?week=${WEEK.end}`).set(auth(token));
    expect(sunday.body.events).toHaveLength(5);
    const nextWeek = await request(app).get(`/api/children/${ids.deniz}/events?week=2026-10-19`).set(auth(token));
    expect(nextWeek.body.events).toEqual([]);
  });

  it('defaults to the current week and rejects a bad week', async () => {
    const { app, ids } = makeApp();
    const token = await login(app, 'selin.yildiz@example.com');
    const current = await request(app).get(`/api/children/${ids.deniz}/events`).set(auth(token));
    expect(current.status).toBe(200);
    expect(current.body.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const bad = await request(app).get(`/api/children/${ids.deniz}/events?week=tomorrow`).set(auth(token));
    expect(bad.status).toBe(400);
  });

  it('lets the parent and a linked specialist add events', async () => {
    const { app, ids } = makeApp();
    const body = { title: 'Kitap kulübü', startsAt: '2026-10-16T14:00', endsAt: '2026-10-16T15:00', area: 'social' };
    for (const email of ['selin.yildiz@example.com', 'zeynep.aydin@example.com']) {
      const res = await request(app)
        .post(`/api/children/${ids.deniz}/events`)
        .set(auth(await login(app, email)))
        .send(body);
      expect(res.status).toBe(201);
      expect(res.body.event).toMatchObject({ title: 'Kitap kulübü', area: 'social' });
    }
    const list = await request(app)
      .get(`/api/children/${ids.deniz}/events?week=${WEEK.start}`)
      .set(auth(await login(app, 'selin.yildiz@example.com')));
    expect(list.body.events.filter((e) => e.title === 'Kitap kulübü')).toHaveLength(2);
  });

  it('does not let the child, an unlinked specialist or another parent add events', async () => {
    const { app, ids } = makeApp();
    const body = { title: 'X', startsAt: '2026-10-16T14:00', area: 'sport' };
    for (const email of ['deniz.yildiz@example.com', 'can.demir@example.com', 'aylin.korkmaz@example.com']) {
      const res = await request(app)
        .post(`/api/children/${ids.deniz}/events`)
        .set(auth(await login(app, email)))
        .send(body);
      expect(res.status).toBe(403);
    }
  });

  it('validates event input', async () => {
    const { app, ids } = makeApp();
    const token = await login(app, 'selin.yildiz@example.com');
    const post = (body) => request(app).post(`/api/children/${ids.deniz}/events`).set(auth(token)).send(body);
    const valid = { title: 'Ok', startsAt: '2026-10-16T14:00', area: 'sport' };
    expect((await post({ ...valid, title: '  ' })).status).toBe(400);
    expect((await post({ ...valid, title: 'x'.repeat(121) })).status).toBe(400);
    expect((await post({ ...valid, startsAt: '2026-13-40T14:00' })).status).toBe(400);
    expect((await post({ ...valid, startsAt: 'yarın' })).status).toBe(400);
    expect((await post({ ...valid, endsAt: '2026-10-16T13:00' })).status).toBe(400);
    expect((await post({ ...valid, endsAt: 'later' })).status).toBe(400);
    expect((await post({ ...valid, area: 'music' })).status).toBe(400);
    expect((await post({ ...valid, endsAt: null })).status).toBe(201);
  });
});
