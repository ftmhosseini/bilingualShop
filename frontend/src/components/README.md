# 🧩 components/ – Shared Building Blocks

Pieces that appear on multiple pages. Not full pages themselves — reusable parts included wherever needed.

---

## 📁 Files

### `App.js` – Router & Providers

Wires every page to its URL and wraps the whole app in shared-state providers.

| URL | Page |
|-----|------|
| `/` | Home |
| `/products` | Products |
| `/products/:id` | Product Detail |
| `/login` | Login |
| `/register` | Register |
| `/cart` | Cart |
| `/checkout` | Checkout |
| `/orders` | My Orders |
| `/about` | About Us |
| `/faq` | FAQ |
| `/contact` | Contact Us |
| `/profile` | Profile |
| `/admin/...` | Admin Panel |

Providers loaded here (do not remove):
- `ThemeProvider` – primary colour
- `ButtonLabelsProvider` – button labels & colours from DB
- `AuthProvider` – login state
- `CartProvider` – cart items

Also contains `PageTitleSetter`, which updates the browser tab title dynamically based on the current route and the active language, using titles set in **Admin Panel → Content Settings → Page Titles**.

---

### `Navbar.js` – Top Navigation Bar

Shown on every page. Includes:

- Store logo and name (from Page Titles settings)
- Products mega-menu (category tree, unlimited depth)
- Nav links loaded per language from the database
- Country / currency selector (switches language automatically)
- Cart icon with item count
- Login / Register links or Logout button

**Change content via Admin Panel, not code:**

| What | Where |
|------|-------|
| Nav links | Content Settings → Nav Bar tab |
| Languages | Content Settings → Languages tab |
| Currencies | Content Settings → Currencies tab |
| Logo | Admin Panel settings |
| Categories in Products menu | Manage Products → 🗂 Manage Categories |

---

### `Footer.js` – Site Footer

Shown on every page below the main content.

---

### `CategoryManager.js` – Category Tree Editor

Used inside Manage Products. Lets admins add, rename, and delete categories at any depth. No direct editing needed — use the Admin Panel UI.

---

## ⚠️ General Rules

- Don't touch `import` lines at the top of any file.
- Don't remove `Provider` wrappers in `App.js`.
- Use the Admin Panel for content changes where possible.
