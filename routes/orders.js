const router = require('express').Router();
const { authMiddleware } = require('../middleware');
const { getPool } = require('../db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const receiptUpload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => cb(null, 'receipt-' + Date.now() + path.extname(file.originalname)),
  }),
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

// Load and run a payment plugin by currency
function loadPlugin(filename) {
  const pluginPath = path.join(__dirname, '../plugins', filename);
  if (!fs.existsSync(pluginPath)) throw new Error('Plugin file not found');
  if (path.extname(filename).toLowerCase() === '.php') {
    const { makePhpPlugin } = require('../plugins/php-runner');
    return makePhpPlugin(pluginPath);
  }
  return require(pluginPath);
}

async function runPaymentPlugin(currency, order, config) {
  return loadPlugin(config._filename).charge(order, config);
}

async function verifyPaymentPlugin(currency, params, config) {
  return loadPlugin(config._filename).verify(params, config);
}

// Initiate gateway payment — returns redirect_url
router.post('/initiate-payment', authMiddleware, async (req, res) => {
  const { order_id, currency } = req.body;
  const db = await getPool();
  const [[order]] = await db.execute('SELECT * FROM orders WHERE id=?', [order_id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const [plugins] = await db.execute(
    'SELECT * FROM plugins WHERE type=? AND active=1 AND (currency_code=? OR currency_code IS NULL) ORDER BY (currency_code=?) DESC LIMIT 1',
    ['payment', currency, currency]
  );
  if (!plugins.length) return res.status(404).json({ error: 'No active payment plugin for this currency' });

  const plugin = plugins[0];
  const config = { ...(typeof plugin.config === 'string' ? JSON.parse(plugin.config) : plugin.config), _filename: plugin.filename };

  try {
    const result = await runPaymentPlugin(currency, { id: order.id, total: order.total, email: order.user_email }, config);
    res.json(result); // { redirect_url, authority }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Verify payment callback
router.get('/verify-payment', async (req, res) => {
  const { order_id, currency, Authority, Status, amount } = req.query;
  const db = await getPool();

  const [plugins] = await db.execute(
    'SELECT * FROM plugins WHERE type=? AND active=1 AND (currency_code=? OR currency_code IS NULL) ORDER BY (currency_code=?) DESC LIMIT 1',
    ['payment', currency, currency]
  );
  if (!plugins.length) return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders?error=no_plugin`);

  const plugin = plugins[0];
  const config = { ...(typeof plugin.config === 'string' ? JSON.parse(plugin.config) : plugin.config), _filename: plugin.filename };

  try {
    const result = await verifyPaymentPlugin(currency, { Authority, Status, amount, order_id }, config);
    if (result.success) {
      await db.execute('UPDATE orders SET payment_status=?, notes=CONCAT(IFNULL(notes,""), ?) WHERE id=?',
        ['paid', ` | Ref: ${result.ref_id}`, order_id]);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders?paid=1&ref=${result.ref_id}`);
    }
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders?error=payment_failed`);
  } catch (e) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders?error=${encodeURIComponent(e.message)}`);
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { items, total, shipping, payment_method, notes, shipping_method } = req.body;
  const db = await getPool();
  const [result] = await db.execute(
    `INSERT INTO orders (user_email, total, payment_method, payment_status,
      shipping_name, shipping_address, shipping_city, shipping_country, shipping_postal, shipping_phone, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [req.user.email || req.user.phone, total, `${payment_method} / ${shipping_method || ''}`, 'pending',
     shipping.name, shipping.address, shipping.city, shipping.country, shipping.postal, shipping.phone, notes || null]
  );
  const orderId = result.insertId;
  for (const item of items)
    await db.execute('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?,?,?,?)',
      [orderId, item.product_id, item.quantity, item.price]);
  res.json({ id: orderId });
});

router.get('/my', authMiddleware, async (req, res) => {
  const db = await getPool();
  const identifier = req.user.email || req.user.phone;
  const [orders] = await db.execute('SELECT * FROM orders WHERE user_email = ? ORDER BY created_at DESC', [identifier]);
  res.json(orders);
});

// Admin/shopkeeper: all orders
router.get('/all', require('../middleware').shopMiddleware, async (req, res) => {
  const db = await getPool();
  const [orders] = await db.execute('SELECT * FROM orders ORDER BY created_at DESC');
  res.json(orders);
});

// Update order status
router.put('/:id/status', require('../middleware').shopMiddleware, async (req, res) => {
  const db = await getPool();
  await db.execute('UPDATE orders SET status=? WHERE id=?', [req.body.status, req.params.id]);
  res.json({ success: true });
});

router.post('/check-availability', async (req, res) => {
  const { items, currency } = req.body; // items: [{product_id, name}]
  const db = await getPool();
  const unavailable = [];
  for (const item of items) {
    const [[p]] = await db.execute('SELECT stock, available_currencies FROM products WHERE id=?', [item.product_id]);
    if (!p) { unavailable.push(item.name || `Product #${item.product_id}`); continue; }
    const allowed = (p.available_currencies || '').split(',').map(s => s.trim()).filter(Boolean);
    if (allowed.length > 0 && !allowed.includes(currency)) {
      unavailable.push(item.name || `Product #${item.product_id}`);
    }
  }
  if (unavailable.length > 0) return res.json({ ok: false, unavailable });
  res.json({ ok: true });
});

// GET payment info based on currency (card for IRR, PayPal for others)
router.get('/payment-info', async (req, res) => {
  const { currency } = req.query;
  const db = await getPool();
  const [rows] = await db.execute(
    "SELECT key_name, value FROM site_settings WHERE key_name IN ('card_number','card_holder','paypal_email')"
  );
  const s = {};
  rows.forEach(r => s[r.key_name] = r.value);
  if (currency === 'IRR') {
    res.json({ type: 'card', card_number: s.card_number || '', card_holder: s.card_holder || '' });
  } else {
    res.json({ type: 'paypal', paypal_email: s.paypal_email || '' });
  }
});

// POST receipt image for an order
router.post('/:id/receipt', authMiddleware, receiptUpload.single('receipt'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const url = `/uploads/${req.file.filename}`;
  const db = await getPool();
  await db.execute('UPDATE orders SET receipt_url=?, payment_status=? WHERE id=?', [url, 'receipt_uploaded', req.params.id]);
  res.json({ url });
});

module.exports = router;
