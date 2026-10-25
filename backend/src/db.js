const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'specialist', 'child')),
  specialty TEXT
);

CREATE TABLE IF NOT EXISTS children (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  grade TEXT,
  parent_id INTEGER NOT NULL REFERENCES users(id),
  user_id INTEGER UNIQUE REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  specialist_id INTEGER NOT NULL REFERENCES users(id),
  specialty TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (child_id, specialist_id)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  area TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'done')),
  done_at TEXT,
  assigned_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id),
  entry_date TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  area TEXT NOT NULL,
  edited INTEGER NOT NULL DEFAULT 0,
  edited_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  uploader_id INTEGER NOT NULL REFERENCES users(id),
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  stored_name TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  role TEXT NOT NULL,
  week_start TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('helpful', 'incorrect')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_child ON events (child_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_tasks_child ON tasks (child_id, due_date);
CREATE INDEX IF NOT EXISTS idx_entries_child ON entries (child_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_documents_child ON documents (child_id);
`;

function openDb(dbPath) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  if (dbPath !== ':memory:') db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  return db;
}

module.exports = { openDb };
