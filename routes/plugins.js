const router = require('express').Router();
const { adminMiddleware } = require('../middleware');
const { getPool } = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');

const PLUGINS_DIR = path.join(__dirname, '../plugins');

const storage = multer.diskStorage({
  destination: PLUGINS_DIR,
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => cb(null, ['.php', '.js', '.zip'].includes(path.extname(file.originalname).toLowerCase())),
});

// Extract a zip and return the filename of the main plugin file (.php or .js)
async function extractZip(zipPath) {
  const zip = await unzipper.Open.file(zipPath);
  const pluginFile = zip.files.find(f => ['.php', '.js'].includes(path.extname(f.path).toLowerCase()) && !f.path.includes('/'));
  // also check one level deep if not found at root
  const target = pluginFile || zip.files.find(f => ['.php', '.js'].includes(path.extname(f.path).toLowerCase()));
  if (!target) throw new Error('No .php or .js file found in zip');
  const outName = Date.now() + '-' + path.basename(target.path).replace(/[^a-zA-Z0-9._-]/g, '_');
  const outPath = path.join(PLUGINS_DIR, outName);
  await new Promise((resolve, reject) => target.stream().pipe(fs.createWriteStream(outPath)).on('finish', resolve).on('error', reject));
  fs.unlinkSync(zipPath); // remove the zip
  return outName;
}

// Register built-in plugins (zarinpal.js + iran-post-shipping.js) into DB
router.post('/seed-builtin', adminMiddleware, async (req, res) => {
  const db = await getPool();
  const seeded = [];
  const [z] = await db.execute("SELECT id FROM plugins WHERE filename='zarinpal.js'");
  if (!z.length) {
    await db.execute("INSERT INTO plugins (name,type,currency_code,filename,config,active) VALUES ('ZarinPal','payment','IRR','zarinpal.js','{\"merchant_id\":\"\",\"sandbox\":true}',1)");
    seeded.push('ZarinPal');
  }
  const [s] = await db.execute("SELECT id FROM plugins WHERE filename='iran-post-shipping.js'");
  if (!s.length) {
    await db.execute("INSERT INTO plugins (name,type,currency_code,filename,config,active) VALUES ('Iran Post Shipping','shipping','IRR','iran-post-shipping.js','{\"source_state\":\"THR\",\"extra_cost\":0,\"extra_cost_percent\":0,\"free_for_price\":0,\"disable_express_above\":20000,\"disable_certified_above\":5000,\"disable_bike_above\":50000,\"bike_fix_price\":0,\"min_weight_cod\":0}',1)");
    seeded.push('Iran Post Shipping');
  }
  if (seeded.length) return res.json({ success: true, seeded });
  res.json({ message: 'Already registered' });
});

// GET all plugins, optionally filtered by type or currency
router.get('/', adminMiddleware, async (req, res) => {
  const db = await getPool();
  const { type, currency } = req.query;
  let sql = 'SELECT * FROM plugins WHERE 1=1';
  const params = [];
  if (type) { sql += ' AND type=?'; params.push(type); }
  if (currency) { sql += ' AND (currency_code=? OR currency_code IS NULL)'; params.push(currency); }
  const [rows] = await db.execute(sql, params);
  res.json(rows);
});

// Upload + register plugin
router.post('/', adminMiddleware, upload.single('plugin'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { name, type, currency_code, config } = req.body;
  if (!['payment', 'shipping'].includes(type)) return res.status(400).json({ error: 'type must be payment or shipping' });

  let filename = req.file.filename;
  if (path.extname(req.file.originalname).toLowerCase() === '.zip') {
    try {
      filename = await extractZip(req.file.path);
    } catch (e) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: e.message });
    }
  }

  const db = await getPool();
  const [r] = await db.execute(
    'INSERT INTO plugins (name, type, currency_code, filename, config, active) VALUES (?,?,?,?,?,1)',
    [name, type, currency_code || null, filename, config || '{}']
  );
  res.json({ id: r.insertId, filename });
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
