const router = require('express').Router();
const { adminMiddleware } = require('../middleware');
const { getPool } = require('../db');

router.get('/:lang', async (req, res) => {
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM nav_links WHERE lang=? ORDER BY sort_order', [req.params.lang]);
  res.json(rows);
});

router.put('/:lang', adminMiddleware, async (req, res) => {
  const db = await getPool();
  await db.execute('DELETE FROM nav_links WHERE lang=?', [req.params.lang]);
  for (const link of req.body) {
    await db.execute('INSERT INTO nav_links (lang, label, url, icon, sort_order) VALUES (?,?,?,?,?)',
      [req.params.lang, link.label, link.url, link.icon || '', link.sort_order || 0]);
  }
  res.json({ success: true });
});

module.exports = router;
