# 🧠 context/ – Shared App State

These files act as a "memory" any page or component can read from. They run silently in the background.

---

## 📁 Files

### `AuthContext.js` – Who Is Logged In?

Stores the current user's token, role (`admin`, `cooperatore`, `user`), and email. Persists to `localStorage` so the user stays logged in after a page refresh. Cleared on logout.

### `CartContext.js` – Shopping Cart

Holds items added to the cart, quantities, and running total. Reset when the browser tab is closed (not saved to the database).

### `ThemeContext.js` – Colour Theme

Stores the store's primary colour. Persists in the browser. Change the colour from **Admin Panel → Theme Settings** — no code editing needed.

### `ButtonLabelsContext.js` – Button Labels & Colours

Loads button label text and colours for all languages from the database (`button_labels` setting). Provides a `btn(key, lang)` helper that returns `{ label, color }` for any button key (e.g. `addToCart`, `buyNow`, `login`).

Manage labels from **Admin Panel → Content Settings → Nav Bar tab → Button Labels section**.

---

## ⚠️ Important

These files use React Context. Breaking their structure breaks login, cart, theme, or button labels across the **entire** site. Only edit with developer guidance.
