const router = require('express').Router();
const { adminMiddleware } = require('../middleware');
const { getPool } = require('../db');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// List all users
router.get('/users', adminMiddleware, async (req, res) => {
  const db = await getPool();
  const [rows] = await db.execute('SELECT id, email, role FROM users');
  res.json(rows);
});

// Change a user's role — also mark as verified
router.put('/users/:id/role', adminMiddleware, async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'cooperatore', 'customer'].includes(role))
    return res.status(400).json({ error: 'Invalid role' });
  if (parseInt(req.params.id) === req.user.id)
    return res.status(403).json({ error: 'Cannot change your own role' });
  const db = await getPool();
  await db.execute('UPDATE users SET role = ?, verified = 1 WHERE id = ?', [role, req.params.id]);
  res.json({ message: 'Role updated' });
});

// EXPORT — dump all tables as JSON
router.get('/backup', adminMiddleware, async (req, res) => {
  const db = await getPool();
  const [tables] = await db.execute("SHOW TABLES");
  const tableKey = Object.keys(tables[0])[0];
  const backup = {};
  for (const row of tables) {
    const table = row[tableKey];
    const [rows] = await db.execute(`SELECT * FROM \`${table}\``);
    backup[table] = rows;
  }
  const json = JSON.stringify(backup, null, 2);
  res.setHeader('Content-Disposition', `attachment; filename="backup-${Date.now()}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(json);
});

// IMPORT — restore from JSON backup
router.post('/restore', adminMiddleware, upload.single('backup'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  let backup;
  try {
    // Strip BOM if present, trim whitespace
    const raw = req.file.buffer.toString('utf8').replace(/^\uFEFF/, '').trim();
    backup = JSON.parse(raw);
  }
  catch (e) { return res.status(400).json({ error: `Invalid JSON file: ${e.message}` }); }

  const db = await getPool();
  const errors = [];

  // Convert JS Date/ISO strings to MySQL-compatible values
  function toMysqlVal(v) {
    if (v === null || v === undefined) return null;
    if (v instanceof Object && !(v instanceof Date)) return JSON.stringify(v);
    if (typeof v === 'string') {
      // Full ISO datetime → MySQL datetime
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
        return v.replace('T', ' ').replace(/\.\d+Z$/, '').replace('Z', '');
      }
    }
    return v;
  }

  // Restore parent tables before child tables to avoid FK issues
  const ORDER = ['users','languages','currencies','categories','products','product_prices','product_media','orders','order_items'];
  const allTables = Object.keys(backup);
  const sorted = [...ORDER.filter(t => allTables.includes(t)), ...allTables.filter(t => !ORDER.includes(t))];

  await db.execute('SET FOREIGN_KEY_CHECKS=0');
  for (const table of sorted) {
    const rows = backup[table];
    if (!rows || !rows.length) continue;
    try {
      await db.execute(`DELETE FROM \`${table}\``);
      for (const row of rows) {
        const cols = Object.keys(row).map(c => `\`${c}\``).join(', ');
        const placeholders = Object.keys(row).map(() => '?').join(', ');
        const vals = Object.values(row).map(toMysqlVal);
        await db.execute(`INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`, vals);
      }
    } catch (e) {
      errors.push(`${table}: ${e.message}`);
    }
  }
  await db.execute('SET FOREIGN_KEY_CHECKS=1');

  res.json({ success: true, errors });
});

module.exports = router;
