const router = require('express').Router();
const { adminMiddleware } = require('../middleware');
const { getPool } = require('../db');

// List all users
router.get('/users', adminMiddleware, async (req, res) => {
  const db = await getPool();
  const [rows] = await db.execute('SELECT id, email, role FROM users');
  res.json(rows);
});

// Change a user's role — also mark as verified
router.put('/users/:id/role', adminMiddleware, async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'cooperatore', 'customer'].includes(role))
    return res.status(400).json({ error: 'Invalid role' });
  if (parseInt(req.params.id) === req.user.id)
    return res.status(403).json({ error: 'Cannot change your own role' });
  const db = await getPool();
  await db.execute('UPDATE users SET role = ?, verified = 1 WHERE id = ?', [role, req.params.id]);
  res.json({ message: 'Role updated' });
});

module.exports = router;
