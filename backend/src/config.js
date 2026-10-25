const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

function loadConfig(env = process.env) {
  return {
    port: Number(env.PORT) || 3001,
    jwtSecret: env.JWT_SECRET || 'dev-only-secret-change-me',
    dbPath: env.DB_PATH || path.join(dataDir, 'app.db'),
    // res.sendFile needs an absolute path, so a relative UPLOAD_DIR is resolved here.
    uploadDir: path.resolve(env.UPLOAD_DIR || path.join(dataDir, 'uploads')),
    maxUploadBytes: 10 * 1024 * 1024,
    ai: {
      provider: env.AI_PROVIDER || 'mock',
      geminiApiKey: env.GEMINI_API_KEY || '',
      geminiModel: env.GEMINI_MODEL || 'gemini-2.5-flash',
      githubToken: env.GITHUB_TOKEN || '',
      githubModel: env.GITHUB_MODEL || 'openai/gpt-4o-mini',
    },
  };
}

module.exports = { loadConfig };
