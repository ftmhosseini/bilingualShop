const router = require('express').Router();
const { getPool } = require('../db');
const { adminMiddleware } = require('../middleware');

// GET all providers
router.get('/', adminMiddleware, async (req, res) => {
  const db = await getPool();
  const [rows] = await db.execute('SELECT id, channel, provider, api_key, config, is_active FROM messaging_providers ORDER BY channel, provider');
  // Mask api_key for display (show last 4 chars only)
  const masked = rows.map(r => ({
    ...r,
    api_key_masked: r.api_key ? '••••' + r.api_key.slice(-4) : '',
    config: r.config ? (typeof r.config === 'string' ? JSON.parse(r.config) : r.config) : {},
  }));
  res.json(masked);
});

// POST create/update a provider
router.post('/', adminMiddleware, async (req, res) => {
  const { channel, provider, api_key, config, is_active } = req.body;
  if (!channel || !provider) return res.status(400).json({ error: 'channel and provider required' });

  const db = await getPool();
  await db.execute(
    `INSERT INTO messaging_providers (channel, provider, api_key, config, is_active)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE api_key=VALUES(api_key), config=VALUES(config), is_active=VALUES(is_active)`,
    [channel, provider, api_key || '', JSON.stringify(config || {}), is_active !== undefined ? (is_active ? 1 : 0) : 1]
  );
  res.json({ success: true });
});

// DELETE a provider
router.delete('/:id', adminMiddleware, async (req, res) => {
  const db = await getPool();
  await db.execute('DELETE FROM messaging_providers WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
