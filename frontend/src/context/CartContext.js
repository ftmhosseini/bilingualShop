import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();
const CART_KEY = 'cart_items';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  // Re-price items when currency changes
  useEffect(() => {
    const handler = (e) => {
      const newCurrency = e.detail?.currency_code;
      const newLang = e.detail?.language_code;
      if (!newCurrency) return;
      setItems(prev => prev.map(item => {
        const match = (item.prices || []).find(p => p.currency === newCurrency);
        const name = (newLang && item.names?.[newLang]) || item.name;
        return {
          ...item,
          name,
          ...(match ? { price: match.sale_price ?? match.price, currency: newCurrency } : {}),
        };
      }));
    };
    window.addEventListener('currencychange', handler);
    return () => window.removeEventListener('currencychange', handler);
  }, []);

  const add = (product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const clear = () => setItems([]);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return <CartContext.Provider value={{ items, add, remove, clear, total }}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
