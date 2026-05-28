import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

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
