const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) require('dotenv').config({ path: envPath });

// Railway/cloud: DATABASE_URL is set → skip installer, connect directly
// cPanel/local: no .env and no DATABASE_URL → show web installer
if (!process.env.DATABASE_URL && !process.env.DB_HOST && !fs.existsSync(envPath)) {
  require('./install');
} else {
  const app = require('./app');
  const { initDB, getPool } = require('./db');

  async function waitForDB(maxRetries = 15) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const pool = await getPool();
        await pool.execute('SELECT 1');
        console.log('✓ Database connected');
        return true;
      } catch (err) {
        console.log(`⏳ Attempt ${i + 1}/${maxRetries}: ${err.code || err.message}`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    return false;
  }

  const indexHtml = path.join(__dirname, 'build', 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.get(/.*/, (req, res) => res.sendFile(indexHtml));
  }

  (async () => {
    const connected = await waitForDB();
    if (!connected) {
      console.error('❌ Could not connect to database. Check DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME.');
      process.exit(1);
    }
    await initDB();
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Backend running on port ${process.env.PORT || 5000}`);
    });
  })();
}
