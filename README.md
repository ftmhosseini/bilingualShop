# 🖥 Backend – Node.js + Express + MySQL

This is the server that powers both the Nutty Milk website and mobile app. It handles all data: products, categories, orders, users, settings, translations, and more.

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org) 18 or newer
- MySQL 8 or newer

---

## ⚙️ Setup

### 1. Create the MySQL database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE nuttymilk;
CREATE USER 'nuttymilk'@'localhost' IDENTIFIED BY 'nutty123';
GRANT ALL PRIVILEGES ON nuttymilk.* TO 'nuttymilk'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_USER=nuttymilk
DB_PASSWORD=nutty123
DB_NAME=nuttymilk
JWT_SECRET=change_this_to_a_long_random_string
ADMIN_EMAIL=admin@nuttymilk.com
ADMIN_PASSWORD=change_this_password

# Email verification (Resend)
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=NuttyMilk <noreply@yourdomain.com>

# SMS verification (Kavenegar — for Iranian phone numbers)
KAVENEGAR_API_KEY=your_kavenegar_api_key_here
KAVENEGAR_SENDER=10008663

# Shipping (Shippo — for international rates)
SHIPPO_API_KEY=your_shippo_api_key_here
STORE_ADDRESS_STREET=123 Main St
STORE_ADDRESS_CITY=Toronto
STORE_ADDRESS_STATE=ON
STORE_ADDRESS_ZIP=M5V1A1
STORE_ADDRESS_COUNTRY=CA
STORE_NAME=NuttyMilk
```

> ⚠️ Change `JWT_SECRET` and `ADMIN_PASSWORD` before going live. Never commit `.env` to git.

### 3. Install and run

```bash
npm install
npm run dev      # auto-restarts on file changes
# or
npm start        # production
```

On first run the backend:
- Creates all database tables automatically
- Migrates any old data to the new schema (safe to run on existing installs)
- Seeds the admin user from the email/password in `.env`

The server runs on `http://localhost:5001` (or the `PORT` you set).

---

## 📁 Folder Structure

```
backend/
├── index.js        ← Server entry point (starts Express + DB)
├── app.js          ← Express app setup (routes, middleware) — exported for testing
├── db.js           ← MySQL connection pool + table creation + migrations + admin seed
├── middleware.js   ← Auth, admin, and shopkeeper permission checks
├── mailer.js       ← Email sending via Resend (verification codes)
├── sms.js          ← SMS sending via Kavenegar (verification codes)
├── .env            ← Your secrets (never commit this)
├── .env.example    ← Template — copy to .env and fill in
├── jest.config.js  ← Test configuration
├── routes/
│   ├── auth.js         ← Register, login, verify, forgot/reset password
│   ├── products.js     ← Product CRUD (multi-language, multi-price, image/video upload)
│   ├── categories.js   ← Category tree CRUD (unlimited depth)
│   ├── orders.js       ← Place orders, payment initiation, order management
│   ├── admin.js        ← User list and role management (admin only)
│   ├── settings.js     ← Site settings, image upload, logo upload
│   ├── content.js      ← About Us and Contact Us page content
│   ├── faq.js          ← FAQ entries
│   ├── navlinks.js     ← Navigation bar links
│   ├── languages.js    ← Active languages
│   ├── translations.js ← Per-language translation strings
│   ├── currencies.js   ← Active currencies
│   ├── shipping.js     ← Shipping rates (Shippo + Iranian zones)
│   └── plugins.js      ← Payment gateway plugins (e.g. Zarinpal)
├── plugins/
│   └── zarinpal.js     ← Zarinpal payment gateway integration
├── tests/
│   └── api.test.js     ← Integration tests (Jest + Supertest)
└── uploads/            ← Uploaded images/videos (served at /uploads/...)
```

---

## 🔌 API Routes

