const router = require('express').Router();
const { adminMiddleware } = require('../middleware');
const { getPool } = require('../db');

// GET page content by page+lang
router.get('/:page', async (req, res) => {
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM page_content WHERE page=?', [req.params.page]);
  res.json(rows);
});

// PUT upsert page content
router.put('/:page/:lang', adminMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const db = await getPool();
  await db.execute(
    'INSERT INTO page_content (page, lang, title, content) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE title=?, content=?',
    [req.params.page, req.params.lang, title, content, title, content]
  );
  res.json({ success: true });
});

module.exports = router;
