const request = require('supertest');
const { makeApp, login, auth } = require('./helpers');

describe('M2 - linking specialists', () => {
  it('lets the parent list the linked specialists', async () => {
    const { app, ids } = makeApp();
    const token = await login(app, 'selin.yildiz@example.com');
    const res = await request(app).get(`/api/children/${ids.deniz}/links`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.links.map((l) => l.email)).toEqual([
      'murat.kaya@example.com',
      'elif.arslan@example.com',
      'zeynep.aydin@example.com',
    ]);
  });

  it('links a registered specialist by e-mail, who can then see the child', async () => {
    const { app, ids } = makeApp();
    const parent = await login(app, 'selin.yildiz@example.com');
    const can = await login(app, 'can.demir@example.com');

    const before = await request(app).get(`/api/children/${ids.deniz}`).set(auth(can));
    expect(before.status).toBe(403);

    const res = await request(app)
      .post(`/api/children/${ids.deniz}/links`)
      .set(auth(parent))
      .send({ email: 'can.demir@example.com', specialty: 'coach' });
    expect(res.status).toBe(201);
    expect(res.body.link).toMatchObject({ email: 'can.demir@example.com', specialty: 'coach' });

    const after = await request(app).get(`/api/children/${ids.deniz}`).set(auth(can));
    expect(after.status).toBe(200);
  });

  it('uses the specialist profile type when none is given', async () => {
    const { app, ids } = makeApp();
    const parent = await login(app, 'selin.yildiz@example.com');
    const res = await request(app)
      .post(`/api/children/${ids.deniz}/links`)
      .set(auth(parent))
      .send({ email: 'can.demir@example.com' });
    expect(res.body.link.specialty).toBe('coach');
  });

  it('shows an error for an e-mail that is not a registered specialist', async () => {
    const { app, ids } = makeApp();
    const parent = await login(app, 'selin.yildiz@example.com');
    const unknown = await request(app)
      .post(`/api/children/${ids.deniz}/links`)
      .set(auth(parent))
      .send({ email: 'ayse.kilic@example.com' });
    expect(unknown.status).toBe(404);
    expect(unknown.body.error).toMatch(/kayıtlı bir uzman bulunamadı/);

    const notSpecialist = await request(app)
      .post(`/api/children/${ids.deniz}/links`)
      .set(auth(parent))
      .send({ email: 'aylin.korkmaz@example.com' });
    expect(notSpecialist.status).toBe(404);
  });

  it('validates the request and rejects duplicates', async () => {
    const { app, ids } = makeApp();
    const parent = await login(app, 'selin.yildiz@example.com');
    const url = `/api/children/${ids.deniz}/links`;
    expect((await request(app).post(url).set(auth(parent)).send({})).status).toBe(400);
    expect(
      (await request(app).post(url).set(auth(parent)).send({ email: 'can.demir@example.com', specialty: 'wizard' })).status
    ).toBe(400);
    expect(
      (await request(app).post(url).set(auth(parent)).send({ email: 'murat.kaya@example.com' })).status
    ).toBe(409);
  });

  it('closes every route for a specialist after unlinking', async () => {
    const { app, ids } = makeApp();
    const parent = await login(app, 'selin.yildiz@example.com');
    const murat = await login(app, 'murat.kaya@example.com');
    const muratId = (await request(app).get('/api/auth/me').set(auth(murat))).body.user.id;
    const base = `/api/children/${ids.deniz}`;

    expect((await request(app).get(base).set(auth(murat))).status).toBe(200);

    const del = await request(app).delete(`${base}/links/${muratId}`).set(auth(parent));
    expect(del.status).toBe(204);

    const probes = [
      ['get', base],
      ['get', `${base}/links`],
    ];
    for (const [method, url] of probes) {
      const res = await request(app)[method](url).set(auth(murat));
      expect([method, url, res.status]).toEqual([method, url, 403]);
    }

    const list = await request(app).get('/api/children').set(auth(murat));
    expect(list.body.children).toEqual([]);
  });

  it('reports 404 when unlinking someone who is not linked', async () => {
    const { app, ids } = makeApp();
    const parent = await login(app, 'selin.yildiz@example.com');
    const res = await request(app).delete(`/api/children/${ids.deniz}/links/9999`).set(auth(parent));
    expect(res.status).toBe(404);
  });

  it('keeps linking to the parent: specialists, children and other parents get 403', async () => {
    const { app, ids } = makeApp();
    const url = `/api/children/${ids.deniz}/links`;
    for (const email of ['elif.arslan@example.com', 'deniz.yildiz@example.com', 'aylin.korkmaz@example.com']) {
      const token = await login(app, email);
      expect((await request(app).get(url).set(auth(token))).status).toBe(403);
      expect(
        (await request(app).post(url).set(auth(token)).send({ email: 'can.demir@example.com' })).status
      ).toBe(403);
    }
  });
});
