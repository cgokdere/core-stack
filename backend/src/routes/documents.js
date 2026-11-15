const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const { childAccess } = require('../middleware/childAccess');
const { toDocument } = require('../mappers');
const { DOC_TYPES } = require('../constants');

const SELECT_DOC = `SELECT d.*, u.name AS uploader_name FROM documents d
  JOIN users u ON u.id = d.uploader_id`;

// The declared MIME type is not trusted: the file's first bytes decide.
const SIGNATURES = [
  { mime: 'application/pdf', ext: '.pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'image/png', ext: '.png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/jpeg', ext: '.jpg', bytes: [0xff, 0xd8, 0xff] },
];

function detectType(buffer) {
  return SIGNATURES.find((s) => s.bytes.every((b, i) => buffer[i] === b));
}

function safeName(rawName) {
  // multer reads the multipart filename as latin1; restore the UTF-8 name.
  const decoded = Buffer.from(rawName, 'latin1').toString('utf8');
  return path.basename(decoded).slice(0, 200) || 'belge';
}

// M6 - documents. Parent and linked specialists only; never the child.
module.exports = function documentRoutes(db, config) {
  const router = express.Router({ mergeParams: true });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.maxUploadBytes, files: 1 },
  });

  router.get('/', childAccess(db, ['parent', 'specialist']), (req, res) => {
    const rows = db
      .prepare(`${SELECT_DOC} WHERE d.child_id = ? ORDER BY d.created_at DESC, d.id DESC`)
      .all(req.child.id);
    res.json({ documents: rows.map(toDocument) });
  });

  router.post('/', childAccess(db, ['parent', 'specialist']), upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Yüklenecek bir dosya seçin.' });
    }
    const type = detectType(req.file.buffer);
    if (!type) {
      return res.status(400).json({ error: 'Yalnızca PDF, JPG veya PNG dosyaları yüklenebilir.' });
    }
    const docType = DOC_TYPES.includes(req.body.docType) ? req.body.docType : 'other';
    const storedName = `${crypto.randomUUID()}${type.ext}`;
    fs.mkdirSync(config.uploadDir, { recursive: true });
    fs.writeFileSync(path.join(config.uploadDir, storedName), req.file.buffer);

    const info = db
      .prepare(
        `INSERT INTO documents
           (child_id, uploader_id, original_name, mime_type, size, stored_name, doc_type, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.child.id,
        req.user.id,
        safeName(req.file.originalname),
        type.mime,
        req.file.size,
        storedName,
        docType,
        new Date().toISOString()
      );
    const row = db.prepare(`${SELECT_DOC} WHERE d.id = ?`).get(info.lastInsertRowid);
    res.status(201).json({ document: toDocument(row) });
  });

  // ?inline=1 shows the file in the browser, otherwise it is downloaded.
  router.get('/:docId/download', childAccess(db, ['parent', 'specialist']), (req, res) => {
    const doc = db
      .prepare('SELECT * FROM documents WHERE id = ? AND child_id = ?')
      .get(Number(req.params.docId), req.child.id);
    const filePath = doc && path.join(config.uploadDir, doc.stored_name);
    if (!doc || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Belge bulunamadı.' });
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const disposition = req.query.inline === '1' ? 'inline' : 'attachment';
    res.type(doc.mime_type);
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename*=UTF-8''${encodeURIComponent(doc.original_name)}`
    );
    res.sendFile(filePath);
  });

  return router;
};
