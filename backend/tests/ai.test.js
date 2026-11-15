const request = require('supertest');
const { makeApp, login, auth, WEEK } = require('./helpers');
const { generateSummary, mockSummary } = require('../src/services/aiService');
const { PARENT_SYSTEM_PROMPT, SPECIALIST_SYSTEM_PROMPT, systemPromptFor } = require('../src/services/aiPrompts');

const summaryUrl = (childId) => `/api/children/${childId}/ai-summary`;

describe('M8 - role-based AI summary', () => {
  it('returns a labelled summary linked to its source records for the parent', async () => {
    const { app, ids } = makeApp();
    const res = await request(app)
      .post(summaryUrl(ids.deniz))
      .set(auth(await login(app, 'selin.yildiz@example.com')))
      .send({ week: WEEK.start });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ label: 'AI-generated', role: 'parent', provider: 'mock', weekStart: WEEK.start });
    expect(res.body.summary).toContain('Deniz Yıldız');
    expect(res.body.sources.length).toBeGreaterThan(0);
    // every source number cited in the text exists in the sources list
    const cited = [...res.body.summary.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
    expect(cited.length).toBeGreaterThan(0);
    const refs = res.body.sources.map((s) => s.ref);
    cited.forEach((n) => expect(refs).toContain(n));
    expect(res.body.sources[0]).toEqual({
      ref: 1,
      type: 'entry',
      id: expect.any(Number),
      date: expect.any(String),
      title: expect.any(String),
    });
  });

  it('uses a different prompt and text for the specialist than for the parent', async () => {
    const { app, ids } = makeApp();
    const parent = await request(app)
      .post(summaryUrl(ids.deniz))
      .set(auth(await login(app, 'selin.yildiz@example.com')))
      .send({ week: WEEK.start });
    const specialist = await request(app)
      .post(summaryUrl(ids.deniz))
      .set(auth(await login(app, 'elif.arslan@example.com')))
      .send({ week: WEEK.start });
    expect(specialist.body.role).toBe('specialist');
    expect(specialist.body.summary).not.toBe(parent.body.summary);
    expect(specialist.body.summary).toMatch(/Kayıtlar:/);
    expect(PARENT_SYSTEM_PROMPT).not.toBe(SPECIALIST_SYSTEM_PROMPT);
    expect(systemPromptFor('parent')).toBe(PARENT_SYSTEM_PROMPT);
    expect(systemPromptFor('specialist')).toBe(SPECIALIST_SYSTEM_PROMPT);
  });

  it('forbids diagnosis and treatment advice in both prompts', () => {
    for (const prompt of [PARENT_SYSTEM_PROMPT, SPECIALIST_SYSTEM_PROMPT]) {
      expect(prompt).toMatch(/Never state or suggest a diagnosis, a treatment/);
      expect(prompt).toMatch(/Never make a decision for the reader/);
      expect(prompt).toMatch(/Use only the numbered records/);
    }
  });

  it('says so when the week has no records, without calling any provider', async () => {
    const { app, ids, aiFetch } = makeApp({ AI_PROVIDER: 'gemini', GEMINI_API_KEY: 'k' });
    const res = await request(app)
      .post(summaryUrl(ids.deniz))
      .set(auth(await login(app, 'selin.yildiz@example.com')))
      .send({ week: '2026-12-01' });
    expect(res.status).toBe(200);
    expect(res.body.sources).toEqual([]);
    expect(res.body.summary).toMatch(/kayıt bulunamadı/);
    expect(aiFetch).not.toHaveBeenCalled();
  });

  it('is not available to the child, unlinked specialists or other families', async () => {
    const { app, ids } = makeApp();
    for (const email of ['deniz.yildiz@example.com', 'can.demir@example.com', 'aylin.korkmaz@example.com']) {
      const res = await request(app).post(summaryUrl(ids.deniz)).set(auth(await login(app, email))).send({});
      expect(res.status).toBe(403);
    }
  });

  it('only summarises records of the requested child', async () => {
    const { app, ids } = makeApp();
    const res = await request(app)
      .post(summaryUrl(ids.ece))
      .set(auth(await login(app, 'elif.arslan@example.com')))
      .send({ week: WEEK.start });
    expect(res.body.sources.map((s) => s.title)).not.toContain('Yüzme antrenmanı');
    expect(res.body.summary).not.toContain('Deniz');
  });

  it('rejects a malformed week', async () => {
    const { app, ids } = makeApp();
    const res = await request(app)
      .post(summaryUrl(ids.deniz))
      .set(auth(await login(app, 'selin.yildiz@example.com')))
      .send({ week: 'last week' });
    expect(res.status).toBe(400);
  });

  it('answers 502 when the provider fails', async () => {
    const { app, ids, aiFetch } = makeApp({ AI_PROVIDER: 'gemini', GEMINI_API_KEY: 'k' });
    aiFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app)
      .post(summaryUrl(ids.deniz))
      .set(auth(await login(app, 'selin.yildiz@example.com')))
      .send({ week: WEEK.start });
    spy.mockRestore();
    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/üretilemedi/);
  });

  it('sends only the child\'s records and the role prompt to Gemini, then labels the answer', async () => {
    const { app, ids, aiFetch } = makeApp({ AI_PROVIDER: 'gemini', GEMINI_API_KEY: 'test-key' });
    aiFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'Model özeti [1]' }] } }] }),
    });
    const res = await request(app)
      .post(summaryUrl(ids.deniz))
      .set(auth(await login(app, 'selin.yildiz@example.com')))
      .send({ week: WEEK.start });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ label: 'AI-generated', provider: 'gemini', summary: 'Model özeti [1]' });

    const [url, init] = aiFetch.mock.calls[0];
    expect(url).toContain('generateContent');
    expect(init.headers['x-goog-api-key']).toBe('test-key');
    const sent = JSON.parse(init.body);
    expect(sent.systemInstruction.parts[0].text).toBe(PARENT_SYSTEM_PROMPT);
    const prompt = sent.contents[0].parts[0].text;
    expect(prompt).toContain('Deniz Yıldız');
    expect(prompt).not.toContain('Ece');
    expect(prompt).not.toContain('example.com');
  });
});

