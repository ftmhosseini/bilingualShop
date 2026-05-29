const router = require('express').Router();
const { adminMiddleware } = require('../middleware');
const { getPool } = require('../db');

router.get('/', async (req, res) => {
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM languages ORDER BY code');
  res.json(rows);
});

router.put('/', adminMiddleware, async (req, res) => {
  const db = await getPool();
  const langs = req.body;
  for (const l of langs) {
    if (!l.code) continue;
    await db.execute(
      'INSERT INTO languages (code, label, rtl, enabled) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE label=?, rtl=?, enabled=?',
      [l.code, l.label, l.rtl?1:0, l.enabled?1:0, l.label, l.rtl?1:0, l.enabled?1:0]
    );
  }
  res.json({ success: true });
});

router.delete('/:code', adminMiddleware, async (req, res) => {
  const db = await getPool();
  await db.execute('DELETE FROM languages WHERE code=?', [req.params.code]);
  res.json({ success: true });
});

module.exports = router;
