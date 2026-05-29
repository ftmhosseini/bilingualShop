const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) require('dotenv').config({ path: envPath });

// If no .env and no DB_HOST env var, run the installer
if (!fs.existsSync(envPath) && !process.env.DB_HOST) {
  require('./install');
} else {
  const app = require('./app');
  const { initDB, getPool } = require('./db');

  async function waitForDB(maxRetries = 30) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const pool = await getPool();
        await pool.execute('SELECT 1');
        console.log('✓ Database connected');
        return;
      } catch (err) {
        console.log(`⏳ Attempt ${i + 1}/${maxRetries}: Waiting for database... (${err.code || err.message})`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    throw new Error('Could not connect to database after retries');
  }

  const indexHtml = path.join(__dirname, 'build', 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.get(/.*/, (req, res) => {
      res.sendFile(indexHtml);
    });
  }

  (async () => {
    try {
      await waitForDB();
      await initDB();
      app.listen(process.env.PORT || 5000, () => {
        console.log(`Backend running on port ${process.env.PORT || 5000}`);
      });
    } catch (err) {
      console.error('DB init failed:', err);
      process.exit(1);
    }
  })();
}
