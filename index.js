const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) require('dotenv').config({ path: envPath });

// If no .env and no DB config env vars, run the installer
if (!fs.existsSync(envPath) && !process.env.DB_HOST && !process.env.DATABASE_URL) {
  require('./install');
} else {
  const app = require('./app');
  const { initDB, getPool } = require('./db');

  async function waitForDB(maxRetries = 30) {
    console.log(`DB config: DATABASE_URL=${process.env.DATABASE_URL ? 'set' : 'unset'}, host=${process.env.DB_HOST}, port=${process.env.DB_PORT}, user=${process.env.DB_USER}, db=${process.env.DB_NAME}`);
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
