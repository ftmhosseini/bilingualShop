const router = require('express').Router();
const { adminMiddleware } = require('../middleware');
const { getPool } = require('../db');

router.get('/:lang', async (req, res) => {
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM faq WHERE lang=? ORDER BY sort_order', [req.params.lang]);
  res.json(rows);
});

router.post('/', adminMiddleware, async (req, res) => {
  const { lang, question, answer, sort_order } = req.body;
  const db = await getPool();
  const [r] = await db.execute('INSERT INTO faq (lang, question, answer, sort_order) VALUES (?,?,?,?)', [lang, question, answer, sort_order || 0]);
  res.json({ id: r.insertId });
});

router.put('/:id', adminMiddleware, async (req, res) => {
  const { question, answer, sort_order } = req.body;
  const db = await getPool();
  await db.execute('UPDATE faq SET question=?, answer=?, sort_order=? WHERE id=?', [question, answer, sort_order || 0, req.params.id]);
  res.json({ success: true });
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  const db = await getPool();
  await db.execute('DELETE FROM faq WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
