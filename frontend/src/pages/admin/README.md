# 🛠 Admin Panel Pages

---

## 📁 File Map

- **`AdminLayout.js`** — Sidebar frame. Controls which links are visible to `admin` vs `cooperatore`.
- **`Dashboard.js`** — Landing page after login. Store logo and high-level links.
- **`ManageProducts.js`** — Catalogue editor. Add, edit, delete products (multi-language, prices, images). Also contains the **🗂 Manage Categories** section.
- **`ManageOrders.js`** — Order tracker. Defines order statuses and their colours.
- **`ManageUsers.js`** — User list. All registered customers and their roles.
- **`ContentSettings.js`** — Text & content centre. Tabs:
  - **About Us** — per-language intro text, logo/icon, feature cards (live editable preview)
  - **Contact Us** — locations, map, per-language headings (live editable preview)
  - **Hero Slides** — homepage slider slides, per-language visibility
  - **FAQ** — per-language Q&A pairs
  - **Page Titles** — browser tab titles and icons per language
  - **Nav Bar** — nav links per language + **Button Labels** (label text and colour per button per language, with per-language tabs)
  - **Languages** — add/enable/disable languages, set RTL flag
  - **Currencies** — currencies per country/language
  - **Trust Badges** — footer trust badges
  - **Translations** — translatable UI messages (e.g. "Successfully added to cart")
- **`ThemeSettings.js`** — Primary colour and visual presets.
- **`ShippingSettings.js`** — Shipping methods, names, prices, active status.
- **`LanguageSettings.js`** — Language activation (legacy; prefer Content Settings → Languages tab).
- **`PaymentSettings.js`** — Payment method configuration.

---

## 🗂 Managing Categories

Go to **Manage Products → 🗂 Manage Categories**.

- Type a name → **+ Add** to create a top-level category.
- Click **+ sub** next to any category to add a child.
- ✏️ to rename, 🗑 to delete (deletes all children too).
- When adding/editing a product, pick its category from the dropdown (shows full path, e.g. `Clothes › Men › Jacket`).

---

## 🔘 Button Labels

Go to **Content Settings → Nav Bar tab → Button Labels section**.

- Language tabs at the top switch which language you're editing (same tabs used for nav links).
- Each row shows: button key → colour picker → live preview → label input for the active language.
- Click **Save Button Labels** to persist.

---

## ✍️ Common Quick Fixes

| What | Where |
|------|-------|
| Order status colours | `ManageOrders.js` → `const STATUS_COLOR = { ... }` |
| Content Settings tab names | `ContentSettings.js` → `const TABS = [...]` |
| Theme colour presets | `ThemeSettings.js` → `const PRESETS = [...]` |

---

## ⚠️ Rules

- Don't touch `import` lines at the top of any file.
- Respect punctuation — a missing comma or bracket breaks the site.
- `{t('something')}` is auto-translated; edit plain text inside regular quotes instead.
