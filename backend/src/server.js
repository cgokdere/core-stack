const { loadConfig } = require('./config');
const { openDb } = require('./db');
const { createApp } = require('./app');

const config = loadConfig();
const db = openDb(config.dbPath);

const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
if (userCount === 0) {
  console.warn('The database has no users. Run "npm run seed" in backend/ to create demo data.');
}

createApp({ db, config }).listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});
