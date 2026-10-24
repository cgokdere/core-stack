const fs = require('fs');
const os = require('os');
const path = require('path');
const bcrypt = require('bcryptjs');
const { loadConfig } = require('../src/config');
const { AREAS, SPECIALTIES } = require('../src/constants');
const { openDb } = require('../src/db');
const { seedDatabase, DEMO_PASSWORD } = require('../src/seed');

const EMPTY_TABLES = ['links', 'events', 'tasks', 'entries', 'documents', 'ai_feedback'];

describe('database schema and seed', () => {
  it('reads database settings from the environment', () => {
    expect(loadConfig().port).toBe(3001);
    const defaults = loadConfig({});
    expect(defaults.port).toBe(3001);
    expect(defaults.jwtSecret).toBe('dev-only-secret-change-me');
    expect(defaults.dbPath.endsWith(`${path.sep}data${path.sep}app.db`)).toBe(true);
    expect(path.isAbsolute(defaults.uploadDir)).toBe(true);
    expect(defaults.maxUploadBytes).toBe(10 * 1024 * 1024);
    expect(defaults.ai).toEqual({
      provider: 'mock',
      geminiApiKey: '',
      geminiModel: 'gemini-2.5-flash',
      githubToken: '',
      githubModel: 'openai/gpt-4o-mini',
    });
    expect(AREAS).toContain('academic');
    expect(SPECIALTIES).toContain('coach');

    const custom = loadConfig({
      PORT: '4000',
      DB_PATH: 'x.db',
      UPLOAD_DIR: './data/uploads',
      JWT_SECRET: 's',
      AI_PROVIDER: 'github',
      GEMINI_API_KEY: 'k',
      GEMINI_MODEL: 'm',
      GITHUB_TOKEN: 't',
      GITHUB_MODEL: 'gm',
    });
    expect(custom).toMatchObject({ port: 4000, dbPath: 'x.db', jwtSecret: 's' });
    expect(path.isAbsolute(custom.uploadDir)).toBe(true);
    expect(custom.ai).toEqual({
      provider: 'github',
      geminiApiKey: 'k',
      geminiModel: 'm',
      githubToken: 't',
      githubModel: 'gm',
    });
  });

  it('creates every table and seeds only users and children', () => {
    const db = openDb(':memory:');
    seedDatabase(db);
    const ids = seedDatabase(db, { bcryptRounds: 4 });

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all()
      .map((row) => row.name);
    expect(tables).toEqual([
      'ai_feedback',
      'children',
      'documents',
      'entries',
      'events',
      'links',
      'tasks',
      'users',
    ]);

    const emails = db.prepare('SELECT email FROM users ORDER BY email').all().map((row) => row.email);
    expect(emails).toEqual([
      'aylin.korkmaz@example.com',
      'can.demir@example.com',
      'deniz.yildiz@example.com',
      'ece.korkmaz@example.com',
      'elif.arslan@example.com',
      'murat.kaya@example.com',
      'selin.yildiz@example.com',
      'zeynep.aydin@example.com',
    ]);
    expect(db.prepare('SELECT COUNT(*) AS n FROM children').get().n).toBe(2);
    EMPTY_TABLES.forEach((table) => {
      expect(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n).toBe(0);
    });

    const deniz = db
      .prepare(
        `SELECT c.name AS child, p.email AS parent
         FROM children c JOIN users p ON p.id = c.parent_id
         WHERE c.id = ?`
      )
      .get(ids.deniz);
    expect(deniz).toEqual({ child: 'Deniz Yıldız', parent: 'selin.yildiz@example.com' });

    const ece = db
      .prepare(
        `SELECT c.name AS child, u.email AS login
         FROM children c JOIN users u ON u.id = c.user_id
         WHERE c.id = ?`
      )
      .get(ids.ece);
    expect(ece).toEqual({ child: 'Ece Korkmaz', login: 'ece.korkmaz@example.com' });

    const can = db.prepare("SELECT role, specialty FROM users WHERE email = 'can.demir@example.com'").get();
    expect(can).toEqual({ role: 'specialist', specialty: 'coach' });

    const hash = db.prepare("SELECT password_hash FROM users WHERE email = 'selin.yildiz@example.com'").get()
      .password_hash;
    expect(bcrypt.compareSync(DEMO_PASSWORD, hash)).toBe(true);

    db.close();
  });

  it('opens a file database with foreign keys and WAL', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cst23-'));
    const dbPath = path.join(dir, 'nested', 'app.db');
    const db = openDb(dbPath);
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(db.pragma('journal_mode', { simple: true })).toBe('wal');
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
