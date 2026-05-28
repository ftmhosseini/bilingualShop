const router = require('express').Router();
const { getPool } = require('../db');
const { adminMiddleware } = require('../middleware');

function buildTree(rows, parentId = null) {
  return rows
    .filter(r => r.parent_id === parentId)
    .map(r => ({ ...r, children: buildTree(rows, r.id) }));
}

function parseNames(row) {
  try { row.names = typeof row.names === 'string' ? JSON.parse(row.names) : (row.names || {}); } catch { row.names = {}; }
  return row;
}

// GET tree
router.get('/', async (req, res) => {
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM categories ORDER BY id');
  res.json(buildTree(rows.map(parseNames)));
});

// GET flat with breadcrumbs (lang-aware)
router.get('/flat', async (req, res) => {
  const lang = req.query.lang || 'en';
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM categories ORDER BY id');
  const parsed = rows.map(parseNames);
  const map = Object.fromEntries(parsed.map(r => [r.id, r]));
  function localName(r) { return r.names?.[lang] || r.names?.en || r.name; }
  function breadcrumb(id) {
    const parts = [];
    let cur = map[id];
    while (cur) { parts.unshift(localName(cur)); cur = map[cur.parent_id]; }
    return parts.join(' › ');
  }
  res.json(parsed.map(r => ({ id: r.id, label: breadcrumb(r.id), parent_id: r.parent_id, names: r.names, name: r.name })));
});

// POST create
router.post('/', adminMiddleware, async (req, res) => {
  const { name, parent_id, names } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const db = await getPool();
  const [r] = await db.execute(
    'INSERT INTO categories (name, parent_id, names) VALUES (?,?,?)',
    [name.trim(), parent_id || null, JSON.stringify(names || { en: name.trim() })]
  );
  res.json({ id: r.insertId });
});

// PUT rename + translations
router.put('/:id', adminMiddleware, async (req, res) => {
  const { name, names } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const db = await getPool();
  await db.execute('UPDATE categories SET name=?, names=? WHERE id=?',
    [name.trim(), JSON.stringify(names || { en: name.trim() }), req.params.id]);
  res.json({ success: true });
});

// DELETE
router.delete('/:id', adminMiddleware, async (req, res) => {
  const db = await getPool();
  await db.execute('DELETE FROM categories WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
