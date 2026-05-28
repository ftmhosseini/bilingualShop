# 🌍 i18n/ – Languages & Translations

Sets up the multi-language system. "i18n" is short for "internationalisation."

---

## How It Works

1. On load, a small built-in English dictionary (the "fallback") is used so the page doesn't appear blank.
2. Full translations for all active languages are then fetched from the backend database.
3. The active language is detected from the user's browser, or switched manually via the currency/country selector in the Navbar (which also switches language).

---

## 📁 Files

### `index.js`

| What | Where in the file |
|------|------------------|
| Built-in fallback English words | `const fallback = { en: { translation: { ... } } }` |
| Language auto-detection | `.use(LanguageDetector)` |
| Loading translations from DB | `export async function loadTranslations()` |

---

## ✍️ Editing the Fallback English Text

The fallback is only shown for a split second. To change a word:

1. Open `src/i18n/index.js`.
2. Find the `fallback` object.
3. Edit the text on the right side of the colon, keeping quotes and commas intact.

---

## ✅ Recommended Way to Change Translations

Use **Admin Panel → Content Settings → Translations tab**. Updates the database immediately — no code editing needed.

---

## ⚠️ Do Not Change

- The `i18n.use(...)` and `i18n.init(...)` lines.
- The `loadTranslations()` function.
