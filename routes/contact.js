const router = require('express').Router();
const { getPool } = require('../db');

router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !message) return res.status(400).json({ error: 'Name and message required' });
  const db = await getPool();
  await db.execute('INSERT INTO contact_messages (name, email, subject, message) VALUES (?,?,?,?)', [name, email, subject, message]);
  res.json({ success: true });
});

// Admin: get all messages
router.get('/', require('../middleware').adminMiddleware, async (req, res) => {
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM contact_messages ORDER BY created_at DESC');
  res.json(rows);
});

module.exports = router;
