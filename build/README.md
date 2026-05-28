# 🗂 public/ – Static Files

Files served directly to the browser without processing.

---

## 📁 Files

| File | What it does |
|------|--------------|
| `index.html` | Single HTML page that loads the React app. The `<div id="root">` is where the whole site gets injected. |
| `favicon.ico` / `favicon.png` | Browser tab icon. Replace to change it. |
| `logo192.png` / `logo512.png` | App icons for phone home-screen shortcuts (192×192 and 512×512 px). |
| `logo.svg` | Vector logo used in the HTML shell. |
| `manifest.json` | App name, colours, and icons for PWA installs. |
| `robots.txt` | Instructions for search engine crawlers. |

---

## ✍️ Safe Changes

**Replace the favicon:** Drop a new `favicon.png` or `favicon.ico` into this folder, replacing the existing file. Hard-refresh the browser (`Cmd+Shift+R` on Mac).

**Replace app icons:** Replace `logo192.png` and `logo512.png` at the same sizes.

**Change the app name in `manifest.json`:**
```json
"short_name": "NuttyMilk",
"name": "Nutty Milk Store"
```

---

## ⚠️ Do Not Edit

- `index.html` — structure is critical. The `<title>` tag is set dynamically by the app anyway.
- `robots.txt` — only change if you understand search engine directives.
