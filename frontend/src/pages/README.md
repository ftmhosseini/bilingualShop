# 🛍 pages/ – Storefront & User Pages

Controls what the customer sees, from the homepage to checkout.

---

## 📁 File Map

### Shopping & Products

- **`Home.js`** — Homepage. Hero image slider, Best Deals tab, New Arrivals tab. Does not show the full catalogue.
- **`Products.js`** — `/products` page. All products with search and category filter. URL accepts `?cat=ID` to pre-filter by category, `?search=query` for search.
- **`ProductDetail.js`** — Single product page. Price, stock, images, descriptions in all languages.
- **`Cart.js`** — Shopping bag. Items, quantities, order summary.
- **`Checkout.js`** — Payment process. Shipping address and payment method steps.

### Customer Account

- **`Login.js`** & **`Register.js`** — Account access.
- **`Profile.js`** — Personal settings: email, phone, password.
- **`Orders.js`** — My Orders page. Past purchase history and status.

### Content & Information

- **`AboutUs.js`** — About page. Shows content set in Admin Panel → Content Settings → About Us tab, per language.
- **`FAQ.js`** — FAQ page. Questions expand on click. Content managed from Content Settings → FAQ tab.
- **`ContactUs.js`** — Contact page with form and location map. Content managed from Content Settings → Contact Us tab.
- **`NotFound.js`** — 404 page shown for unknown URLs.

---

## 🗂 How the Category Filter Works

When a customer clicks a category in the navbar (e.g. "Clothes › Men"), the URL becomes `/products?cat=5`. The Products page reads that ID and shows products in that category **and all its sub-categories**.

---

## ⚠️ Important Rules

- Lines starting with `api.get` / `api.post` are backend connections — do not change the URL paths.
- `dir={isRTL ? 'rtl' : 'ltr'}` lines flip the layout for Farsi/Arabic — do not delete them.
- Use the Admin Panel for content changes (About text, FAQ, Contact info) instead of editing code.
