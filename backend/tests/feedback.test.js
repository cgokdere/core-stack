const request = require('supertest');
const { makeApp, login, auth, WEEK } = require('./helpers');

const url = (childId) => `/api/children/${childId}/ai-summary/feedback`;

describe('M8 - feedback on the AI summary', () => {
  it('stores "helpful" feedback from the parent for the selected week', async () => {
    const { app, db, ids } = makeApp();
    const res = await request(app)
      .post(url(ids.deniz))
      .set(auth(await login(app, 'selin.yildiz@example.com')))
      .send({ week: '2026-10-15', rating: 'helpful' });
    expect(res.status).toBe(201);
    expect(res.body.feedback).toMatchObject({ rating: 'helpful', weekStart: WEEK.start, role: 'parent' });
    const row = db.prepare('SELECT * FROM ai_feedback WHERE id = ?').get(res.body.feedback.id);
    expect(row).toMatchObject({ child_id: ids.deniz, role: 'parent', rating: 'helpful', week_start: WEEK.start });
  });

  it('stores "incorrect" feedback from a linked specialist', async () => {
    const { app, ids } = makeApp();
    const res = await request(app)
      .post(url(ids.deniz))
      .set(auth(await login(app, 'elif.arslan@example.com')))
      .send({ week: WEEK.start, rating: 'incorrect' });
    expect(res.status).toBe(201);
    expect(res.body.feedback).toMatchObject({ rating: 'incorrect', role: 'specialist' });
  });

  it('uses the current week when none is given', async () => {
    const { app, ids } = makeApp();
    const res = await request(app)
      .post(url(ids.deniz))
      .set(auth(await login(app, 'selin.yildiz@example.com')))
      .send({ rating: 'helpful' });
    expect(res.status).toBe(201);
    expect(res.body.feedback.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('rejects an unknown rating and a malformed week', async () => {
    const { app, ids } = makeApp();
    const token = await login(app, 'selin.yildiz@example.com');
    const bad = await request(app).post(url(ids.deniz)).set(auth(token)).send({ week: WEEK.start, rating: 'great' });
    expect(bad.status).toBe(400);
    const missing = await request(app).post(url(ids.deniz)).set(auth(token)).send({ week: WEEK.start });
    expect(missing.status).toBe(400);
    const week = await request(app).post(url(ids.deniz)).set(auth(token)).send({ week: 'last week', rating: 'helpful' });
    expect(week.status).toBe(400);
  });

  it('is closed to the child, unlinked specialists and other families', async () => {
    const { app, ids, db } = makeApp();
    for (const email of ['deniz.yildiz@example.com', 'can.demir@example.com', 'aylin.korkmaz@example.com']) {
      const res = await request(app)
        .post(url(ids.deniz))
        .set(auth(await login(app, email)))
        .send({ week: WEEK.start, rating: 'helpful' });
      expect(res.status).toBe(403);
    }
    expect(db.prepare('SELECT COUNT(*) AS n FROM ai_feedback').get().n).toBe(0);
  });

  it('requires a login', async () => {
    const { app, ids } = makeApp();
    expect((await request(app).post(url(ids.deniz)).send({ rating: 'helpful' })).status).toBe(401);
  });
});
