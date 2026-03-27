import React, { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext();
export const useCart = () => useContext(CartCtx);

function normalizeCartItem(item = {}) {
  return {
    ...item,
    qty: item.qty || 1,
    audience: item.audience || "domestic",
  };
}

function isSameCartLine(item, id, pax, audience) {
  return (
    item.id === id &&
    item.pax === pax &&
    (audience === undefined || item.audience === audience)
  );
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cart")||"[]"); } catch { return []; }
  });
  useEffect(() => localStorage.setItem("cart", JSON.stringify(items)), [items]);

  // ganti seluruh isi cart (dipakai saat datang dari Explore/Detail lewat navigate state)
  const setAll = (arr) => setItems(Array.isArray(arr) ? arr.map(normalizeCartItem) : []);

  // item: { id, title, price, pax, qty, audience }
  const addItem = (item) => setItems(prev => {
    const nextItem = normalizeCartItem(item);
    const idx = prev.findIndex(p => isSameCartLine(p, nextItem.id, nextItem.pax, nextItem.audience));
    if (idx >= 0) {
      const copy = [...prev];
      copy[idx].qty = (copy[idx].qty || 1) + (nextItem.qty || 1);
      return copy;
    }
    return [...prev, nextItem];
  });

  const updateItem = (id, pax, audienceOrPatch, maybePatch) => {
    const audience =
      typeof audienceOrPatch === "string" ? audienceOrPatch : audienceOrPatch?.audience;
    const patch =
      typeof audienceOrPatch === "string" ? (maybePatch || {}) : (audienceOrPatch || {});

    setItems(prev =>
      prev.map(p =>
        isSameCartLine(p, id, pax, audience) ? normalizeCartItem({ ...p, ...patch }) : p
      )
    );
  };

  const removeItem = (id, pax, audience) =>
    setItems(prev => prev.filter(p => !isSameCartLine(p, id, pax, audience)));
  const clear = () => setItems([]);

  return (
    <CartCtx.Provider value={{ items, setAll, addItem, updateItem, removeItem, clear }}>
      {children}
    </CartCtx.Provider>
  );
}