### Auth — `/api/auth`
| Method | Path | Who | Description |
|--------|------|-----|-------------|
| POST | `/register` | Anyone | Create account → sends verification code via email/SMS |
| POST | `/verify` | Anyone | Verify code → returns JWT token |
| POST | `/resend` | Anyone | Resend verification code |
| POST | `/login` | Anyone | Login → returns JWT token + role |
| POST | `/forgot-password` | Anyone | Send password reset code to email/phone |
| POST | `/reset-password` | Anyone | Verify reset code + set new password |
| GET | `/profile` | Logged in | Get own profile |
| PUT | `/profile` | Logged in | Update name, email, phone, or password |
| GET | `/addresses` | Logged in | List saved addresses |
| POST | `/addresses` | Logged in | Add a new address |
| PUT | `/addresses/:id` | Logged in | Update an address |
| DELETE | `/addresses/:id` | Logged in | Delete an address |
| PUT | `/addresses/:id/default` | Logged in | Set as default address |

### Products — `/api/products`
| Method | Path | Who | Description |
|--------|------|-----|-------------|
| GET | `/` | Anyone | List all products with prices, media, and category |
| GET | `/:id` | Anyone | Get single product |
| POST | `/` | Shopkeeper+ | Add product (with images/videos + multi-language + category) |
| PUT | `/:id` | Shopkeeper+ | Update product |
| DELETE | `/:id` | Shopkeeper+ | Delete product |

### Categories — `/api/categories`
| Method | Path | Who | Description |
|--------|------|-----|-------------|
| GET | `/` | Anyone | Get full category tree (nested) |
| GET | `/flat` | Anyone | Get flat list with breadcrumb labels (for dropdowns) |
| POST | `/` | Admin | Add a category (`{ name, parent_id, names }`) |
| PUT | `/:id` | Admin | Rename a category |
| DELETE | `/:id` | Admin | Delete category and all its children |

### Orders — `/api/orders`
| Method | Path | Who | Description |
|--------|------|-----|-------------|
| POST | `/` | Logged in | Place an order (items, shipping address, payment method) |
| POST | `/initiate-payment` | Logged in | Start payment flow (returns redirect URL) |
| GET | `/verify-payment` | Public | Payment callback (redirects to frontend) |
| GET | `/my` | Logged in | View own order history |
| GET | `/all` | Shopkeeper+ | View all orders |
| PUT | `/:id/status` | Shopkeeper+ | Update order status |

### Settings — `/api/settings`
| Method | Path | Who | Description |
|--------|------|-----|-------------|
| GET | `/` | Anyone | Get all site settings (hero_slides, logo, etc.) |
| PUT | `/:key` | Admin | Update a setting by key |
| POST | `/upload-logo` | Admin | Upload site logo |
| POST | `/upload-image` | Shopkeeper+ | Upload image or video (returns URL) |
| GET | `/images` | Shopkeeper+ | List all uploaded images |
| DELETE | `/images/:filename` | Shopkeeper+ | Delete an uploaded image |

### Shipping — `/api/shipping`
| Method | Path | Who | Description |
|--------|------|-----|-------------|
| POST | `/rates` | Anyone | Get shipping rates for an address + parcel |

> Other routes (`/api/content`, `/api/faq`, `/api/navlinks`, `/api/languages`, `/api/translations`, `/api/currencies`, `/api/plugins`, `/api/admin`) follow the same GET (public) / POST/PUT/DELETE (admin) pattern.

---

## 📧 Email & SMS Verification

### Email — Resend