describe('AI providers', () => {
  const input = {
    role: 'specialist',
    childName: 'Deniz',
    weekStart: WEEK.start,
    weekEnd: WEEK.end,
    records: [{ ref: 1, type: 'entry', date: WEEK.start, area: 'academic', title: 'Not', detail: 'Ayrıntı', author: 'A' }],
    stats: { total: 0, done: 0, rate: 0 },
  };

  it('calls GitHub Models with the bearer token and the specialist prompt', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: ' GitHub özeti ' } }] }),
    });
    const ai = { provider: 'github', githubToken: 'gh-token', githubModel: 'openai/gpt-4o-mini' };
    const text = await generateSummary(ai, input, fetchFn);
    expect(text).toBe('GitHub özeti');
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://models.github.ai/inference/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer gh-token');
    const sent = JSON.parse(init.body);
    expect(sent.model).toBe('openai/gpt-4o-mini');
    expect(sent.messages[0]).toEqual({ role: 'system', content: SPECIALIST_SYSTEM_PROMPT });
  });

  it('fails clearly without credentials, on HTTP errors, on empty answers and for unknown providers', async () => {
    const fetchFn = jest.fn();
    await expect(generateSummary({ provider: 'gemini', geminiApiKey: '' }, input, fetchFn)).rejects.toThrow(/GEMINI_API_KEY/);
    await expect(generateSummary({ provider: 'github', githubToken: '' }, input, fetchFn)).rejects.toThrow(/GITHUB_TOKEN/);
    expect(fetchFn).not.toHaveBeenCalled();

    fetchFn.mockResolvedValueOnce({ ok: false, status: 429 });
    await expect(generateSummary({ provider: 'github', githubToken: 't' }, input, fetchFn)).rejects.toThrow(/429/);
    fetchFn.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await expect(generateSummary({ provider: 'github', githubToken: 't' }, input, fetchFn)).rejects.toThrow(/no text/);
    fetchFn.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await expect(generateSummary({ provider: 'gemini', geminiApiKey: 'k', geminiModel: 'm' }, input, fetchFn)).rejects.toThrow(/no text/);
    await expect(generateSummary({ provider: 'unknown' }, input, fetchFn)).rejects.toThrow(/Unknown AI provider/);
  });

  it('never calls the network in mock mode', async () => {
    const fetchFn = jest.fn();
    const text = await generateSummary({ provider: 'mock' }, input, fetchFn);
    expect(text).toContain('Deniz');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('mock summaries mention missing specialist entries and truncate long notes', () => {
    const base = { ...input, role: 'parent', stats: { total: 2, done: 1, rate: 50 } };
    expect(mockSummary({ ...base, records: [] })).toMatch(/yeni girdi yok/);
    const long = { ref: 1, type: 'entry', date: WEEK.start, area: 'health', title: 'T', detail: 'u'.repeat(300), author: 'A' };
    expect(mockSummary({ ...base, records: [long] })).toContain('…');
  });
});
