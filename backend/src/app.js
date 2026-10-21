const express = require('express');

// Builds the Express app. Routes for M1-M8 are mounted here as they are added.
function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Unknown API paths answer with JSON, not with an HTML error page.
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Bulunamadı.' });
  });

  return app;
}

module.exports = { createApp };
