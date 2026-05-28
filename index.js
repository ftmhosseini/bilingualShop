const fs = require('fs');
const path = require('path');

// If .env doesn't exist, run the installer instead
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  require('./install');
  return;
}

const app = require('./app');
const { initDB } = require('./db');

// Serve frontend build for any non-API route (production/cPanel only)
const indexHtml = path.join(__dirname, 'build', 'index.html');
if (fs.existsSync(indexHtml)) {
  app.get(/.*/, (req, res) => {
    res.sendFile(indexHtml);
  });
}

initDB().then(() => {
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Backend running on port ${process.env.PORT || 5000}`);
  });
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
