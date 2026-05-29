// const fs = require('fs');
// const path = require('path');

// // If .env doesn't exist, run the installer instead
// if (!fs.existsSync(path.join(__dirname, '.env'))) {
//   require('./install');
//   return;
// }

// const app = require('./app');
// const { initDB } = require('./db');

// // Serve frontend build for any non-API route (production/cPanel only)
// const indexHtml = path.join(__dirname, 'build', 'index.html');
// if (fs.existsSync(indexHtml)) {
//   app.get(/.*/, (req, res) => {
//     res.sendFile(indexHtml);
//   });
// }

// initDB().then(() => {
//   app.listen(process.env.PORT || 5000, () => {
//     console.log(`Backend running on port ${process.env.PORT || 5000}`);
//   });
// }).catch(err => {
//   console.error('DB init failed:', err);
//   process.exit(1);
// });

const fs = require('fs');
const path = require('path');

// If .env doesn't exist AND no DB_HOST env var set, run the installer instead
if (!fs.existsSync(path.join(__dirname, '.env')) && !process.env.DB_HOST) {
  require('./install');
  return;
}

const app = require('./app');
const { initDB, getPool } = require('./db');

// Wait for database to be ready
async function waitForDB(maxRetries = 60) {
 for (let i = 0; i < maxRetries; i++) {
   try {
     const pool = await getPool();
     await pool.execute('SELECT 1');
     console.log('✓ Database connected successfully');
     return;
   } catch (err) {
     console.log(`⏳ Attempt ${i + 1}/${maxRetries}: Waiting for database... (${err.code})`);
     await new Promise(r => setTimeout(r, 2000)); // wait 2 seconds
   }
 }
 throw new Error('Could not connect to database after 60 retries');
}

// Serve frontend build for any non-API route (production/cPanel only)
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
