const express = require('express');
const { childAccess } = require('../middleware/childAccess');
const { toEntry } = require('../mappers');
const { AREAS } = require('../constants');
const { isDate, cleanString } = require('../validate');

const SELECT_ENTRY = `SELECT e.*, u.name AS author_name, u.specialty AS author_specialty
  FROM entries e JOIN users u ON u.id = e.author_id`;

function readEntryBody(payload) {
  const { entryDate, title, body, area } = payload || {};
  const cleanTitle = cleanString(title, 120);
  const cleanBody = cleanString(body, 2000);
  if (!isDate(entryDate)) return { error: 'Girdi tarihi geçersiz.' };
  if (!cleanTitle) return { error: 'Başlık gereklidir (en fazla 120 karakter).' };
  if (!cleanBody) return { error: 'Gözlem metni gereklidir (en fazla 2000 karakter).' };
  if (!AREAS.includes(area)) return { error: 'Geçersiz gelişim alanı.' };
  return { value: { entryDate, title: cleanTitle, body: cleanBody, area } };
}

// M5 - specialist entries. The child has no access to any of these routes.
module.exports = function entryRoutes(db) {
  const router = express.Router({ mergeParams: true });

  router.get('/', childAccess(db, ['parent', 'specialist']), (req, res) => {
    const rows = db
      .prepare(`${SELECT_ENTRY} WHERE e.child_id = ? ORDER BY e.entry_date DESC, e.id DESC`)
      .all(req.child.id);
    res.json({ entries: rows.map(toEntry) });
  });

  router.post('/', childAccess(db, ['specialist']), (req, res) => {
    const parsed = readEntryBody(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const { entryDate, title, body, area } = parsed.value;
    const info = db
      .prepare(
        `INSERT INTO entries (child_id, author_id, entry_date, title, body, area, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(req.child.id, req.user.id, entryDate, title, body, area, new Date().toISOString());
    const row = db.prepare(`${SELECT_ENTRY} WHERE e.id = ?`).get(info.lastInsertRowid);
    res.status(201).json({ entry: toEntry(row) });
  });

  // Only the author may edit an entry; an edit is always marked as "edited".
  router.put('/:entryId', childAccess(db, ['specialist']), (req, res) => {
    const entry = db
      .prepare('SELECT * FROM entries WHERE id = ? AND child_id = ?')
      .get(Number(req.params.entryId), req.child.id);
    if (!entry) {
      return res.status(404).json({ error: 'Girdi bulunamadı.' });
    }
    if (entry.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Yalnızca girdiyi yazan uzman düzenleyebilir.' });
    }
    const parsed = readEntryBody(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const { entryDate, title, body, area } = parsed.value;
    db.prepare(
      `UPDATE entries SET entry_date = ?, title = ?, body = ?, area = ?, edited = 1, edited_at = ?
       WHERE id = ?`
    ).run(entryDate, title, body, area, new Date().toISOString(), entry.id);
    res.json({ entry: toEntry(db.prepare(`${SELECT_ENTRY} WHERE e.id = ?`).get(entry.id)) });
  });

  return router;
};
