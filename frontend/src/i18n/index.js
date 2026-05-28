import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Minimal fallback so app renders before DB loads
const fallback = {
  en: { translation: { appName: 'NuttyMilk', home: 'Home', cart: 'Cart', login: 'Login', register: 'Register', logout: 'Logout', search: 'Search', save: 'Save', cancel: 'Cancel', admin: 'Admin Panel', products: 'Products', dashboard: 'Dashboard', manageProducts: 'Manage Products', manageUsers: 'Manage Users', themeSettings: 'Theme Settings', selectLanguage: 'Language', orders: 'Orders', myOrders: 'My Orders', total: 'Total', welcome: 'Welcome', noProducts: 'No products found', addToCart: 'Add to Cart', buyNow: 'Buy Now', price: 'Price', stock: 'Stock', name: 'Name', email: 'Email', password: 'Password', image: 'Image', role: 'Role', users: 'Users', status: 'Status', successfullyAdded: 'Successfully added to cart' } },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: fallback,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

const API = process.env.REACT_APP_API_URL || '';

// Load translations from DB for all available languages
export async function loadTranslations() {
  try {
    const langsRes = await fetch(`${API}/api/languages`);
    const langs = await langsRes.json();
    await Promise.all(langs.map(async l => {
      const res = await fetch(`${API}/api/translations/${l.code}`);
      const data = await res.json();
      if (Object.keys(data).length > 0) {
        i18n.addResourceBundle(l.code, 'translation', data, true, true);
      }
    }));
  } catch (e) {
    console.warn('Could not load translations from DB, using fallback');
  }
}

export default i18n;
