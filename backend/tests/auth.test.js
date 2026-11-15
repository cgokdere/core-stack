const request = require('supertest');
const jwt = require('jsonwebtoken');
const { makeApp, login, auth } = require('./helpers');

describe('M1 - login and roles', () => {
  it('logs in with e-mail and password and returns the role from the account', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'selin.yildiz@example.com', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ role: 'parent', name: 'Selin Yıldız' });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('accepts the e-mail case-insensitively', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'SELIN.YILDIZ@EXAMPLE.COM', password: 'Password123!' });
    expect(res.status).toBe(200);
  });

  it('rejects a wrong password and an unknown e-mail with the same 401', async () => {
    const { app } = makeApp();
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'selin.yildiz@example.com', password: 'wrong' });
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password123!' });
    expect(wrongPassword.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(unknown.body).toEqual(wrongPassword.body);
  });

  it('requires both fields', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.c' });
    expect(res.status).toBe(400);
  });

  it('returns the current user for a valid token', async () => {
    const { app } = makeApp();
    const token = await login(app, 'murat.kaya@example.com');
    const res = await request(app).get('/api/auth/me').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ role: 'specialist', specialty: 'teacher' });
  });

  it('rejects requests without a token or with a bad token', async () => {
    const { app } = makeApp();
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/children')).status).toBe(401);
    const bad = await request(app).get('/api/children').set(auth('not-a-token'));
    expect(bad.status).toBe(401);
  });

  it('rejects a token signed with another secret', async () => {
    const { app } = makeApp();
    const forged = jwt.sign({ sub: 1 }, 'another-secret');
    const res = await request(app).get('/api/children').set(auth(forged));
    expect(res.status).toBe(401);
  });

  it('rejects a valid token whose user no longer exists', async () => {
    const { app, db, config } = makeApp();
    const token = jwt.sign({ sub: 9999 }, config.jwtSecret);
    expect((await request(app).get('/api/children').set(auth(token))).status).toBe(401);
    expect(db.prepare('SELECT COUNT(*) AS n FROM users').get().n).toBeGreaterThan(0);
  });

  it('lists only the children each role may work with', async () => {
    const { app } = makeApp();
    const parent = await request(app)
      .get('/api/children')
      .set(auth(await login(app, 'selin.yildiz@example.com')));
    expect(parent.body.children.map((c) => c.name)).toEqual(['Deniz Yıldız']);

    const child = await request(app)
      .get('/api/children')
      .set(auth(await login(app, 'deniz.yildiz@example.com')));
    expect(child.body.children.map((c) => c.name)).toEqual(['Deniz Yıldız']);

    const elif = await request(app)
      .get('/api/children')
      .set(auth(await login(app, 'elif.arslan@example.com')));
    expect(elif.body.children).toEqual([]);

    const can = await request(app)
      .get('/api/children')
      .set(auth(await login(app, 'can.demir@example.com')));
    expect(can.body.children).toEqual([]);
  });

  it('shows a child only to the people related to it', async () => {
    const { app, ids } = makeApp();
    const own = await request(app)
      .get(`/api/children/${ids.deniz}`)
      .set(auth(await login(app, 'selin.yildiz@example.com')));
    expect(own.status).toBe(200);
    expect(own.body.role).toBe('parent');

    const otherParent = await request(app)
      .get(`/api/children/${ids.deniz}`)
      .set(auth(await login(app, 'aylin.korkmaz@example.com')));
    expect(otherParent.status).toBe(403);

    const otherChild = await request(app)
      .get(`/api/children/${ids.deniz}`)
      .set(auth(await login(app, 'ece.korkmaz@example.com')));
    expect(otherChild.status).toBe(403);
  });

  it('answers 403 for a child that does not exist or has a bad id', async () => {
    const { app } = makeApp();
    const token = await login(app, 'selin.yildiz@example.com');
    expect((await request(app).get('/api/children/9999').set(auth(token))).status).toBe(403);
    expect((await request(app).get('/api/children/abc').set(auth(token))).status).toBe(403);
  });
});
