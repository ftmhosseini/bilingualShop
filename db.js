require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

let pool;

async function getPool() {
  if (pool) return pool;
  if (process.env.DATABASE_URL) {
    pool = mysql.createPool(process.env.DATABASE_URL);
  } else {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'nuttymilk',
      waitForConnections: true,
    });
  }
  return pool;
}


async function initDB() {
  const db = await getPool();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin','cooperatore','customer') DEFAULT 'customer'
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      name_fa VARCHAR(255),
      name_ar VARCHAR(255),
      description TEXT,
      description_fa TEXT,
      description_ar TEXT,
      image VARCHAR(255),
      image_fa VARCHAR(255),
      image_ar VARCHAR(255),
      stock INT DEFAULT 0,
      available_currencies VARCHAR(255) DEFAULT ''
    )
  `);
  await db.execute(`ALTER TABLE products ADD COLUMN available_currencies VARCHAR(255) DEFAULT ''`).catch(() => {});

  await db.execute(`
    CREATE TABLE IF NOT EXISTS product_prices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      currency VARCHAR(10) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      UNIQUE KEY unique_product_currency (product_id, currency),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_email VARCHAR(255),
      total DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT,
      product_id INT,
      quantity INT,
      price DECIMAL(10,2),
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS plugins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type ENUM('payment','shipping') NOT NULL,
      currency_code VARCHAR(10),
      filename VARCHAR(255) NOT NULL,
      config JSON,
      active TINYINT DEFAULT 1
    )
  `);

  // Migrations — safely add columns that may not exist in older installs
  const migrations = [
    ["users", "phone", "VARCHAR(50)"],
    ["users", "verified", "TINYINT DEFAULT 0"],
    ["users", "verify_code", "VARCHAR(10)"],
    ["users", "verify_expires", "DATETIME"],
    ["users", "first_name", "VARCHAR(100)"],
    ["users", "last_name", "VARCHAR(100)"],
    ["users", "username", "VARCHAR(100) UNIQUE"],
    ["products", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP"],
    ["products", "discount_type", "VARCHAR(20) DEFAULT 'none'"],
    ["products", "discount_value", "DECIMAL(10,2) DEFAULT 0"],
    ["products", "names", "JSON"],
    ["products", "descriptions", "JSON"],
    ["product_prices", "sale_price", "DECIMAL(10,2)"],
    ["product_prices", "langs", "JSON"],
    ["orders", "payment_method", "VARCHAR(100)"],
    ["orders", "payment_status", "VARCHAR(50) DEFAULT 'pending'"],
    ["orders", "shipping_name", "VARCHAR(255)"],
    ["orders", "shipping_address", "VARCHAR(255)"],
    ["orders", "shipping_city", "VARCHAR(100)"],
    ["orders", "shipping_country", "VARCHAR(100)"],
    ["orders", "shipping_postal", "VARCHAR(20)"],
    ["orders", "shipping_phone", "VARCHAR(50)"],
    ["orders", "notes", "TEXT"],
    ["orders", "receipt_url", "VARCHAR(500)"],
    ["products", "category_id", "INT"],
  ];
  for (const [table, column, definition] of migrations) {
    const [cols] = await db.execute(`SHOW COLUMNS FROM \`${table}\` LIKE '${column}'`);
    if (cols.length === 0) {
      await db.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`).catch(() => {});
    }
  }

  // categories table (tree structure)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      parent_id INT DEFAULT NULL,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);
  // Add missing columns if upgrading from old schema
  {
    const [cols] = await db.execute("SHOW COLUMNS FROM `categories`");
    const colNames = cols.map(c => c.Field);
    if (!colNames.includes('name')) {
      await db.execute("ALTER TABLE categories ADD COLUMN name VARCHAR(100) NOT NULL DEFAULT ''");
    }
    if (!colNames.includes('parent_id')) {
      await db.execute("ALTER TABLE categories ADD COLUMN parent_id INT DEFAULT NULL");
    }
    // migrate old flat columns to tree rows
    if (colNames.includes('level1')) {
      const [rows] = await db.execute('SELECT * FROM categories WHERE name = ""');
      for (const r of rows) {
        if (!r.level1) continue;
        await db.execute('UPDATE categories SET name=? WHERE id=?', [r.level1, r.id]);
        // level2/level3 become child rows
        if (r.level2) {
          const [r2] = await db.execute('INSERT INTO categories (name, parent_id) VALUES (?,?)', [r.level2, r.id]);
          if (r.level3) {
            await db.execute('INSERT INTO categories (name, parent_id) VALUES (?,?)', [r.level3, r2.insertId]);
          }
        }
      }
      await db.execute('ALTER TABLE categories DROP COLUMN level1').catch(() => {});
      await db.execute('ALTER TABLE categories DROP COLUMN level2').catch(() => {});
      await db.execute('ALTER TABLE categories DROP COLUMN level3').catch(() => {});
    }
  }

    // Add names JSON column to categories if missing
    {
      const [cols] = await db.execute("SHOW COLUMNS FROM `categories` LIKE 'names'");
      if (cols.length === 0) {
        await db.execute("ALTER TABLE categories ADD COLUMN names JSON").catch(() => {});
      }
    }
  await db.execute(`
    CREATE TABLE IF NOT EXISTS product_media (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      url VARCHAR(500) NOT NULL,
      type VARCHAR(20) DEFAULT 'image',
      is_banner TINYINT DEFAULT 0,
      sort_order INT DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // site_settings table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key_name VARCHAR(100) PRIMARY KEY,
      value TEXT
    )
  `);

  // languages table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS languages (
      code VARCHAR(10) PRIMARY KEY,
      label VARCHAR(50),
      rtl TINYINT DEFAULT 0,
      enabled TINYINT DEFAULT 1
    )
  `);

  // currencies table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS currencies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      language_code VARCHAR(10),
      country VARCHAR(100),
      flag VARCHAR(10),
      currency_code VARCHAR(10),
      symbol VARCHAR(10),
      checkout_symbol VARCHAR(20) DEFAULT '',
      differ DECIMAL(10,4) DEFAULT 1,
      active TINYINT DEFAULT 1,
      fraction_digits TINYINT DEFAULT 2,
      sort_order INT DEFAULT 0
    )
  `);
  // add columns to existing installs (ignore error if column already exists)
  await db.execute(`ALTER TABLE currencies ADD COLUMN fraction_digits TINYINT DEFAULT 2`).catch(() => {});
  await db.execute(`ALTER TABLE currencies ADD COLUMN sort_order INT DEFAULT 0`).catch(() => {});
  await db.execute(`ALTER TABLE currencies ADD COLUMN checkout_symbol VARCHAR(20) DEFAULT ''`).catch(() => {});
  await db.execute(`ALTER TABLE currencies ADD COLUMN differ DECIMAL(10,4) DEFAULT 1`).catch(() => {});

  // nav_links table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS nav_links (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lang VARCHAR(10),
      label VARCHAR(100),
      url VARCHAR(255),
      icon VARCHAR(10) DEFAULT '',
      sort_order INT DEFAULT 0
    )
  `);
  // Add icon column to existing installs
  {
    const [cols] = await db.execute("SHOW COLUMNS FROM `nav_links` LIKE 'icon'");
    if (cols.length === 0) await db.execute("ALTER TABLE nav_links ADD COLUMN icon VARCHAR(10) DEFAULT ''").catch(() => {});
  }

  // translations table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS translations (
      lang VARCHAR(10) NOT NULL,
      key_name VARCHAR(100) NOT NULL,
      value TEXT,
      PRIMARY KEY (lang, key_name)
    )
  `);

  // user_addresses table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_addresses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      label VARCHAR(100),
      name VARCHAR(255),
      address VARCHAR(255),
      city VARCHAR(100),
      province VARCHAR(100),
      country VARCHAR(100),
      postal VARCHAR(20),
      phone VARCHAR(50),
      is_default TINYINT DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // messaging_providers table (email/SMS provider config stored in DB, not .env)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS messaging_providers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      channel ENUM('email','sms') NOT NULL,
      provider VARCHAR(50) NOT NULL,
      api_key VARCHAR(500),
      config JSON,
      is_active TINYINT DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_channel_provider (channel, provider)
    )
  `);

  // page_content table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS page_content (
      id INT AUTO_INCREMENT PRIMARY KEY,
      page VARCHAR(50) NOT NULL,
      lang VARCHAR(10) NOT NULL,
      title VARCHAR(255),
      content TEXT,
      UNIQUE KEY unique_page_lang (page, lang)
    )
  `);

  // Migrate existing categories to add English names JSON if missing
  {
    const enNames = {
      'Plant Milks': 'Plant Milks',
      'Nut Butters': 'Nut Butters',
      'Almond Milk': 'Almond Milk',
      'Oat Milk': 'Oat Milk',
      'Almond Butter': 'Almond Butter',
      'Nutty Milk': 'Nutty Milk',
      'Saffron Pistachio Milk': 'Saffron Pistachio Milk',
      'Saffron Almond Milk': 'Saffron Almond Milk',
      'Saffron Coconut Milk': 'Saffron Coconut Milk',
      'Combo Box': 'Combo Box',
    };
    const [cats] = await db.execute('SELECT id, name, names FROM categories');
    for (const cat of cats) {
      let names = {};
      try { names = JSON.parse(cat.names || '{}'); } catch {}
      if (!names.en && enNames[cat.name]) {
        await db.execute('UPDATE categories SET names=? WHERE id=?', [JSON.stringify({ en: enNames[cat.name] }), cat.id]);
      }
    }
  }

  // Seed site_settings contact info (used by ContactUs page)
  const contactSettings = {
    contact_email: 'info@nuttymilk.com',
    contact_phone: '',
    contact_address: '',
    contact_hours: 'Monday to Friday, 9am to 6pm',
    card_number: '',
    card_holder: '',
    paypal_email: '',
    hero_slides: JSON.stringify([
      {
        title: 'Nutty Milk',
        subtitle: 'The golden blend of milk, saffron & premium nuts — healthy, nutritious, delicious.',
        bg: '#2c1a0e',
        image: '',
        mediaType: 'image',
        height: '100vh',
        fit: 'cover',
        position: 'center',
        link: '/products',
        btnText: 'Order Now',
        langs: [],
      },
    ]),
    button_labels: JSON.stringify({
      addToCart:        { color: '#febd69', labels: { en: 'Add to Cart' } },
      buyNow:           { color: '#f90',    labels: { en: 'Buy Now' } },
      shopNow:          { color: '#f90',    labels: { en: 'Shop Now' } },
      login:            { color: '#232f3e', labels: { en: 'Login' } },
      register:         { color: '#232f3e', labels: { en: 'Register' } },
      logout:           { color: '#c0392b', labels: { en: 'Logout' } },
      save:             { color: '#27ae60', labels: { en: 'Save' } },
      cancel:           { color: '#888888', labels: { en: 'Cancel' } },
      search:           { color: '#232f3e', labels: { en: 'Search' } },
      back:             { color: '#888888', labels: { en: 'Back' } },
      placeOrder:       { color: '#27ae60', labels: { en: 'Place Order' } },
      continueShopping: { color: '#232f3e', labels: { en: 'Continue Shopping' } },
      viewOrders:       { color: '#232f3e', labels: { en: 'View Orders' } },
    }),
    home_tab_labels: JSON.stringify({
      all:   { en: 'All Products' },
      new:   { en: 'New Arrivals' },
      deals: { en: 'Best Deals' },
    }),
    page_titles: JSON.stringify({ title: { en: 'Nutty Milk' } }),
    auth_page_labels: JSON.stringify({
      en: {
        login_title:                  'Login',
        login_identifier:             'Email or Phone',
        login_identifier_placeholder: 'email@example.com or +1234567890',
        login_password:               'Password',
        login_button:                 'Login',
        login_forgot:                 'Forgot Password?',
        login_no_account:             "Don't have an account?",
        register_title:               'Register',
        register_button_short:        'Register',
        register_identifier:          'Email or Phone',
        register_password:            'Password',
        register_button:              'Send Verification Code',
        register_has_account:         'Already have an account?',
        verify_title:                 'Enter the 5-digit code sent to',
        verify_button:                'Verify & Create Account',
        verify_resend:                'Resend Code',
        forgot_title:                 'Forgot Password',
        forgot_button:                'Send Reset Code',
        forgot_back:                  '← Back to Login',
        reset_title:                  'Reset Password',
        reset_code_label:             'Code',
        reset_newpass_label:          'New Password',
        reset_button:                 'Reset Password',
        logout_button:                'Logout',
      },
    }),
  };
  for (const [key, value] of Object.entries(contactSettings)) {
    await db.execute(
      'INSERT IGNORE INTO site_settings (key_name, value) VALUES (?,?)',
      [key, value]
    );
  }

  // faq table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS faq (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lang VARCHAR(10) NOT NULL,
      question TEXT,
      answer TEXT,
      sort_order INT DEFAULT 0
    )
  `);

  // blogs table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS blogs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lang VARCHAR(10) NOT NULL,
      title VARCHAR(500) NOT NULL,
      slug VARCHAR(500),
      excerpt TEXT,
      content LONGTEXT,
      image VARCHAR(500),
      author VARCHAR(100),
      tags VARCHAR(500),
      published_at DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // migration: add tags column if missing
  const [tagsCols] = await db.execute(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='blogs' AND COLUMN_NAME='tags' AND TABLE_SCHEMA=DATABASE()`);
  if (!tagsCols.length) await db.execute(`ALTER TABLE blogs ADD COLUMN tags VARCHAR(500)`);

  // Seed default translations if missing
  const defaultTranslations = [
    ['en', 'successfullyAdded', 'Successfully Added'],
    ['en', 'findUs', 'Find Us'],
    ['en', 'logout', 'Logout'],
    ['en', 'allCategories', 'All Categories'],
    ['en', 'productsCount', '{n} products'],
    ['en', 'cart.title', 'Cart'],
    ['en', 'cart.empty', 'Cart is empty'],
    ['en', 'cart.qty', 'Qty'],
    ['en', 'cart.remove', 'Remove'],
    ['en', 'cart.summary', 'Order Summary'],
    ['en', 'cart.subtotal', 'Subtotal ({n} items)'],
    ['en', 'cart.checkout', 'Proceed to Checkout'],
    ['en', 'cart.clear', 'Clear Cart'],
    ['en', 'cart.unavailable', 'These items are not available in the selected currency: {names}'],
    ['fa', 'cart.title', 'سبد خرید'],
    ['fa', 'cart.empty', 'سبد خرید خالی است'],
    ['fa', 'cart.qty', 'تعداد'],
    ['fa', 'cart.remove', 'حذف'],
    ['fa', 'cart.summary', 'خلاصه سفارش'],
    ['fa', 'cart.subtotal', 'جمع ({n} کالا)'],
    ['fa', 'cart.checkout', 'ادامه و پرداخت'],
    ['fa', 'cart.clear', 'پاک کردن سبد'],
    ['fa', 'cart.unavailable', 'این محصولات در این ارز موجود نیستند: {names}'],
    ['en', 'profile.title', 'Edit Profile'],
    ['en', 'profile.firstName', 'First Name'],
    ['en', 'profile.lastName', 'Last Name'],
    ['en', 'profile.email', 'Email'],
    ['en', 'profile.phone', 'Phone'],
    ['en', 'profile.passwordHint', 'Leave password fields empty to keep current password.'],
    ['en', 'profile.currentPassword', 'Current Password'],
    ['en', 'profile.newPassword', 'New Password'],
    ['en', 'profile.confirmPassword', 'Confirm New Password'],
    ['en', 'profile.saveChanges', 'Save Changes'],
    ['en', 'profile.saved', 'Saved'],
    ['en', 'profile.passwordMismatch', 'New passwords do not match'],
    ['en', 'address.saved', 'Saved Addresses'],
    ['en', 'address.add', '+ Add'],
    ['en', 'address.label', 'Label (e.g. Home, Work)'],
    ['en', 'address.fullName', 'Full Name'],
    ['en', 'address.street', 'Street Address'],
    ['en', 'address.country', 'Country'],
    ['en', 'address.province', 'Province'],
    ['en', 'address.city', 'City'],
    ['en', 'address.postal', 'Postal Code'],
    ['en', 'address.postalZip', 'Postal / ZIP'],
    ['en', 'address.phone', 'Phone'],
    ['en', 'address.setDefault', 'Set as default'],
    ['en', 'address.saveAddress', 'Save Address'],
    ['en', 'address.cancel', 'Cancel'],
    ['en', 'address.default', 'Default'],
    ['en', 'address.edit', 'Edit'],
    ['en', 'address.none', 'No saved addresses yet.'],
  ];
  for (const [lang, key, value] of defaultTranslations) {
    await db.execute(
      'INSERT INTO translations (lang, key_name, value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)',
      [lang, key, value]
    );
  }
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nuttymilk.com';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const [rows] = await db.execute('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (rows.length === 0) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await db.execute("INSERT INTO users (username, email, password, role, verified) VALUES (?, ?, ?, 'admin', 1)", [adminUsername, adminEmail, hash]);
    console.log('Admin user seeded');
  }

  // Seed default languages if none exist
  const [langs] = await db.execute('SELECT code FROM languages LIMIT 1');
  if (langs.length === 0) {
    await db.execute("INSERT INTO languages (code, label, flag, rtl, enabled) VALUES ('en', 'English', '🇺🇸', 0, 1)");
    console.log('Default language (English) seeded');
  }

  // Seed default currencies if none exist
  const [currs] = await db.execute('SELECT id FROM currencies LIMIT 1');
  if (currs.length === 0) {
    await db.execute("INSERT INTO currencies (language_code, country, flag, currency_code, symbol, checkout_symbol, differ, active, fraction_digits, sort_order) VALUES ('en', 'United States', '🇺🇸', 'USD', '$', '$', 1, 1, 2, 0)");
    await db.execute("INSERT INTO currencies (language_code, country, flag, currency_code, symbol, checkout_symbol, differ, active, fraction_digits, sort_order) VALUES ('fa', 'Iran', '🇮🇷', 'IRR', 'تومان', 'ریال', 10, 1, 0, 1)");
    console.log('Default currencies (USD, IRR) seeded');
  }

  // Seed default nav links if none exist
  const [navs] = await db.execute('SELECT id FROM nav_links LIMIT 1');
  if (navs.length === 0) {
    const links = [
      ['en', 'Home', '/', '🏠', 0],
      ['en', 'Products', '/products', '🛍️', 1],
      ['en', 'About Us', '/about', '📖', 2],
      ['en', 'Contact', '/contact', '📞', 3],
      ['en', 'FAQ', '/faq', '❓', 4],
      ['en', 'Blog', '/blog', '📝', 5],
      ['fa', 'خانه', '/', '🏠', 0],
      ['fa', 'محصولات', '/products', '🛒', 1],
      ['fa', 'درباره ما', '/about', '📖', 2],
      ['fa', 'تماس با ما', '/contact', '📞', 3],
      ['fa', 'سوالات متداول', '/faq', '❓', 4],
      ['fa', 'بلاگ', '/blog', '📝', 5],
      ['fa', 'پروفایل', '/profile', '👤', 6],
      ['fa', 'سفارشات', '/orders', '📦', 7],
    ];
    for (const [lang, label, url, icon, sort] of links) {
      await db.execute("INSERT INTO nav_links (lang, label, url, icon, sort_order) VALUES (?,?,?,?,?)", [lang, label, url, icon, sort]);
    }
    console.log('Default nav links seeded');
  } else {
    // Ensure Farsi nav links exist even if English already seeded
    const [faNavs] = await db.execute("SELECT id FROM nav_links WHERE lang='fa' LIMIT 1");
    if (faNavs.length === 0) {
      const faLinks = [
        ['fa', 'خانه', '/', '🏠', 0],
        ['fa', 'محصولات', '/products', '🛒', 1],
        ['fa', 'درباره ما', '/about', '📖', 2],
        ['fa', 'تماس با ما', '/contact', '📞', 3],
        ['fa', 'سوالات متداول', '/faq', '❓', 4],
        ['fa', 'بلاگ', '/blog', '📝', 5],
        ['fa', 'پروفایل', '/profile', '👤', 6],
        ['fa', 'سفارشات', '/orders', '📦', 7],
      ];
      for (const [lang, label, url, icon, sort] of faLinks) {
        await db.execute("INSERT INTO nav_links (lang, label, url, icon, sort_order) VALUES (?,?,?,?,?)", [lang, label, url, icon, sort]);
      }
      console.log('Farsi nav links seeded');
    }
  }

  // Seed categories if none exist
  const [cats] = await db.execute('SELECT id FROM categories LIMIT 1');
  if (cats.length === 0) {
    const [r1] = await db.execute("INSERT INTO categories (name, parent_id, names) VALUES ('Nutty Milk', NULL, ?)", [JSON.stringify({en:'Nutty Milk', fa:'شیرمغز'})]);
    await db.execute("INSERT INTO categories (name, parent_id, names) VALUES ('Saffron Pistachio Milk', ?, ?)", [r1.insertId, JSON.stringify({en:'Saffron Pistachio Milk', fa:'شیر پسته زعفرانی'})]);
    await db.execute("INSERT INTO categories (name, parent_id, names) VALUES ('Saffron Almond Milk', ?, ?)", [r1.insertId, JSON.stringify({en:'Saffron Almond Milk', fa:'شیر بادام زعفرانی'})]);
    await db.execute("INSERT INTO categories (name, parent_id, names) VALUES ('Saffron Coconut Milk', ?, ?)", [r1.insertId, JSON.stringify({en:'Saffron Coconut Milk', fa:'شیر نارگیل زعفرانی'})]);
    await db.execute("INSERT INTO categories (name, parent_id, names) VALUES ('Combo Box', ?, ?)", [r1.insertId, JSON.stringify({en:'Combo Box', fa:'جعبه ترکیبی'})]);
    console.log('Default categories seeded');
  }

  // Seed sample products if none exist
  const [prods] = await db.execute('SELECT id FROM products LIMIT 1');
  if (prods.length === 0) {
    const [catRows] = await db.execute("SELECT id, name FROM categories WHERE parent_id IS NOT NULL");
    const catMap = {};
    for (const c of catRows) catMap[c.name] = c.id;

    const products = [
      {
        name: 'Saffron Pistachio Milk', name_fa: 'شیر پسته زعفرانی',
        desc: 'Box of 15 sachets x 20g, rich in protein, iron and calcium. Ingredients: milk powder, saffron, cream powder, sugar, pistachio powder.',
        desc_fa: 'جعبه ۱۵ عددی ساشه ۲۰ گرمی، سرشار از پروتئین، آهن و کلسیم. مواد تشکیل‌دهنده: پودر شیر، زعفران، پودر خامه، شکر، پودر پسته.',
        stock: 50, price_usd: 12.99, price_irr: 675000, cat: 'Saffron Pistachio Milk',
      },
      {
        name: 'Saffron Almond Milk', name_fa: 'شیر بادام زعفرانی',
        desc: 'Box of 15 sachets x 20g, rich in protein, iron and calcium. Ingredients: milk powder, saffron, cream powder, sugar, almond powder.',
        desc_fa: 'جعبه ۱۵ عددی ساشه ۲۰ گرمی، سرشار از پروتئین، آهن و کلسیم. مواد تشکیل‌دهنده: پودر شیر، زعفران، پودر خامه، شکر، پودر بادام.',
        stock: 45, price_usd: 12.49, price_irr: 660000, cat: 'Saffron Almond Milk',
      },
      {
        name: 'Saffron Coconut Milk', name_fa: 'شیر نارگیل زعفرانی',
        desc: 'Box of 15 sachets x 20g, rich in protein, iron and calcium. Ingredients: milk powder, saffron, cream powder, sugar, coconut powder.',
        desc_fa: 'جعبه ۱۵ عددی ساشه ۲۰ گرمی، سرشار از پروتئین، آهن و کلسیم. مواد تشکیل‌دهنده: پودر شیر، زعفران، پودر خامه، شکر، پودر نارگیل.',
        stock: 60, price_usd: 11.99, price_irr: 650000, cat: 'Saffron Coconut Milk',
      },
      {
        name: 'Nutty Milk Combo Box (Coconut, Almond, Pistachio)', name_fa: 'جعبه ترکیبی شیرمغز (نارگیل، بادام، پسته)',
        desc: 'Box of 15 sachets x 20g with three flavors: coconut, almond and pistachio. Rich in protein, iron and calcium. The perfect gift.',
        desc_fa: 'جعبه ۱۵ عددی ساشه ۲۰ گرمی با سه طعم: نارگیل، بادام و پسته. سرشار از پروتئین، آهن و کلسیم. هدیه‌ای عالی.',
        stock: 30, price_usd: 13.99, price_irr: 670000, cat: 'Combo Box',
      },
    ];

    for (const p of products) {
      const names = JSON.stringify({en: p.name, fa: p.name_fa});
      const descs = JSON.stringify({en: p.desc, fa: p.desc_fa});
      const [r] = await db.execute(
        "INSERT INTO products (name, description, names, descriptions, stock, category_id) VALUES (?,?,?,?,?,?)",
        [p.name, p.desc, names, descs, p.stock, catMap[p.cat] || null]
      );
      await db.execute(
        "INSERT INTO product_prices (product_id, currency, price, langs) VALUES (?, 'USD', ?, ?)",
        [r.insertId, p.price_usd, JSON.stringify(['en'])]
      );
      await db.execute(
        "INSERT INTO product_prices (product_id, currency, price, sale_price, langs) VALUES (?, 'IRR', ?, ?, ?)",
        [r.insertId, p.price_irr, p.price_irr, JSON.stringify(['fa'])]
      );
    }
    console.log('Sample products seeded');
  }

  // Seed English FAQ if none exist
  const [faqs] = await db.execute("SELECT id FROM faq WHERE lang='en' LIMIT 1");
  if (faqs.length === 0) {
    const faqItems = [
      ['Is Nutty Milk good for health?', 'Nutty Milk is made from milk powder, saffron, cream powder, sugar, nut powders (pistachio, almond, coconut), soy lecithin and other permitted food additives. It is rich in protein, iron and calcium, making it great for health and children\'s growth. It is an excellent alternative to coffee since it is caffeine-free and milk-based.', 1],
      ['What packaging keeps Nutty Milk fresh?', 'The best packaging for powdered foods is a 3-layer metallized plastic bag that blocks light, moisture and oxygen, extending shelf life to two years or more.', 2],
      ['How do I identify a quality Nutty Milk?', 'Key quality indicators: proper packaging that blocks moisture, light and air; and knowing the ingredients. A milk-powder-based product has a fine flour-like texture. Our products come with the nut powder separate to prevent the natural oils from affecting the base powder over time.', 3],
      ['What varieties are available?', 'We currently offer: Saffron Pistachio Milk, Saffron Almond Milk, Saffron Coconut Milk, and a Combo Box with all three flavors. Nut powder is packaged separately to preserve product quality.', 4],
      ['What are the main benefits of saffron?', 'Saffron has many benefits: combating depression and boosting mood, enhancing memory and cognition, regulating sleep cycles, treating respiratory disorders, improving skin health, reducing stroke risk, cancer prevention support, preventing Alzheimer\'s, and improving eyesight.', 5],
    ];
    for (const [question, answer, sort] of faqItems) {
      await db.execute("INSERT INTO faq (lang, question, answer, sort_order) VALUES ('en',?,?,?)", [question, answer, sort]);
    }
    console.log('English FAQ seeded');
  }

  // Seed Farsi FAQ if none exist
  const [faFaqs] = await db.execute("SELECT id FROM faq WHERE lang='fa' LIMIT 1");
  if (faFaqs.length === 0) {
    const faFaqItems = [
      ['آیا شیرمغز برای سلامتی مفید است؟', 'شیرمغز از پودر شیر، زعفران، پودر خامه، شکر، پودر مغزها (پسته، بادام، نارگیل)، لسیتین سویا و سایر افزودنی‌های مجاز غذایی تهیه شده است. سرشار از پروتئین، آهن و کلسیم بوده و برای سلامت و رشد کودکان عالی است. جایگزین بسیار خوبی برای قهوه است زیرا بدون کافئین و بر پایه شیر است.', 1],
      ['چه بسته‌بندی‌ای شیرمغز را تازه نگه می‌دارد؟', 'بهترین بسته‌بندی برای مواد غذایی پودری، کیسه پلاستیکی متالایز ۳ لایه است که نور، رطوبت و اکسیژن را مسدود می‌کند و ماندگاری را تا دو سال یا بیشتر افزایش می‌دهد.', 2],
      ['چگونه یک شیرمغز با کیفیت را شناسایی کنم؟', 'شاخص‌های کلیدی کیفیت: بسته‌بندی مناسب که رطوبت، نور و هوا را مسدود کند؛ و شناخت مواد تشکیل‌دهنده. محصول بر پایه پودر شیر بافت آردی نرمی دارد. محصولات ما با پودر مغز جداگانه عرضه می‌شوند تا روغن‌های طبیعی بر پودر پایه تأثیر نگذارند.', 3],
      ['چه طعم‌هایی موجود است؟', 'ما در حال حاضر ارائه می‌دهیم: شیر پسته زعفرانی، شیر بادام زعفرانی، شیر نارگیل زعفرانی، و جعبه ترکیبی با هر سه طعم. پودر مغز به صورت جداگانه بسته‌بندی شده تا کیفیت محصول حفظ شود.', 4],
      ['مزایای اصلی زعفران چیست؟', 'زعفران مزایای بسیاری دارد: مبارزه با افسردگی و بهبود خلق و خو، تقویت حافظه و شناخت، تنظیم چرخه خواب، درمان اختلالات تنفسی، بهبود سلامت پوست، کاهش خطر سکته مغزی، حمایت از پیشگیری از سرطان، پیشگیری از آلزایمر و بهبود بینایی.', 5],
    ];
    for (const [question, answer, sort] of faFaqItems) {
      await db.execute("INSERT INTO faq (lang, question, answer, sort_order) VALUES ('fa',?,?,?)", [question, answer, sort]);
    }
    console.log('Farsi FAQ seeded');
  }

  // Seed English blogs if none exist
  try {
  const [blogRows] = await db.execute("SELECT id FROM blogs WHERE lang='en' LIMIT 1");
  if (blogRows.length === 0) {
    const blogPosts = [
      {
        title: 'Coconut Milk vs Coconut Water vs Nutty Milk',
        slug: 'coconut-milk-vs-coconut-water',
        excerpt: 'Coconut water is a natural energy drink obtained directly from the coconut.',
        content: 'Coconut water is a natural, energizing drink that comes straight from inside a coconut. It is rich in electrolytes, potassium and natural vitamins. Coconut milk, on the other hand, is made from grated coconut flesh and has more fat and calories. Nutty Milk coconut blend is a unique combination of milk powder, saffron and coconut powder — great taste and packed with nutrients.',
        author: 'Nutty Milk Team',
        published_at: '2025-12-23',
      },
      {
        title: 'Pistachio Milk',
        slug: 'pistachio-milk',
        excerpt: 'Pistachio milk is a unique blend of milk powder, saffron and pistachio powder.',
        content: 'Pistachio Milk is one of the most popular Nutty Milk products. This delicious and nutritious drink is made from premium milk powder, pure saffron, cream powder and pistachio powder. It is rich in protein, iron, calcium and saffron antioxidants. Daily consumption supports the immune system, improves memory and boosts energy. Simply dissolve one 20g sachet in a glass of warm milk or warm water.',
        author: 'Nutty Milk Team',
        published_at: '2025-12-23',
      },
      {
        title: 'Tips for the Perfect Saffron Pistachio Milk',
        slug: 'tips-saffron-pistachio-milk',
        excerpt: 'Follow these tips to prepare a perfect, professional saffron pistachio milk.',
        content: 'Tips for the perfect saffron pistachio milk:\n\n1. Temperature: Best dissolving temperature is 60–70°C.\n2. Ratio: Dissolve one 20g sachet in 200ml warm milk or water.\n3. Stirring: Stir well until fully dissolved and smooth.\n4. Nut powder: Add pistachio powder after the base is dissolved.\n5. Serving: Enjoy hot or cold (add ice).',
        author: 'Nutty Milk Team',
        published_at: '2025-09-13',
      },
      {
        title: 'How to Make Homemade Saffron Pistachio Milk',
        slug: 'homemade-saffron-pistachio-milk-recipe',
        excerpt: 'Make a delicious homemade saffron pistachio milk with this simple recipe.',
        content: 'Ingredients:\n- 1 × 20g Nutty Milk Pistachio sachet\n- 200ml milk or water\n- Pistachio powder (included separately)\n\nInstructions:\n1. Heat milk or water to 60–70°C (do not boil).\n2. Gradually add the sachet contents to the warm liquid.\n3. Stir well with a spoon or whisk until smooth.\n4. Add pistachio powder and stir again.\n5. Pour into a cup and enjoy. A sprinkle of cinnamon is a nice touch.',
        author: 'Nutty Milk Team',
        published_at: '2025-09-13',
      },
      {
        title: 'Saffron Quality Standards',
        slug: 'saffron-quality-standards',
        excerpt: 'Saffron quality is analyzed in laboratories against domestic and international standards.',
        content: 'Saffron is one of the world\'s most expensive spices and its quality is measured by precise criteria.\n\nQuality indicators:\n- Crocin: responsible for the golden-yellow color — higher is better.\n- Picrocrocin: responsible for the bitter taste.\n- Safranal: responsible for the aroma.\n\nInternational standard ISO 3632 defines four quality grades for saffron. Iranian saffron is considered among the best in the world due to its unique climate. Nutty Milk uses Grade 1 Iranian saffron.',
        author: 'Nutty Milk Team',
        published_at: '2025-05-06',
      },
    ];

    for (const post of blogPosts) {
      await db.execute(
        "INSERT INTO blogs (lang, title, slug, excerpt, content, author, published_at) VALUES ('en',?,?,?,?,?,?)",
        [post.title, post.slug, post.excerpt, post.content, post.author, post.published_at]
      );
    }
    console.log('English blog posts seeded');
  }

  // Seed Farsi blog posts if none exist
  const [faBlogRows] = await db.execute("SELECT id FROM blogs WHERE lang='fa' LIMIT 1");
  if (faBlogRows.length === 0) {
    const faPosts = [
      { title: 'شیر نارگیل در مقابل آب نارگیل در مقابل شیر ناتی‌میلک', slug: 'shir-nargil-vs-ab-nargil', excerpt: 'آب نارگیل یک نوشیدنی انرژی‌زای طبیعی است که مستقیماً از نارگیل به دست می‌آید.', content: 'آب نارگیل یک نوشیدنی طبیعی و انرژی‌بخش است که مستقیماً از داخل نارگیل به دست می‌آید. این نوشیدنی سرشار از الکترولیت‌ها، پتاسیم و ویتامین‌های طبیعی است. از طرف دیگر، شیر نارگیل از گوشت رنده‌شده نارگیل تهیه می‌شود و چربی و کالری بیشتری دارد. ترکیب نارگیل ناتی‌میلک یک ترکیب منحصربه‌فرد از پودر شیر، زعفران و پودر نارگیل است — طعم عالی و سرشار از مواد مغذی.', author: 'تیم ناتی‌میلک', published_at: '2025-12-23' },
      { title: 'شیر پسته', slug: 'shir-pesteh', excerpt: 'شیر پسته ترکیبی منحصربه‌فرد از پودر شیر، زعفران و پودر پسته است.', content: 'شیر پسته یکی از محبوب‌ترین محصولات ناتی‌میلک است. این نوشیدنی خوشمزه و مغذی از پودر شیر ممتاز، زعفران خالص، پودر خامه و پودر پسته تهیه شده است. سرشار از پروتئین، آهن، کلسیم و آنتی‌اکسیدان‌های زعفران است. مصرف روزانه از سیستم ایمنی حمایت می‌کند، حافظه را بهبود می‌بخشد و انرژی را افزایش می‌دهد.', author: 'تیم ناتی‌میلک', published_at: '2025-12-23' },
      { title: 'نکاتی برای تهیه شیر زعفران پسته عالی', slug: 'nokateh-shir-zaferan-pesteh', excerpt: 'این نکات را دنبال کنید تا یک شیر زعفران پسته حرفه‌ای و عالی تهیه کنید.', content: 'نکاتی برای تهیه شیر زعفران پسته عالی:\n\n۱. دما: بهترین دمای حل کردن ۶۰ تا ۷۰ درجه سانتی‌گراد است.\n۲. نسبت: یک ساشه ۲۰ گرمی را در ۲۰۰ میلی‌لیتر شیر یا آب گرم حل کنید.\n۳. هم زدن: خوب هم بزنید تا کاملاً حل شود.\n۴. پودر پسته: پودر پسته را بعد از حل شدن پایه اضافه کنید.\n۵. سرو: گرم یا سرد (با یخ) میل کنید.', author: 'تیم ناتی‌میلک', published_at: '2025-09-13' },
      { title: 'دستور تهیه شیر زعفران پسته خانگی', slug: 'dastoor-shir-zaferan-pesteh-khanegi', excerpt: 'با این دستور ساده یک شیر زعفران پسته خانگی خوشمزه تهیه کنید.', content: 'مواد لازم:\n- ۱ ساشه ۲۰ گرمی ناتی‌میلک پسته‌ای\n- ۲۰۰ میلی‌لیتر شیر یا آب\n- پودر پسته\n\nطرز تهیه:\n۱. شیر یا آب را تا ۶۰-۷۰ درجه گرم کنید (نجوشانید).\n۲. محتویات ساشه را به تدریج به مایع گرم اضافه کنید.\n۳. با قاشق یا همزن خوب هم بزنید تا صاف شود.\n۴. پودر پسته را اضافه کنید و دوباره هم بزنید.\n۵. در فنجان بریزید و میل کنید.', author: 'تیم ناتی‌میلک', published_at: '2025-09-13' },
      { title: 'استانداردهای کیفیت زعفران', slug: 'standard-keyfiat-zaferan', excerpt: 'کیفیت زعفران در آزمایشگاه‌ها بر اساس استانداردهای داخلی و بین‌المللی بررسی می‌شود.', content: 'زعفران یکی از گران‌ترین ادویه‌های جهان است و کیفیت آن با معیارهای دقیقی سنجیده می‌شود.\n\nشاخص‌های کیفیت:\n- کروسین: مسئول رنگ زرد طلایی\n- پیکروکروسین: مسئول طعم تلخ\n- سافرانال: مسئول عطر و بو\n\nاستاندارد بین‌المللی ISO 3632 چهار درجه کیفیت برای زعفران تعریف می‌کند. زعفران ایرانی به دلیل آب و هوای منحصربه‌فرد، یکی از بهترین‌ها در جهان محسوب می‌شود. ناتی‌میلک از زعفران درجه یک ایرانی استفاده می‌کند.', author: 'تیم ناتی‌میلک', published_at: '2025-05-06' },
    ];
    for (const post of faPosts) {
      await db.execute(
        "INSERT INTO blogs (lang, title, slug, excerpt, content, author, published_at) VALUES ('fa',?,?,?,?,?,?)",
        [post.title, post.slug, post.excerpt, post.content, post.author, post.published_at]
      );
    }
    console.log('Farsi blog posts seeded');
  }
  } catch (e) { console.warn('Blogs seed skipped:', e.message); }

  // Seed Farsi page content if not exists
  const faPages = [
    ['faq', 'سوالات متداول', JSON.stringify({ title: 'سوالات متداول', askTitle: '❓ آیا سوالی دارید؟ از ما بپرسید', askSubtitle: 'لطفاً سوالات بالا را بخوانید و اگر نمی‌توانید پاسخ خود را پیدا کنید، سوال خود را برای ما ارسال کنید. ما در اسرع وقت به شما پاسخ خواهیم داد.', askNamePlaceholder: 'نام کامل *', askEmailPlaceholder: 'ایمیل *', askMsgPlaceholder: 'پیام شما *', askBtn: 'ارسال', askSuccess: '✓ پیام شما ارسال شد. با تشکر!' })],
    ['contact', 'تماس با ما', JSON.stringify({ title: 'تماس با ما', touch: 'در ارتباط باشید', email: 'ایمیل', emailValue: 'info@nuttymilk.com', phone: 'تلفن', address: 'آدرس', hours: 'ساعات کاری', hoursValue: 'دوشنبه تا جمعه، ۹ صبح تا ۶ عصر', sendMsg: 'ارسال پیام', name: 'نام *', emailField: 'ایمیل', subject: 'موضوع', message: 'پیام *', send: 'ارسال پیام', success: '✓ پیام شما ارسال شد!', error: 'خطا! لطفاً دوباره تلاش کنید.' })],
    ['about', 'درباره ما', JSON.stringify({ title: 'درباره ما', introText: 'ما در ناتی‌میلک به تولید شیرهای گیاهی طبیعی و کره‌های بادام‌زمینی با کیفیت بالا متعهد هستیم. محصولات ما بدون مواد نگهدارنده و کاملاً طبیعی هستند.', findUs: 'موقعیت ما' })],
    ['profile', '', JSON.stringify({ 'profile.title': 'ویرایش پروفایل', 'profile.firstName': 'نام', 'profile.lastName': 'نام خانوادگی', 'profile.email': 'ایمیل', 'profile.phone': 'تلفن', 'profile.passwordHint': 'برای حفظ رمز عبور فعلی، فیلدهای رمز عبور را خالی بگذارید.', 'profile.currentPassword': 'رمز عبور فعلی', 'profile.newPassword': 'رمز عبور جدید', 'profile.confirmPassword': 'تأیید رمز عبور جدید', 'profile.saveChanges': 'ذخیره تغییرات', 'profile.saved': 'ذخیره شد', 'address.saved': 'آدرس‌های ذخیره شده', 'address.add': '+ افزودن' })],
  ];
  for (const [page, title, content] of faPages) {
    await db.execute(
      'INSERT INTO page_content (page, lang, title, content) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content)',
      [page, 'fa', title, content]
    );
  }

  // Seed Farsi home tab labels
  const [tabExisting] = await db.execute("SELECT value FROM site_settings WHERE key_name='home_tab_labels'");
  let tabLabels = { all: { en: 'All Products', fa: 'همه محصولات' }, new: { en: 'New Arrivals', fa: 'جدیدترین‌ها' }, deals: { en: 'Best Deals', fa: 'بهترین تخفیف‌ها' } };
  if (tabExisting.length) { try { const ex = JSON.parse(tabExisting[0].value); tabLabels.all = { ...tabLabels.all, ...ex.all }; tabLabels.new = { ...tabLabels.new, ...ex.new }; tabLabels.deals = { ...tabLabels.deals, ...ex.deals }; } catch {} }
  tabLabels.all.fa = 'همه محصولات'; tabLabels.new.fa = 'جدیدترین‌ها'; tabLabels.deals.fa = 'بهترین تخفیف‌ها';
  await db.execute("INSERT INTO site_settings (key_name, value) VALUES ('home_tab_labels', ?) ON DUPLICATE KEY UPDATE value=VALUES(value)", [JSON.stringify(tabLabels)]);

  return db;
}

module.exports = { getPool, initDB };
