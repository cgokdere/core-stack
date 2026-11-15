// The single backend module that talks to a language model (M8).
//
// Providers: "mock" (default, used by tests and CI, never touches the network),
// "gemini" and "github" (GitHub Models). The caller passes only records the
// reader is allowed to see; this module never reads the database itself.

const { systemPromptFor, buildUserPrompt } = require('./aiPrompts');

const AREA_LABELS = {
  academic: 'Akademik',
  social: 'Sosyal-duygusal',
  health: 'Sağlık',
  sport: 'Spor',
};

function excerpt(text, max = 110) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function refs(records) {
  return records.map((r) => `[${r.ref}]`).join(' ');
}

// Deterministic stand-in for a model. It follows the same rules as the prompts:
// it only restates records, cites them and offers no diagnosis or advice.
function mockSummary({ role, childName, weekStart, weekEnd, records, stats }) {
  const entries = records.filter((r) => r.type === 'entry');
  const events = records.filter((r) => r.type === 'event');
  const tasks = records.filter((r) => r.type === 'task');
  const lines = [];

  if (role === 'parent') {
    lines.push(`${childName} için ${weekStart} – ${weekEnd} haftasının özeti.`);
    lines.push(
      `Bu hafta ${stats.total} görevden ${stats.done} tanesi tamamlandı (%${stats.rate}). ${tasks.length ? refs(tasks) : ''}`.trim()
    );
    if (events.length) {
      lines.push(`Programda ${events.length} etkinlik vardı: ${events.map((e) => e.title).join(', ')}. ${refs(events)}`);
    }
    entries.forEach((e) => {
      lines.push(`${e.author} şunu kaydetti: "${excerpt(e.detail)}" [${e.ref}]`);
    });
    if (!entries.length) lines.push('Bu hafta uzmanlardan yeni girdi yok.');
    lines.push('Bu özet bir değerlendirme veya öneri değildir; kararları siz verirsiniz.');
  } else {
    lines.push(`${childName} – ${weekStart} / ${weekEnd} haftalık kayıt özeti.`);
    lines.push(
      `Kayıtlar: ${entries.length} girdi, ${events.length} etkinlik, ${stats.total} görev (tamamlanma %${stats.rate}).`
    );
    Object.entries(AREA_LABELS).forEach(([area, label]) => {
      const inArea = records.filter((r) => r.area === area);
      if (!inArea.length) return;
      const open = inArea.filter((r) => r.type === 'task' && r.status === 'todo');
      const parts = inArea.map((r) => `${r.title} [${r.ref}]`).join('; ');
      lines.push(`${label}: ${parts}${open.length ? ` — açık görev: ${open.length}` : ''}`);
    });
    lines.push('Bu özet yalnızca kayıtları yeniden düzenler; değerlendirme ve karar uzmana aittir.');
  }
  return lines.join('\n');
}

async function callGemini(ai, systemPrompt, userPrompt, fetchFn) {
  if (!ai.geminiApiKey) throw new Error('GEMINI_API_KEY is not set');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${ai.geminiModel}:generateContent`;
  const response = await fetchFn(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': ai.geminiApiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    }),
  });
  if (!response.ok) throw new Error(`Gemini request failed with ${response.status}`);
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('');
  if (!text) throw new Error('Gemini returned no text');
  return text.trim();
}

async function callGithubModels(ai, systemPrompt, userPrompt, fetchFn) {
  if (!ai.githubToken) throw new Error('GITHUB_TOKEN is not set');
  const response = await fetchFn('https://models.github.ai/inference/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ai.githubToken}`,
    },
    body: JSON.stringify({
      model: ai.githubModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`GitHub Models request failed with ${response.status}`);
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('GitHub Models returned no text');
  return text.trim();
}

async function generateSummary(ai, input, fetchFn = globalThis.fetch) {
  const provider = ai.provider;
  if (provider === 'mock') return mockSummary(input);

  const systemPrompt = systemPromptFor(input.role);
  const userPrompt = buildUserPrompt(input);
  if (provider === 'gemini') return callGemini(ai, systemPrompt, userPrompt, fetchFn);
  if (provider === 'github') return callGithubModels(ai, systemPrompt, userPrompt, fetchFn);
  throw new Error(`Unknown AI provider: ${provider}`);
}

module.exports = { generateSummary, mockSummary };
