const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const { openDb } = require('../src/db');
const { createApp } = require('../src/app');
const { loadConfig } = require('../src/config');
const { seedDatabase, DEMO_PASSWORD } = require('../src/seed');

// Fixed Wednesday so tests do not depend on the day they run.
const TODAY = '2026-10-14';
const WEEK = { start: '2026-10-12', end: '2026-10-18' };

function makeApp(envOverrides = {}) {
  const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uploads-'));
  const config = loadConfig({ UPLOAD_DIR: uploadDir, AI_PROVIDER: 'mock', ...envOverrides });
  const db = openDb(':memory:');
  const ids = seedDatabase(db, { today: TODAY, bcryptRounds: 4 });
  const aiFetch = jest.fn();
  const app = createApp({ db, config, aiFetch });
  return { app, db, ids, config, aiFetch };
}

async function login(app, email, password = DEMO_PASSWORD) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = { makeApp, login, auth, TODAY, WEEK };