Used for: registration verification, password reset, order confirmations.

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use their test domain for development)
3. Get your API key and add to `.env`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   FROM_EMAIL=NuttyMilk <noreply@yourdomain.com>
   ```

### SMS — Kavenegar

Used for: phone-based registration and password reset (especially for Iranian users).

1. Sign up at [kavenegar.com](https://kavenegar.com)
2. Get your API key from the dashboard
3. Add to `.env`:
   ```
   KAVENEGAR_API_KEY=xxxxxxxxxxxxx
   KAVENEGAR_SENDER=10008663
   ```

### How it works

- User enters email → receives 5-digit code via Resend
- User enters phone number → receives 5-digit code via Kavenegar SMS
- Code expires in 10 minutes
- Same flow for registration, resend, and forgot password

---

## 🧪 Testing

### Run tests

```bash
npm test
```

Tests use **Jest + Supertest** and run against the real MySQL database (same one from `.env`).

### What's tested (18 tests)

| Area | Tests |
|------|-------|
| Register | new user, duplicate rejection |
| Login | valid credentials, invalid password, non-existent user |
| Profile | with token, without token |
| Languages | admin add, public get, non-admin rejection |
| Currencies | admin set, public get, non-admin rejection |
| Orders | create order, list orders, reject without auth |
| Shipping | Canadian address rates, Iranian address rates |

### CI

Tests run automatically on GitHub Actions (push/PR to main). See `.github/workflows/ci.yml`.

---

## 🗄 Database Tables

| Table | What it stores |
|-------|---------------|
| `users` | Email, phone, hashed password, role, verification code |
| `user_addresses` | Saved shipping addresses per user |
| `products` | Name/description (JSON multi-lang), stock, category |
| `product_prices` | Price + sale price per currency per product |
| `product_media` | Image/video URLs per product |
| `categories` | Category tree (self-referencing `parent_id`) |
| `orders` | Order totals, status, shipping info, payment info |
| `order_items` | Products + quantities per order |
| `site_settings` | Key-value store (hero_slides, logo, button_labels, etc.) |
| `languages` | Language codes, labels, RTL flag, enabled status |
| `currencies` | Currency codes, symbols, decimal places, country |
| `translations` | Translation strings per language |
| `nav_links` | Navigation bar links per language |
| `plugins` | Payment/shipping plugin configs |

All tables are created automatically on first run — you never need to run SQL manually.

---

## 🖼 Hero Slides (Settings)

Hero slides are stored as JSON in `site_settings` under key `hero_slides`. Each slide object:

```json
{
  "title": "Welcome",
  "subtitle": "Fresh plant-based milk",
  "image": "/uploads/hero.jpg",
  "video": "/uploads/hero.mp4",
  "mediaType": "image",
  "fit": "cover",
  "position": "center",
  "height": 300,
  "link": "/products",
  "btnText": "Shop Now",
  "bg": "#131921",
  "langs": ["en", "fa"]
}
```

**Display options:**
- `fit` — `cover` (crop to fill), `contain` (show all), `fill` (stretch)
- `position` — `center`, `top`, `bottom`, `left`, `right`, or corners
- `height` — pixel height of the media area (100–800)
- `mediaType` — `image` or `video`

---

## 👥 Roles & Permissions

| Action | customer | cooperatore | admin |
|--------|:--------:|:-----------:|:-----:|
| Browse & buy | ✅ | ✅ | ✅ |
| Add/edit/delete products | ❌ | ✅ | ✅ |
| Upload images/videos | ❌ | ✅ | ✅ |
| Manage categories | ❌ | ❌ | ✅ |
| Manage users & roles | ❌ | ❌ | ✅ |
| Edit site settings | ❌ | ❌ | ✅ |
| Manage languages/currencies | ❌ | ❌ | ✅ |

---

## 🚀 Deployment

1. Set `NODE_ENV=production` in your environment
2. Build the frontend: `cd frontend && npm run build`
3. Copy `frontend/build/` to `backend/build/`
4. Uncomment the production catch-all in `index.js`
5. Run: `node index.js`

The backend serves both the API and the React frontend from a single process.

---

## ⚠️ What NOT to Edit Without a Developer

- `db.js` — changing table definitions can break the database
- `middleware.js` — controls who can access what; mistakes open security holes
- Any route file's URL paths — the frontend depends on these exact paths
- `.env` in production — wrong values can break email/SMS/payments
