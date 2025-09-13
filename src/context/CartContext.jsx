import React, { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext();
export const useCart = () => useContext(CartCtx);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cart")||"[]"); } catch { return []; }
  });
  useEffect(() => localStorage.setItem("cart", JSON.stringify(items)), [items]);

  const addItem = (item) => setItems(prev => {
    const idx = prev.findIndex(p => p.id === item.id);
    if (idx >= 0) {
      const copy = [...prev]; copy[idx].qty += item.qty || 1; return copy;
    }
    return [...prev, { ...item, qty: item.qty || 1 }];
  });
  const removeItem = (id) => setItems(prev => prev.filter(p => p.id !== id));
  const clear = () => setItems([]);

  return (
    <CartCtx.Provider value={{ items, addItem, removeItem, clear }}>
      {children}
    </CartCtx.Provider>
  );
}