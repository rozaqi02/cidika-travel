import React, { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext();
export const useCart = () => useContext(CartCtx);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cart")||"[]"); } catch { return []; }
  });
  useEffect(() => localStorage.setItem("cart", JSON.stringify(items)), [items]);

  // item: { id, title, price, pax, qty } -> price = price per pax; pax = jumlah orang; qty=1 (selalu)
  const addItem = (item) => setItems(prev => {
    const idx = prev.findIndex(p => p.id === item.id && p.pax === item.pax);
    if (idx >= 0) {
      const copy = [...prev]; copy[idx].qty = (copy[idx].qty || 1) + (item.qty || 1); return copy;
    }
    return [...prev, { ...item, qty: item.qty || 1 }];
  });

  const updateItem = (id, pax, patch) => setItems(prev =>
    prev.map(p => (p.id === id && p.pax === pax ? { ...p, ...patch } : p))
  );
  const removeItem = (id, pax) => setItems(prev => prev.filter(p => !(p.id === id && p.pax === pax)));
  const clear = () => setItems([]);

  return (
    <CartCtx.Provider value={{ items, addItem, updateItem, removeItem, clear }}>
      {children}
    </CartCtx.Provider>
  );
}
