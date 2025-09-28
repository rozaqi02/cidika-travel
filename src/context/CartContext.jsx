import React, { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext();
export const useCart = () => useContext(CartCtx);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cart")||"[]"); } catch { return []; }
  });
  useEffect(() => localStorage.setItem("cart", JSON.stringify(items)), [items]);

  // ganti seluruh isi cart (dipakai saat datang dari Explore/Detail lewat navigate state)
  const setAll = (arr) => setItems(Array.isArray(arr) ? arr.map(it => ({ ...it, qty: it.qty || 1 })) : []);

  // item: { id, title, price, pax, qty, audience }
  const addItem = (item) => setItems(prev => {
    const idx = prev.findIndex(p => p.id === item.id && p.pax === item.pax && p.audience === item.audience);
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
    <CartCtx.Provider value={{ items, setAll, addItem, updateItem, removeItem, clear }}>
      {children}
    </CartCtx.Provider>
  );
}
