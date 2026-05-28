const router = require('express').Router();
const { adminMiddleware } = require('../middleware');
const { getPool } = require('../db');

// GET all translations for a language as {key: value}
router.get('/:lang', async (req, res) => {
  const db = await getPool();
  const [rows] = await db.execute('SELECT key_name, value FROM translations WHERE lang=?', [req.params.lang]);
  const result = {};
  rows.forEach(r => result[r.key_name] = r.value);
  res.json(result);
});

// PUT upsert a single translation key
router.put('/:lang/:key', adminMiddleware, async (req, res) => {
  const db = await getPool();
  await db.execute(
    'INSERT INTO translations (lang, key_name, value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value=?',
    [req.params.lang, req.params.key, req.body.value, req.body.value]
  );
  res.json({ success: true });
});

// PUT bulk upsert
router.put('/:lang', adminMiddleware, async (req, res) => {
  const db = await getPool();
  for (const [key, value] of Object.entries(req.body)) {
    await db.execute(
      'INSERT INTO translations (lang, key_name, value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value=?',
      [req.params.lang, key, value, value]
    );
  }
  res.json({ success: true });
});

module.exports = router;
