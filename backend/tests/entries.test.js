const request = require('supertest');
const { makeApp, login, auth } = require('./helpers');

const entry = { entryDate: '2026-10-15', title: 'Haftalık görüşme', body: 'Sosyal becerilerde ilerleme gözlendi.', area: 'social' };

describe('M5 - specialist entries', () => {
  it('lets a linked specialist add a dated observation', async () => {
    const { app, ids } = makeApp();
    const res = await request(app)
      .post(`/api/children/${ids.deniz}/entries`)
      .set(auth(await login(app, 'elif.arslan@example.com')))
      .send(entry);
    expect(res.status).toBe(201);
    expect(res.body.entry).toMatchObject({
      entryDate: '2026-10-15',
      title: 'Haftalık görüşme',
      edited: false,
      authorName: 'Elif Arslan',
    });
  });

  it('lets the parent and linked specialists read entries, newest first', async () => {
    const { app, ids } = makeApp();
    for (const email of ['selin.yildiz@example.com', 'murat.kaya@example.com']) {
      const res = await request(app)
        .get(`/api/children/${ids.deniz}/entries`)
        .set(auth(await login(app, email)));
      expect(res.status).toBe(200);
      expect(res.body.entries.length).toBe(4);
      const dates = res.body.entries.map((e) => e.entryDate);
      expect(dates).toEqual([...dates].sort().reverse());
    }
  });

  it('hides all entries from the child', async () => {
    const { app, ids } = makeApp();
    const child = await login(app, 'deniz.yildiz@example.com');
    const base = `/api/children/${ids.deniz}/entries`;
    expect((await request(app).get(base).set(auth(child))).status).toBe(403);
    expect((await request(app).post(base).set(auth(child)).send(entry)).status).toBe(403);
    expect((await request(app).put(`${base}/1`).set(auth(child)).send(entry)).status).toBe(403);
  });

  it('does not let the parent write entries', async () => {
    const { app, ids } = makeApp();
    const res = await request(app)
      .post(`/api/children/${ids.deniz}/entries`)
      .set(auth(await login(app, 'selin.yildiz@example.com')))
      .send(entry);
    expect(res.status).toBe(403);
  });

  it('marks an edited entry as edited, only for its author', async () => {
    const { app, ids } = makeApp();
    const elif = await login(app, 'elif.arslan@example.com');
    const base = `/api/children/${ids.deniz}/entries`;
    const created = (await request(app).post(base).set(auth(elif)).send(entry)).body.entry;

    const edited = await request(app)
      .put(`${base}/${created.id}`)
      .set(auth(elif))
      .send({ ...entry, body: 'Güncellenmiş gözlem.' });
    expect(edited.status).toBe(200);
    expect(edited.body.entry).toMatchObject({ body: 'Güncellenmiş gözlem.', edited: true });
    expect(edited.body.entry.editedAt).toEqual(expect.any(String));

    const parent = await login(app, 'selin.yildiz@example.com');
    const seen = (await request(app).get(base).set(auth(parent))).body.entries.find((e) => e.id === created.id);
    expect(seen.edited).toBe(true);

    const other = await request(app)
      .put(`${base}/${created.id}`)
      .set(auth(await login(app, 'murat.kaya@example.com')))
      .send(entry);
    expect(other.status).toBe(403);
    expect(other.body.error).toMatch(/yazan uzman/);
  });

  it('returns 404 when editing a missing entry', async () => {
    const { app, ids } = makeApp();
    const res = await request(app)
      .put(`/api/children/${ids.deniz}/entries/9999`)
      .set(auth(await login(app, 'elif.arslan@example.com')))
      .send(entry);
    expect(res.status).toBe(404);
  });

  it('validates entry input on create and edit', async () => {
    const { app, ids } = makeApp();
    const elif = await login(app, 'elif.arslan@example.com');
    const base = `/api/children/${ids.deniz}/entries`;
    const post = (body) => request(app).post(base).set(auth(elif)).send(body);
    expect((await post({ ...entry, entryDate: '15.10.2026' })).status).toBe(400);
    expect((await post({ ...entry, title: '' })).status).toBe(400);
    expect((await post({ ...entry, body: '' })).status).toBe(400);
    expect((await post({ ...entry, body: 'x'.repeat(2001) })).status).toBe(400);
    expect((await post({ ...entry, area: 'music' })).status).toBe(400);

    const own = (await post(entry)).body.entry;
    const put = await request(app).put(`${base}/${own.id}`).set(auth(elif)).send({ ...entry, title: '' });
    expect(put.status).toBe(400);
  });

  it('does not show one family\'s entries to another', async () => {
    const { app, ids } = makeApp();
    const res = await request(app)
      .get(`/api/children/${ids.ece}/entries`)
      .set(auth(await login(app, 'selin.yildiz@example.com')));
    expect(res.status).toBe(403);
  });
});
