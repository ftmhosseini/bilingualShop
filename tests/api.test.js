const request = require('supertest');
const { initDB, getPool } = require('../db');
const app = require('../app');

let db;
let adminToken;
let customerToken;
const TEST_EMAIL = `test_${Date.now()}@test.com`;
const TEST_PASS = 'TestPass123';

beforeAll(async () => {
  db = await initDB();
  // Login as admin to get token
  const res = await request(app)
    .post('/api/auth/login')
    .send({ identifier: process.env.ADMIN_EMAIL || 'admin@nuttymilk.com', password: process.env.ADMIN_PASSWORD || 'admin123' });
  adminToken = res.body.token;
});

afterAll(async () => {
  // Cleanup test user
  await db.execute('DELETE FROM users WHERE email = ?', [TEST_EMAIL]).catch(() => {});
  const pool = await getPool();
  await pool.end();
});

// ─── AUTH: Register ──────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ identifier: TEST_EMAIL, password: TEST_PASS });
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  it('should reject duplicate registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ identifier: TEST_EMAIL, password: TEST_PASS });
    expect(res.status).toBe(409);
  });
});

// ─── AUTH: Login ─────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    // Mark test user as verified so login works
    await db.execute('UPDATE users SET verified = 1 WHERE email = ?', [TEST_EMAIL]);
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: TEST_EMAIL, password: TEST_PASS });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe('customer');
    customerToken = res.body.token;
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: TEST_EMAIL, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('should reject non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'nobody@test.com', password: 'x' });
    expect(res.status).toBe(401);
  });
});

// ─── AUTH: Profile ───────────────────────────────────────────────────────────

describe('GET /api/auth/profile', () => {
  it('should return profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(TEST_EMAIL);
  });

  it('should reject without token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });
});

// ─── LANGUAGES ───────────────────────────────────────────────────────────────

describe('Languages API', () => {
  const testLangs = [
    { code: 'en', label: 'English', flag: '🇬🇧', rtl: false, enabled: true, sort_order: 1 },
    { code: 'fa', label: 'فارسی', flag: '🇮🇷', rtl: true, enabled: true, sort_order: 2 },
    { code: 'ar', label: 'العربية', flag: '🇸🇦', rtl: true, enabled: true, sort_order: 3 },
  ];

  it('PUT /api/languages — admin can add languages', async () => {
    const res = await request(app)
      .put('/api/languages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(testLangs);
    expect(res.status).toBe(200);
  });

  it('GET /api/languages — returns all languages', async () => {
    const res = await request(app).get('/api/languages');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const codes = res.body.map(l => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('fa');
  });

  it('PUT /api/languages — rejects non-admin', async () => {
    const res = await request(app)
      .put('/api/languages')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(testLangs);
    expect(res.status).toBe(403);
  });
});

// ─── CURRENCIES ──────────────────────────────────────────────────────────────

describe('Currencies API', () => {
  const testCurrencies = [
    { language_code: 'en', country: 'Canada', flag: '🇨🇦', currency_code: 'CAD', symbol: '$', active: true, sort_order: 1, fraction_digits: 2 },
    { language_code: 'fa', country: 'Iran', flag: '🇮🇷', currency_code: 'IRR', symbol: '﷼', active: true, sort_order: 2, fraction_digits: 0 },
  ];

  it('PUT /api/currencies — admin can set currencies', async () => {
    const res = await request(app)
      .put('/api/currencies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(testCurrencies);
    expect(res.status).toBe(200);
  });

  it('GET /api/currencies — returns all currencies', async () => {
    const res = await request(app).get('/api/currencies');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const codes = res.body.map(c => c.currency_code);
    expect(codes).toContain('CAD');
    expect(codes).toContain('IRR');
  });

  it('PUT /api/currencies — rejects non-admin', async () => {
    const res = await request(app)
      .put('/api/currencies')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(testCurrencies);
    expect(res.status).toBe(403);
  });
});

// ─── ORDERS (Checkout) ───────────────────────────────────────────────────────

describe('Orders API (Checkout)', () => {
  let productId;
  let orderId;

  beforeAll(async () => {
    // Create a test product
    const [result] = await db.execute(
      "INSERT INTO products (name, price, stock, names) VALUES (?, ?, ?, ?)",
      ['Test Milk', 9.99, 100, JSON.stringify({ en: 'Test Milk', fa: 'شیر تست' })]
    );
    productId = result.insertId;
    await db.execute(
      "INSERT INTO product_prices (product_id, currency, price) VALUES (?, ?, ?)",
      [productId, 'CAD', 9.99]
    );
  });

  afterAll(async () => {
    if (orderId) {
      await db.execute('DELETE FROM order_items WHERE order_id = ?', [orderId]).catch(() => {});
      await db.execute('DELETE FROM orders WHERE id = ?', [orderId]).catch(() => {});
    }
    await db.execute('DELETE FROM product_prices WHERE product_id = ?', [productId]).catch(() => {});
    await db.execute('DELETE FROM products WHERE id = ?', [productId]).catch(() => {});
  });

  it('POST /api/orders — creates an order', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ product_id: productId, quantity: 2, price: 9.99 }],
        total: 19.98,
        payment_method: 'cod',
        shipping_method: 'standard',
        shipping: {
          name: 'Test User',
          address: '123 Test St',
          city: 'Toronto',
          country: 'CA',
          postal: 'M5V1A1',
          phone: '+14165551234',
        },
        notes: 'Test order',
      });
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    orderId = res.body.id;
  });

  it('GET /api/orders/my — returns user orders', async () => {
    const res = await request(app)
      .get('/api/orders/my')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('POST /api/orders — rejects without auth', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ items: [], total: 0 });
    expect(res.status).toBe(401);
  });
});

// ─── SHIPPING ────────────────────────────────────────────────────────────────

describe('POST /api/shipping/rates', () => {
  it('should return rates array (may be empty without Shippo key)', async () => {
    const res = await request(app)
      .post('/api/shipping/rates')
      .send({
        toAddress: {
          name: 'Test',
          street: '123 Main St',
          city: 'Toronto',
          state: 'ON',
          zip: 'M5V1A1',
          country_code: 'CA',
        },
        parcel: { length: 20, width: 15, height: 10, weight: 1 },
      });
    // Should return 200 with an array (empty if no Shippo key configured)
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should handle Iranian shipping', async () => {
    const res = await request(app)
      .post('/api/shipping/rates')
      .send({
        toAddress: {
          name: 'تست',
          street: 'خیابان آزادی',
          city: 'تهران',
          province: 'تهران',
          zip: '1234567890',
          country_code: 'IR',
        },
        parcel: { length: 20, width: 15, height: 10, weight: 1 },
      });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
