const router = require('express').Router();
const { adminMiddleware } = require('../middleware');
const { getPool } = require('../db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')),
});
const upload = multer({ storage, fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')) });

// GET all blogs for a language
router.get('/:lang', async (req, res) => {
  try {
    const db = await getPool();
    const [rows] = await db.execute(
      'SELECT id, lang, title, slug, excerpt, content, image, author, tags, published_at, created_at FROM blogs WHERE lang=? ORDER BY published_at DESC',
      [req.params.lang]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single blog by id
router.get('/:lang/:id', async (req, res) => {
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM blogs WHERE id=? AND lang=?', [req.params.id, req.params.lang]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// POST create blog (admin only)
router.post('/', adminMiddleware, upload.single('image'), async (req, res) => {
  const { lang, title, slug, excerpt, content, author, tags, published_at, image_url } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : (image_url || null);
  const db = await getPool();
  const [r] = await db.execute(
    'INSERT INTO blogs (lang, title, slug, excerpt, content, image, author, tags, published_at) VALUES (?,?,?,?,?,?,?,?,?)',
    [lang, title, slug || null, excerpt || null, content || null, image, author || null, tags || null, published_at || null]
  );
  res.json({ id: r.insertId });
});

// PUT update blog (admin only)
router.put('/:id', adminMiddleware, upload.single('image'), async (req, res) => {
  const { title, slug, excerpt, content, author, tags, published_at, image_url } = req.body;
  const db = await getPool();
  // keep old image if no new one provided
  let image = image_url || null;
  if (req.file) image = `/uploads/${req.file.filename}`;
  if (!image) {
    const [rows] = await db.execute('SELECT image FROM blogs WHERE id=?', [req.params.id]);
    image = rows[0]?.image || null;
  }
  await db.execute(
    'UPDATE blogs SET title=?, slug=?, excerpt=?, content=?, image=?, author=?, tags=?, published_at=? WHERE id=?',
    [title, slug || null, excerpt || null, content || null, image, author || null, tags || null, published_at || null, req.params.id]
  );
  res.json({ success: true });
});

// DELETE blog (admin only)
router.delete('/:id', adminMiddleware, async (req, res) => {
  const db = await getPool();
  await db.execute('DELETE FROM blogs WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
