const { loadConfig } = require('../src/config');
const { openDb } = require('../src/db');
const { seedDatabase, DEMO_PASSWORD } = require('../src/seed');

const config = loadConfig();
const db = openDb(config.dbPath);
seedDatabase(db);
db.close();

console.log(`Seeded synthetic users and children into ${config.dbPath}`);
console.log(`All demo accounts use the password: ${DEMO_PASSWORD}`);
console.log('Parents: selin.yildiz@example.com, aylin.korkmaz@example.com');
console.log('Children: deniz.yildiz@example.com, ece.korkmaz@example.com');
console.log('Specialists: murat.kaya@, elif.arslan@, zeynep.aydin@, can.demir@ (example.com)');
