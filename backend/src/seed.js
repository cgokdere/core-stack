// Creates synthetic demo accounts and child records. No real person is represented
// here: names and e-mail addresses are made up and use the reserved example.com domain.
// Rows for links, events, tasks, entries, documents and AI feedback are added with
// the module that owns that table.

const bcrypt = require('bcryptjs');
const { weekRange, todayLocal } = require('./services/weeks');

const DEMO_PASSWORD = 'Password123!';

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return new Date(d.getTime() + days * 86400000).toISOString().slice(0, 10);
}

function seedDatabase(db, { today = todayLocal(), bcryptRounds = 10 } = {}) {
  const hash = bcrypt.hashSync(DEMO_PASSWORD, bcryptRounds);
  const monday = weekRange(today).start;
  const day = (offset) => addDays(monday, offset);

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
    const murat = user('murat.kaya@example.com', 'Murat Kaya', 'specialist', 'teacher');
    const elif = user('elif.arslan@example.com', 'Elif Arslan', 'specialist', 'psychologist');
    const zeynep = user('zeynep.aydin@example.com', 'Zeynep Aydın', 'specialist', 'special_education');
    user('can.demir@example.com', 'Can Demir', 'specialist', 'coach');

    const addChild = db.prepare('INSERT INTO children (name, grade, parent_id, user_id) VALUES (?, ?, ?, ?)');
    const deniz = Number(addChild.run('Deniz Yıldız', '4. sınıf', selin, denizUser).lastInsertRowid);
    const ece = Number(addChild.run('Ece Korkmaz', '3. sınıf', aylin, eceUser).lastInsertRowid);

    const now = new Date().toISOString();
    const addLink = db.prepare(
      'INSERT INTO links (child_id, specialist_id, specialty, created_at) VALUES (?, ?, ?, ?)'
    );
    addLink.run(deniz, murat, 'teacher', now);
    addLink.run(deniz, elif, 'psychologist', now);
    addLink.run(deniz, zeynep, 'special_education', now);
    addLink.run(ece, elif, 'psychologist', now);

    const addEvent = db.prepare(
      'INSERT INTO events (child_id, title, starts_at, ends_at, area, created_by) VALUES (?, ?, ?, ?, ?, ?)'
    );
    addEvent.run(deniz, 'Özel eğitim seansı', `${day(0)}T16:00`, `${day(0)}T17:00`, 'academic', zeynep);
    addEvent.run(deniz, 'Yüzme antrenmanı', `${day(1)}T17:30`, `${day(1)}T18:30`, 'sport', selin);
    addEvent.run(deniz, 'Veli toplantısı', `${day(2)}T15:30`, `${day(2)}T16:15`, 'social', murat);
    addEvent.run(deniz, 'Psikolog görüşmesi', `${day(3)}T16:30`, `${day(3)}T17:15`, 'health', elif);
    addEvent.run(deniz, 'Çocuk doktoru kontrolü', `${day(4)}T10:00`, `${day(4)}T10:30`, 'health', selin);
    addEvent.run(ece, 'Resim kursu', `${day(1)}T15:00`, `${day(1)}T16:00`, 'social', aylin);

    const addTask = db.prepare(
      `INSERT INTO tasks (child_id, title, description, area, due_date, status, done_at, assigned_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const done = (offset) => `${day(offset)}T19:00:00.000Z`;
    addTask.run(deniz, '15 dakika sesli okuma', 'Her akşam kısa bir kitap bölümünü sesli oku.', 'academic', day(0), 'done', done(0), murat, now);
    addTask.run(deniz, 'Matematik çalışma kâğıdı', 'Sayfa 3’teki alıştırmaları çöz.', 'academic', day(1), 'done', done(1), murat, now);
    addTask.run(deniz, '5 dakika nefes egzersizi', 'Uzmanın gösterdiği şekilde yap.', 'health', day(2), 'todo', null, elif, now);
    addTask.run(deniz, 'Yüzme çantasını hazırla', '', 'sport', day(1), 'done', done(1), selin, now);
    addTask.run(deniz, 'Sınıf sunumu için resim hazırla', 'Sunum için bir resim çiz.', 'social', day(4), 'todo', null, murat, now);
    addTask.run(deniz, 'Okuma günlüğünü doldur', '', 'academic', day(3), 'todo', null, zeynep, now);
    addTask.run(ece, 'Resim defterini tamamla', '', 'social', day(2), 'todo', null, aylin, now);

    const addEntry = db.prepare(
      `INSERT INTO entries (child_id, author_id, entry_date, title, body, area, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    addEntry.run(deniz, murat, day(0), 'Derse katılım gözlemi', 'Bu hafta matematik derslerinde iki kez gönüllü olarak tahtaya kalktı.', 'academic', now);
    addEntry.run(deniz, zeynep, day(1), 'Seans değerlendirmesi', 'Okuduğunu anlama etkinliklerinde sorulara ilk denemede verdiği doğru yanıt oranı yükseldi.', 'academic', now);
    addEntry.run(deniz, elif, day(2), 'Görüşme notu', 'Sabah rutininde kullandığı nefes egzersizinin işe yaradığını anlattı.', 'health', now);
    addEntry.run(deniz, elif, addDays(monday, -4), 'İlk görüşme', 'Aile ile tanışma görüşmesi yapıldı.', 'social', now);
    addEntry.run(ece, elif, day(1), 'Görüşme notu', 'Haftalık görüşme tamamlandı.', 'social', now);

    return { selin, aylin, deniz, ece };
  });

  return run();
}

module.exports = { seedDatabase, DEMO_PASSWORD };
