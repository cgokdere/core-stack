const { createApp } = require('./app');

const port = process.env.PORT || 3001;
createApp().listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
