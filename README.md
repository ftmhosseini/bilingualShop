# 🖥 Backend – Node.js + Express + MySQL

This is the server that powers the bilingual shop website and mobile app. It handles all data: products, categories, orders, users, settings, translations, and more.

---

## ⚡ Quick Start

### Option A: Web Installer (cPanel / Local)

```bash
npm install
PORT=5050 node install.js
```

Open `http://localhost:5050` — the installer asks for database credentials, site name, and admin account. Everything else is set up automatically.

### Option B: Cloud (Railway / Render)

Set these environment variables:

```
DATABASE_URL=mysql://user:password@host:3306/dbname
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_password
JWT_SECRET=random_string
```

Then deploy. Tables, admin user, default language, currency, and sample products are created automatically.

---

## What's Included After Installation

- ✅ English language (active)
- ✅ USD currency ($)
- ✅ Navigation links (Home, Products, About, Contact, FAQ)
- ✅ Categories (Plant Milks, Nut Butters with subcategories)
- ✅ 5 sample products with prices
- ✅ Admin account ready to log in

---

## 📁 Folder Structure

```
backend/
├── index.js        ← Entry point (starts Express + DB)
├── install.js      ← Web installer (first-time setup)
├── app.js          ← Express app (routes, middleware)
├── db.js           ← MySQL pool + table creation + seeds
├── middleware.js   ← Auth & permission checks
├── mailer.js       ← Email via Resend
├── sms.js          ← SMS via Kavenegar
├── .env.example    ← Template for environment variables
├── nixpacks.toml   ← Railway/Nixpacks build config
├── routes/
│   ├── auth.js         ← Register, login, verify, password reset
│   ├── products.js     ← Product CRUD
│   ├── categories.js   ← Category tree
│   ├── orders.js       ← Orders & payments
│   ├── admin.js        ← User management
│   ├── settings.js     ← Site settings, image upload
│   ├── content.js      ← About/Contact pages
│   ├── faq.js          ← FAQ per language
│   ├── navlinks.js     ← Navigation links
│   ├── languages.js    ← Languages
│   ├── translations.js ← Translation strings
│   ├── currencies.js   ← Currencies
│   ├── shipping.js     ← Shipping rates
│   └── plugins.js      ← Payment gateways
├── plugins/
│   └── zarinpal.js     ← Zarinpal payment
├── frontend/           ← React frontend source
├── build/              ← Production frontend build
└── uploads/            ← Uploaded images/videos
```

---

## 🔌 API Routes

| Route | Description |
|-------|-------------|
| `/api/auth` | Register, login, verify, profile, addresses |
| `/api/products` | Product CRUD with multi-language & multi-price |
| `/api/categories` | Category tree (unlimited depth) |
| `/api/orders` | Place orders, payment, order management |
| `/api/settings` | Site settings, logo, image upload |
| `/api/content` | About Us / Contact Us pages |
| `/api/faq` | FAQ entries per language |
| `/api/navlinks` | Navigation bar links |
| `/api/languages` | Active languages |
| `/api/translations` | Translation strings |
| `/api/currencies` | Active currencies |
| `/api/shipping` | Shipping rates |
| `/api/plugins` | Payment gateway plugins |
| `/api/admin` | User list & role management |

---

## 👥 Roles

| Role | Permissions |
|------|-------------|
| customer | Browse, buy, view own orders |
| cooperatore | + Add/edit products, upload media, manage orders |
| admin | + Manage users, categories, settings, languages, currencies |

---

## 🚀 Deployment

### Railway

1. Push code to GitHub
2. Connect repo in Railway
3. Add MySQL database service
4. Set `DATABASE_URL` + admin variables on the app service
5. Deploy

### cPanel

1. Build frontend: `cd frontend && npm run build`
2. Copy: `cp -r frontend/build backend/build`
3. Upload `backend/` to hosting
4. Create MySQL database in cPanel
5. Run `node install.js` or visit the site to use web installer
6. Set up Node.js app with startup file `index.js`

---

## ⚠️ Notes

- Never commit `.env` to git
- Change admin password before going live
- The backend serves both API and frontend from a single process
- All tables are created automatically on first run
- Sample data only seeds when tables are empty
