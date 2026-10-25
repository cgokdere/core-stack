// Creates synthetic demo accounts and child records. No real person is represented
// here: names and e-mail addresses are made up and use the reserved example.com domain.
// Rows for links, events, tasks, entries, documents and AI feedback are added with
// the module that owns that table.

const bcrypt = require('bcryptjs');

const DEMO_PASSWORD = 'Password123!';

function seedDatabase(db, { bcryptRounds = 10 } = {}) {
  const hash = bcrypt.hashSync(DEMO_PASSWORD, bcryptRounds);

  const run = db.transaction(() => {
    ['ai_feedback', 'documents', 'entries', 'tasks', 'events', 'links', 'children', 'users'].forEach((table) => {
      db.prepare(`DELETE FROM ${table}`).run();
    });
    db.prepare(
      "DELETE FROM sqlite_sequence WHERE name IN ('ai_feedback','documents','entries','tasks','events','links','children','users')"
    ).run();

    const addUser = db.prepare(
      'INSERT INTO users (email, password_hash, name, role, specialty) VALUES (?, ?, ?, ?, ?)'
    );
    const user = (email, name, role, specialty = null) =>
      Number(addUser.run(email, hash, name, role, specialty).lastInsertRowid);

    const selin = user('selin.yildiz@example.com', 'Selin Yıldız', 'parent');
    const aylin = user('aylin.korkmaz@example.com', 'Aylin Korkmaz', 'parent');
    const denizUser = user('deniz.yildiz@example.com', 'Deniz Yıldız', 'child');
    const eceUser = user('ece.korkmaz@example.com', 'Ece Korkmaz', 'child');
    user('murat.kaya@example.com', 'Murat Kaya', 'specialist', 'teacher');
    user('elif.arslan@example.com', 'Elif Arslan', 'specialist', 'psychologist');
    user('zeynep.aydin@example.com', 'Zeynep Aydın', 'specialist', 'special_education');
    user('can.demir@example.com', 'Can Demir', 'specialist', 'coach');

    const addChild = db.prepare('INSERT INTO children (name, grade, parent_id, user_id) VALUES (?, ?, ?, ?)');
    const deniz = Number(addChild.run('Deniz Yıldız', '4. sınıf', selin, denizUser).lastInsertRowid);
    const ece = Number(addChild.run('Ece Korkmaz', '3. sınıf', aylin, eceUser).lastInsertRowid);

    return { selin, aylin, deniz, ece };
  });

  return run();
}

module.exports = { seedDatabase, DEMO_PASSWORD };
