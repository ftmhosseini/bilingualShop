const router = require('express').Router();
const { adminMiddleware, shopMiddleware } = require('../middleware');
const { getPool } = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, 'logo' + path.extname(file.originalname)),
});
const upload = multer({ storage });

const imageStorage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')),
});
const uploadImage = multer({ storage: imageStorage, fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) });

router.get('/', async (req, res) => {
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM site_settings');
  const settings = {};
  rows.forEach(r => settings[r.key_name] = r.value);
  res.json(settings);
});

router.put('/:key', adminMiddleware, async (req, res) => {
  const db = await getPool();
  await db.execute(
    'INSERT INTO site_settings (key_name, value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=?',
    [req.params.key, req.body.value, req.body.value]
  );
  res.json({ success: true });
});

router.post('/upload-logo', adminMiddleware, upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/${req.file.filename}`;
  const db = await getPool();
  await db.execute(
    'INSERT INTO site_settings (key_name, value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=?',
    ['logo_url', url, url]
  );
  res.json({ url });
});

router.post('/upload-image', shopMiddleware, uploadImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

router.get('/images', shopMiddleware, (req, res) => {
  const dir = path.join(__dirname, '../uploads');
  const files = fs.readdirSync(dir).filter(f => f !== 'logo.svg' && !f.startsWith('logo.') && /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  res.json(files.map(f => ({ filename: f, url: `/uploads/${f}` })));
});

router.delete('/images/:filename', shopMiddleware, (req, res) => {
  const file = path.join(__dirname, '../uploads', path.basename(req.params.filename));
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ success: true });
});

module.exports = router;
