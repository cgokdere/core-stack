const request = require('supertest');
const { createApp } = require('../src/app');

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('answers unknown API paths with a JSON 404', async () => {
    const res = await request(createApp()).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
