# 🥛 Nutty Milk – Frontend

Customer-facing website for the Nutty Milk online store. Built with React, talks to a backend server for products, orders, and admin settings.

---

## 📁 Folder Overview

```
frontend/
├── public/              ← Static files (logo, favicon, HTML shell)
├── src/
│   ├── components/      ← Reusable pieces (Navbar, Footer, App router, CategoryManager)
│   ├── context/         ← Shared state (login, cart, theme, button labels)
│   ├── i18n/            ← Language / translation setup
│   ├── pages/           ← Every page the customer sees
│   │   └── admin/       ← Admin-only pages
│   └── api.js           ← Axios instance (base URL from .env)
├── cypress/
│   ├── e2e/             ← End-to-end tests
│   └── support/         ← Cypress commands and setup
├── cypress.config.js    ← Cypress configuration
├── .env                 ← Secret config (API address)
└── package.json         ← Project dependencies & scripts
```

---

## ▶️ How to Start (Development)

```bash
npm install      # only needed the first time
npm start        # opens the site at http://localhost:3000
```

Make sure the backend is running on `http://localhost:5001` first.

---

## 🔑 The `.env` File

```
REACT_APP_API_URL=http://localhost:5001
```

Do not share this file publicly. If the backend runs on a different address, update this value.

---

## 🏗 Building for Production

```bash
npm run build
```

Creates a `build/` folder with optimised files ready to deploy.

---

## 🗺 Pages & URLs

| URL | What the customer sees |
|-----|----------------------|
| `/` | Home — hero slider, Best Deals, New Arrivals |
| `/products` | All products — search + category filter |
| `/products/:id` | Single product detail |
| `/cart` | Shopping cart |
| `/checkout` | Checkout / payment |
| `/orders` | My order history |
| `/login` | Login + Forgot Password |
| `/register` | Register (with email/SMS verification) |
| `/profile` | Account settings + saved addresses |
| `/about` | About Us |
| `/faq` | FAQ |
| `/contact` | Contact Us |
| `/admin/...` | Admin panel (admin / cooperatore only) |

---

## 🔐 Authentication Flow

### Register
1. User enters email or phone + password
2. Backend sends a 5-digit verification code (email via Resend, SMS via Kavenegar)
3. User enters the code → account created, logged in

### Login
- Enter email/phone + password → JWT token stored in localStorage

### Forgot Password
1. Click "Forgot Password?" on the login page
2. Enter email or phone → receives a 5-digit reset code
3. Enter code + new password → password updated, back to login

---

## 🎠 Hero Slider

The home page hero section supports images and videos with display options:

| Option | Values | Description |
|--------|--------|-------------|
| Fit | `cover`, `contain`, `fill` | How media fills the space |
| Crop Position | `center`, `top`, `bottom`, `left`, `right`, corners | Which part shows when cropped |
| Height | 100–800 px | Height of the media area |
| Media Type | image, video | Videos auto-play muted and loop |

Managed from **Admin Panel → Content Settings → Hero Slides**.

Each slide can be filtered by language — only shows for selected languages.

---

## 🌍 Languages & Button Labels

The site supports multiple languages (English, Persian, Arabic and any others added via the admin panel). Translations and button labels are loaded from the backend database. The fallback English translations live in `src/i18n/`.

Button labels (Add to Cart, Buy Now, Login, etc.) and their colours are managed from **Admin Panel → Content Settings → Nav Bar tab → Button Labels section**.

RTL languages (Persian, Arabic) automatically flip the page layout direction.

---

## 🗂 Category System

Products are organised into an unlimited-depth tree:

```
Clothes → Men → Jacket → Winter Jacket
Food
Jewellery
```

Manage categories from **Admin Panel → Manage Products → 🗂 Manage Categories**.

---

## 🧪 Testing

### End-to-End Tests (Cypress)

```bash
# Run headless (CI mode)
npm run cy:run

# Open interactive test runner
npm run cy:open
```

Requires the backend running on `:5001` and frontend on `:3000`.

### What's tested

| Area | Tests |
|------|-------|
| Register | form display, submit to verification step |
| Login | invalid credentials error, admin login success |
| Languages | navigate admin tab, add via API |
| Currencies | set via API, verify GET |
| Checkout | redirect if not auth, form display when logged in |
| Shipping | Canadian address rates, Iranian address rates |

### Unit Tests (React Testing Library)

```bash
npm test
```

---

## 🔄 CI / GitHub Actions

Tests run automatically on push/PR to `main`. The workflow (`.github/workflows/ci.yml`) does:

1. **Backend tests** — spins up MySQL, runs Jest integration tests
2. **Frontend E2E** — starts backend + frontend, runs Cypress

---

## 🛠 Admin Panel Features

Accessible at `/admin/...` for admin and cooperatore roles:

| Section | What it does |
|---------|-------------|
| Content Settings → About Us | Edit about page text + features per language |
| Content Settings → Contact Us | Edit contact info, locations, map |
| Content Settings → Hero Slides | Manage hero carousel (images/videos, display options) |
| Content Settings → FAQ | Add/edit FAQ per language |
| Content Settings → Nav Bar | Navigation links, app title, home tab labels, button labels |
| Content Settings → Languages | Add/enable/disable languages, set RTL |
| Content Settings → Currencies | Add currencies with symbols, decimal places |
| Content Settings → Trust Badges | Footer trust badges (Enamad, BBB, SSL, etc.) |
| Content Settings → Translations | Translatable UI messages |
| Manage Products | CRUD products with multi-language, multi-price, media |
| Manage Categories | Unlimited-depth category tree |
| Orders | View/manage all orders, update status |
| Users | List users, change roles |

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `react` / `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP requests to backend |
| `i18next` / `react-i18next` | Multi-language support |
| `bootstrap` | Base CSS styles |
| `cypress` | End-to-end testing |

---

## ⚠️ What NOT to Touch Without a Developer

- `package.json` / `package-lock.json`
- Any file's `import` lines at the top
- The `.env` file in production
- `cypress.config.js` — test configuration
