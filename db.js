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
      stock INT DEFAULT 0
    )
  `);

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
      flag VARCHAR(10),
      rtl TINYINT DEFAULT 0,
      enabled TINYINT DEFAULT 1,
      sort_order INT DEFAULT 0
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
      active TINYINT DEFAULT 1,
      fraction_digits TINYINT DEFAULT 2,
      sort_order INT DEFAULT 0
    )
  `);
  // add columns to existing installs (ignore error if column already exists)
  await db.execute(`ALTER TABLE currencies ADD COLUMN fraction_digits TINYINT DEFAULT 2`).catch(() => {});
  await db.execute(`ALTER TABLE currencies ADD COLUMN sort_order INT DEFAULT 0`).catch(() => {});

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

  // Seed admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nuttymilk.com';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const [rows] = await db.execute('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (rows.length === 0) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await db.execute("INSERT INTO users (username, email, password, role, verified) VALUES (?, ?, ?, 'admin', 1)", [adminUsername, adminEmail, hash]);
    console.log('Admin user seeded');
  }

  return db;
}

module.exports = { getPool, initDB };
