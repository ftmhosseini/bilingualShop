// Syncs MySQL → shop.db (SQLite) for easy browsing in VS Code
// Usage: node sync-db.js

require('dotenv').config();
const { getPool } = require('./db');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const DB_PATH = './shop.db';
if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
const sdb = new sqlite3.Database(DB_PATH);

const run = (sql, p = []) => new Promise((res, rej) => sdb.run(sql, p, function (e) { e ? rej(e) : res(this); }));

(async () => {
  const db = await getPool();
  const [tables] = await db.execute('SHOW TABLES');
  const tableNames = tables.map(r => Object.values(r)[0]);

  for (const table of tableNames) {
    const [cols] = await db.execute(`SHOW COLUMNS FROM \`${table}\``);
    const colDefs = cols.map(c => {
      const t = c.Type.toLowerCase();
      let type = 'TEXT';
      if (t.includes('int')) type = 'INTEGER';
      else if (t.match(/decimal|float|double/)) type = 'REAL';
      return `"${c.Field}" ${type}${c.Key === 'PRI' ? ' PRIMARY KEY' : ''}`;
    }).join(', ');

    await run(`CREATE TABLE IF NOT EXISTS "${table}" (${colDefs})`);

    const [rows] = await db.execute(`SELECT * FROM \`${table}\``);
    for (const row of rows) {
      const vals = Object.values(row).map(v =>
        v === null ? null : v instanceof Date ? v.toISOString() : String(v)
      );
      await run(
        `INSERT OR REPLACE INTO "${table}" VALUES (${vals.map(() => '?').join(',')})`,
        vals
      ).catch(() => {});
    }
    console.log(`✓ ${table} (${rows.length} rows)`);
  }

  sdb.close();
  console.log('\nshop.db updated ✔');
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
