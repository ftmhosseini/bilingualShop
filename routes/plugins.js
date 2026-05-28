const router = require('express').Router();
const { adminMiddleware } = require('../middleware');
const { getPool } = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: 'plugins/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => cb(null, ['.php', '.js'].includes(path.extname(file.originalname).toLowerCase())),
});

// GET all plugins, optionally filtered by type
router.get('/', adminMiddleware, async (req, res) => {
  const db = await getPool();
  const { type } = req.query; // 'payment' | 'shipping'
  const [rows] = type
    ? await db.execute('SELECT * FROM plugins WHERE type = ?', [type])
    : await db.execute('SELECT * FROM plugins');
  res.json(rows);
});

// Upload + register plugin
router.post('/', adminMiddleware, upload.single('plugin'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { name, type, currency_code, config } = req.body;
  if (!['payment', 'shipping'].includes(type)) return res.status(400).json({ error: 'type must be payment or shipping' });
  const db = await getPool();
  const [r] = await db.execute(
    'INSERT INTO plugins (name, type, currency_code, filename, config, active) VALUES (?,?,?,?,?,1)',
    [name, type, currency_code || null, req.file.filename, config || '{}']
  );
  res.json({ id: r.insertId, filename: req.file.filename });
});

// Update config / active state
router.put('/:id', adminMiddleware, async (req, res) => {
  const { config, active } = req.body;
  const db = await getPool();
  await db.execute('UPDATE plugins SET config=?, active=? WHERE id=?',
    [JSON.stringify(config ?? {}), active ? 1 : 0, req.params.id]);
  res.json({ success: true });
});

// Delete plugin
router.delete('/:id', adminMiddleware, async (req, res) => {
  const db = await getPool();
  const [[plugin]] = await db.execute('SELECT filename FROM plugins WHERE id=?', [req.params.id]);
  if (plugin) {
    const f = path.join(__dirname, '../plugins', plugin.filename);
    if (fs.existsSync(f)) fs.unlinkSync(f);
    await db.execute('DELETE FROM plugins WHERE id=?', [req.params.id]);
  }
  res.json({ success: true });
});

module.exports = router;
