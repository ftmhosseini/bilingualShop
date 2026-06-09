import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const DEFAULTS = {
  addToCart:        { color: '#febd69', labels: { en: 'Add to Cart' } },
  buyNow:           { color: '#f90',    labels: { en: 'Buy Now' } },
  shopNow:          { color: '#f90',    labels: { en: 'Shop Now' } },
  login:            { color: '#232f3e', labels: { en: 'Login' } },
  register:         { color: '#232f3e', labels: { en: 'Register' } },
  logout:           { color: '#c0392b', labels: { en: 'Logout' } },
  save:             { color: '#27ae60', labels: { en: 'Save' } },
  cancel:           { color: '#888888', labels: { en: 'Cancel' } },
  search:           { color: '#232f3e', labels: { en: 'Search' } },
  back:             { color: '#888888', labels: { en: 'Back' } },
  placeOrder:       { color: '#27ae60', labels: { en: 'Place Order' } },
  continueShopping: { color: '#232f3e', labels: { en: 'Continue Shopping' } },
  viewOrders:       { color: '#232f3e', labels: { en: 'View Orders' } },
};

const Ctx = createContext();

export function ButtonLabelsProvider({ children }) {
  const [data, setData] = useState(DEFAULTS);

  useEffect(() => {
    api.get('/api/settings').then(r => {
      if (r.data.button_labels) {
        try {
          const stored = JSON.parse(r.data.button_labels);
          // merge stored over defaults
          const merged = { ...DEFAULTS };
          Object.keys(stored).forEach(key => {
            merged[key] = { ...DEFAULTS[key], ...stored[key], labels: { ...(DEFAULTS[key]?.labels || {}), ...(stored[key]?.labels || {}) } };
          });
          setData(merged);
        } catch {}
      }
    }).catch(() => {});
  }, []);

  // btn(key, lang) → { label, color }
  const btn = (key, lang) => {
    const entry = data[key] || DEFAULTS[key] || {};
    const label = entry.labels?.[lang] || entry.labels?.en || key;
    const color = entry.color || '#232f3e';
    return { label, color };
  };

  return <Ctx.Provider value={{ btn }}>{children}</Ctx.Provider>;
}

const _fallbackBtn = (key, lang) => {
  const entry = DEFAULTS[key] || {};
  return { label: entry.labels?.[lang] || entry.labels?.en || key, color: entry.color || '#232f3e' };
};

export const useButtonLabels = () => {
  const ctx = useContext(Ctx);
  return ctx || { btn: _fallbackBtn };
};
