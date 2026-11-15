const express = require('express');
const { loadConfig } = require('./config');
const { authenticate } = require('./middleware/auth');
const { HttpError } = require('./validate');

const authRoutes = require('./routes/auth');
const childrenRoutes = require('./routes/children');
const linkRoutes = require('./routes/links');
const eventRoutes = require('./routes/events');
const taskRoutes = require('./routes/tasks');
const entryRoutes = require('./routes/entries');

function createApp({ db, config = loadConfig() } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  if (db) {
    app.use('/api/auth', authRoutes(db, config));
    app.use('/api/children', authenticate(db, config));
    app.use('/api/children', childrenRoutes(db));
    app.use('/api/children/:childId/links', linkRoutes(db));
    app.use('/api/children/:childId/events', eventRoutes(db));
    app.use('/api/children/:childId/tasks', taskRoutes(db));
    app.use('/api/children/:childId/entries', entryRoutes(db));
  }

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Bulunamadı.' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'İstek gövdesi geçerli JSON değil.' });
    }
    res.status(500).json({ error: 'Beklenmeyen bir hata oluştu.' });
  });

  return app;
}

module.exports = { createApp };
