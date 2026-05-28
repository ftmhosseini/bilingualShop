const router = require('express').Router();
const { adminMiddleware } = require('../middleware');
const { getPool } = require('../db');

router.get('/', async (req, res) => {
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM languages ORDER BY sort_order');
  res.json(rows);
});

// PUT update languages (admin)
router.put('/', adminMiddleware, async (req, res) => {
  const db = await getPool();
  const langs = req.body; // array of {code, label, flag, enabled, sort_order}
  for (const l of langs) {
    if (!l.code) continue;
    await db.execute(
      'INSERT INTO languages (code, label, flag, rtl, enabled, sort_order) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE label=?, flag=?, rtl=?, enabled=?, sort_order=?',
      [l.code, l.label, l.flag||'', l.rtl?1:0, l.enabled?1:0, l.sort_order||0, l.label, l.flag||'', l.rtl?1:0, l.enabled?1:0, l.sort_order||0]
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
