const router = require('express').Router();
const { adminMiddleware } = require('../middleware');
const { getPool } = require('../db');

router.get('/', async (req, res) => {
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM currencies ORDER BY sort_order');
  res.json(rows);
});

router.put('/', adminMiddleware, async (req, res) => {
  const db = await getPool();
  const items = req.body; // array
  await db.execute('DELETE FROM currencies');
  for (let i = 0; i < items.length; i++) {
    const c = items[i];
    if (!c.currency_code || !c.language_code) continue;
    await db.execute(
      'INSERT INTO currencies (language_code, country, flag, currency_code, symbol, active, sort_order, fraction_digits) VALUES (?,?,?,?,?,?,?,?)',
      [c.language_code, c.country || '', c.flag || '', c.currency_code, c.symbol || '', c.active ? 1 : 0, i, c.fraction_digits ?? 2]
    );
  }
  res.json({ success: true });
});

module.exports = router;
