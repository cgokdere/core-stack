const fs = require('fs');
const request = require('supertest');
const { makeApp, login, auth } = require('./helpers');

const PDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);

function upload(app, token, childId, buffer, filename = 'rapor.pdf', docType = 'report') {
  return request(app)
    .post(`/api/children/${childId}/documents`)
    .set(auth(token))
    .field('docType', docType)
    .attach('file', buffer, { filename });
}

describe('M6 - documents', () => {
  it('uploads a PDF and lists it with name, type, uploader and date', async () => {
    const { app, ids } = makeApp();
    const parent = await login(app, 'selin.yildiz@example.com');
    const res = await upload(app, parent, ids.deniz, PDF, 'okul-raporu.pdf');
    expect(res.status).toBe(201);
    expect(res.body.document).toMatchObject({
      name: 'okul-raporu.pdf',
      mimeType: 'application/pdf',
      docType: 'report',
      uploaderName: 'Selin Yıldız',
    });

    const list = await request(app).get(`/api/children/${ids.deniz}/documents`).set(auth(parent));
    expect(list.status).toBe(200);
    expect(list.body.documents).toHaveLength(1);
    expect(list.body.documents[0].createdAt).toEqual(expect.any(String));
  });

  it('accepts PNG and JPEG images from a linked specialist', async () => {
    const { app, ids } = makeApp();
    const zeynep = await login(app, 'zeynep.aydin@example.com');
    expect((await upload(app, zeynep, ids.deniz, PNG, 'cizim.png', 'other')).body.document.mimeType).toBe('image/png');
    expect((await upload(app, zeynep, ids.deniz, JPEG, 'foto.jpg', 'form')).body.document.mimeType).toBe('image/jpeg');
  });

  it('downloads and views the stored file', async () => {
    const { app, ids } = makeApp();
    const parent = await login(app, 'selin.yildiz@example.com');
    const { id } = (await upload(app, parent, ids.deniz, PDF, 'türkçe ad.pdf')).body.document;
    const url = `/api/children/${ids.deniz}/documents/${id}/download`;

    const download = await request(app).get(url).set(auth(parent)).buffer().parse((res, cb) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    expect(download.status).toBe(200);
    expect(download.headers['content-type']).toMatch(/application\/pdf/);
    expect(download.headers['content-disposition']).toMatch(/^attachment; filename\*=UTF-8''/);
    expect(decodeURIComponent(download.headers['content-disposition'])).toContain('türkçe ad.pdf');
    expect(download.headers['x-content-type-options']).toBe('nosniff');
    expect(download.body.equals(PDF)).toBe(true);

    const inline = await request(app).get(`${url}?inline=1`).set(auth(parent));
    expect(inline.headers['content-disposition']).toMatch(/^inline/);
  });

  it('lets a linked specialist see the documents but not the child', async () => {
    const { app, ids } = makeApp();
    const parent = await login(app, 'selin.yildiz@example.com');
    const { id } = (await upload(app, parent, ids.deniz, PDF)).body.document;
    const base = `/api/children/${ids.deniz}/documents`;

    const elif = await login(app, 'elif.arslan@example.com');
    expect((await request(app).get(base).set(auth(elif))).body.documents).toHaveLength(1);
    expect((await request(app).get(`${base}/${id}/download`).set(auth(elif))).status).toBe(200);

    const child = await login(app, 'deniz.yildiz@example.com');
    expect((await request(app).get(base).set(auth(child))).status).toBe(403);
    expect((await request(app).get(`${base}/${id}/download`).set(auth(child))).status).toBe(403);
    expect((await upload(app, child, ids.deniz, PDF)).status).toBe(403);
  });

  it('blocks unlinked specialists and other families', async () => {
    const { app, ids } = makeApp();
    const parent = await login(app, 'selin.yildiz@example.com');
    const { id } = (await upload(app, parent, ids.deniz, PDF)).body.document;
    for (const email of ['can.demir@example.com', 'aylin.korkmaz@example.com']) {
      const token = await login(app, email);
      const get = await request(app).get(`/api/children/${ids.deniz}/documents/${id}/download`).set(auth(token));
      expect(get.status).toBe(403);
      expect((await upload(app, token, ids.deniz, PDF)).status).toBe(403);
    }
  });

  it('rejects files that are not PDF or images, whatever their name says', async () => {
    const { app, ids } = makeApp();
    const parent = await login(app, 'selin.yildiz@example.com');
    const text = await upload(app, parent, ids.deniz, Buffer.from('hello world'), 'not.pdf');
    expect(text.status).toBe(400);
    const exe = await upload(app, parent, ids.deniz, Buffer.from('MZ\x90\x00'), 'virus.png');
    expect(exe.status).toBe(400);
  });

  it('rejects a request without a file', async () => {
    const { app, ids } = makeApp();
    const res = await request(app)
      .post(`/api/children/${ids.deniz}/documents`)
      .set(auth(await login(app, 'selin.yildiz@example.com')))
      .field('docType', 'report');
    expect(res.status).toBe(400);
  });

  it('rejects files over the size limit with 413', async () => {
    const { app, ids } = makeApp({});
    const big = Buffer.concat([PDF, Buffer.alloc(10 * 1024 * 1024)]);
    const res = await upload(app, await login(app, 'selin.yildiz@example.com'), ids.deniz, big, 'big.pdf');
    expect(res.status).toBe(413);
  });

  it('uses "other" for an unknown document type and strips directories from the name', async () => {
    const { app, ids } = makeApp();
    const res = await upload(app, await login(app, 'selin.yildiz@example.com'), ids.deniz, PDF, '../../evil.pdf', 'nonsense');
    expect(res.status).toBe(201);
    expect(res.body.document.docType).toBe('other');
    expect(res.body.document.name).toBe('evil.pdf');
  });

  it('returns 404 for a missing document or a missing stored file', async () => {
    const { app, ids, db, config } = makeApp();
    const parent = await login(app, 'selin.yildiz@example.com');
    const base = `/api/children/${ids.deniz}/documents`;
    expect((await request(app).get(`${base}/9999/download`).set(auth(parent))).status).toBe(404);

    const { id } = (await upload(app, parent, ids.deniz, PDF)).body.document;
    const stored = db.prepare('SELECT stored_name FROM documents WHERE id = ?').get(id).stored_name;
    fs.unlinkSync(`${config.uploadDir}/${stored}`);
    expect((await request(app).get(`${base}/${id}/download`).set(auth(parent))).status).toBe(404);
  });

  it('does not serve a document through another child', async () => {
    const { app, ids } = makeApp();
    const elif = await login(app, 'elif.arslan@example.com');
    const { id } = (await upload(app, elif, ids.ece, PDF)).body.document;
    const res = await request(app).get(`/api/children/${ids.deniz}/documents/${id}/download`).set(auth(elif));
    expect(res.status).toBe(404);
  });
});
