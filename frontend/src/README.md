# 📂 src/ – Source Code Root

Everything that makes the website work.

---

## 📁 What's Inside

| File / Folder   | What it does |
|-----------------|--------------|
| `index.js`      | Entry point — starts the whole app. **Don't edit.** |
| `index.css`     | Global styles (fonts, colours, resets). |
| `App.css`       | Extra styles for the root layout. |
| `api.js`        | Single connection to the backend. Every data request goes through here. |
| `components/`   | Reusable building blocks (Navbar, Footer, App router, CategoryManager). |
| `context/`      | Shared state: auth, cart, theme, button labels. |
| `i18n/`         | Language / translation configuration. |
| `pages/`        | One file per page the user can visit. |

---

## 🔌 How `api.js` Works

Automatically attaches the logged-in user's token to every request.

```js
api.get('/api/products')
api.get('/api/categories')
api.get('/api/navlinks/:lang')
api.get('/api/translations/:lang')
api.put('/api/settings/:key')
```

Do not change the URL paths unless the backend route also changes.

---

## ✅ Safe to Edit

- `index.css` – global colours, fonts, spacing
- `App.css` – minor layout tweaks

## ⚠️ Do Not Edit

- `index.js` – app entry point
- `api.js` – backend connection logic
