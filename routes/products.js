const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { getPool } = require('../db');
const { shopMiddleware } = require('../middleware');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.fieldname + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Merge old name_fa/name_ar into names JSON (migration helper)
function mergeNames(row) {
  let names = {};
  try { names = JSON.parse(row.names || '{}'); } catch {}
  if (row.name) names.en = names.en || row.name;
  if (row.name_fa) names.fa = names.fa || row.name_fa;
  if (row.name_ar) names.ar = names.ar || row.name_ar;
  let descs = {};
  try { descs = JSON.parse(row.descriptions || '{}'); } catch {}
  if (row.description) descs.en = descs.en || row.description;
  if (row.description_fa) descs.fa = descs.fa || row.description_fa;
  if (row.description_ar) descs.ar = descs.ar || row.description_ar;
  return { ...row, names, descriptions: descs };
}

// GET all products with prices and media
router.get('/', async (req, res) => {
  const db = await getPool();
  const [products] = await db.execute('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC');
  const [prices] = await db.execute('SELECT * FROM product_prices');
  const [media] = await db.execute('SELECT * FROM product_media ORDER BY sort_order');
  const result = products.map(p => {
    const merged = mergeNames(p);
    const productPrices = prices.filter(pr => pr.product_id === p.id).map(pr => ({
      ...pr,
      discount_pct: pr.sale_price && pr.sale_price < pr.price ? Math.round((1 - pr.sale_price / pr.price) * 100) : null,
    }));
    const productMedia = media.filter(m => m.product_id === p.id);
    return {
      ...merged,
      prices: productPrices,
      max_discount_pct: Math.max(0, ...productPrices.map(pr => pr.discount_pct || 0)),
      media: productMedia,
      banner: productMedia.find(m => m.is_banner) || productMedia[0] || null,
    };
  });
  res.json(result);
});

// GET single product
router.get('/:id', async (req, res) => {
  const db = await getPool();
  const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  const merged = mergeNames(rows[0]);
  const [prices] = await db.execute('SELECT * FROM product_prices WHERE product_id = ?', [req.params.id]);
  const [media] = await db.execute('SELECT * FROM product_media WHERE product_id = ? ORDER BY sort_order', [req.params.id]);
  res.json({ ...merged, prices, media, banner: media.find(m => m.is_banner) || media[0] || null });
});

// POST create product
router.post('/', shopMiddleware, upload.array('media', 20), async (req, res) => {
  const { names, descriptions, stock, prices, banner_index, video_urls, discount_type, discount_value, category_id } = req.body;
  const namesObj = JSON.parse(names || '{}');
  const descsObj = JSON.parse(descriptions || '{}');
  const db = await getPool();
  const [result] = await db.execute(
    'INSERT INTO products (name, name_fa, name_ar, description, description_fa, description_ar, names, descriptions, stock, discount_type, discount_value, category_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    [namesObj.en||'', namesObj.fa||'', namesObj.ar||'', descsObj.en||'', descsObj.fa||'', descsObj.ar||'',
     JSON.stringify(namesObj), JSON.stringify(descsObj),
     stock || 0, discount_type || 'none', discount_value || 0, category_id || null]
  );
  const productId = result.insertId;
  for (const p of JSON.parse(prices || '[]')) {
    if (p.currency && p.price)
      await db.execute('INSERT INTO product_prices (product_id, currency, price, sale_price, langs) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE price=?, sale_price=?, langs=?',
        [productId, p.currency, p.price, p.sale_price || null, JSON.stringify(p.langs||[]), p.price, p.sale_price || null, JSON.stringify(p.langs||[])]);
  }
  const files = req.files || [];
  const bannerIdx = parseInt(banner_index) || 0;
  for (let i = 0; i < files.length; i++)
    await db.execute('INSERT INTO product_media (product_id, url, type, is_banner, sort_order) VALUES (?,?,?,?,?)',
      [productId, `/uploads/${files[i].filename}`, 'image', i === bannerIdx ? 1 : 0, i]);
  for (const v of JSON.parse(video_urls || '[]'))
    if (v) await db.execute('INSERT INTO product_media (product_id, url, type, is_banner, sort_order) VALUES (?,?,?,?,?)',
      [productId, v, 'video', 0, 999]);
  res.json({ id: productId });
});

// PUT update product
router.put('/:id', shopMiddleware, upload.array('media', 20), async (req, res) => {
  const { names, descriptions, stock, prices, banner_media_id, video_urls, delete_media_ids, discount_type, discount_value, category_id } = req.body;
  const namesObj = JSON.parse(names || '{}');
  const descsObj = JSON.parse(descriptions || '{}');
  const db = await getPool();
  await db.execute(
    'UPDATE products SET name=?, name_fa=?, name_ar=?, description=?, description_fa=?, description_ar=?, names=?, descriptions=?, stock=?, discount_type=?, discount_value=?, category_id=? WHERE id=?',
    [namesObj.en||'', namesObj.fa||'', namesObj.ar||'', descsObj.en||'', descsObj.fa||'', descsObj.ar||'',
     JSON.stringify(namesObj), JSON.stringify(descsObj),
     stock, discount_type || 'none', discount_value || 0, category_id || null, req.params.id]
  );
  for (const p of JSON.parse(prices || '[]'))
    if (p.currency && p.price)
      await db.execute('INSERT INTO product_prices (product_id, currency, price, sale_price, langs) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE price=?, sale_price=?, langs=?',
        [req.params.id, p.currency, p.price, p.sale_price || null, JSON.stringify(p.langs||[]), p.price, p.sale_price || null, JSON.stringify(p.langs||[])]);
  for (const mid of JSON.parse(delete_media_ids || '[]'))
    await db.execute('DELETE FROM product_media WHERE id=? AND product_id=?', [mid, req.params.id]);
  const files = req.files || [];
  const [[{ cnt }]] = await db.execute('SELECT COUNT(*) as cnt FROM product_media WHERE product_id=?', [req.params.id]);
  for (let i = 0; i < files.length; i++)
    await db.execute('INSERT INTO product_media (product_id, url, type, is_banner, sort_order) VALUES (?,?,?,?,?)',
      [req.params.id, `/uploads/${files[i].filename}`, 'image', 0, cnt + i]);
  for (const v of JSON.parse(video_urls || '[]'))
    if (v) await db.execute('INSERT INTO product_media (product_id, url, type, is_banner, sort_order) VALUES (?,?,?,?,?)',
      [req.params.id, v, 'video', 0, 999]);
  if (banner_media_id) {
    await db.execute('UPDATE product_media SET is_banner=0 WHERE product_id=?', [req.params.id]);
    await db.execute('UPDATE product_media SET is_banner=1 WHERE id=? AND product_id=?', [banner_media_id, req.params.id]);
  }
  res.json({ success: true });
});

// DELETE product
router.delete('/:id', shopMiddleware, async (req, res) => {
  const db = await getPool();
  await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
