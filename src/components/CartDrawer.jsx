import React from "react";
import { useCart } from "../context/CartContext";
import { toIDR } from "../utils/format";

export default function CartDrawer({ open, onClose }) {
  const { items, removeItem, clear } = useCart();
  const total = items.reduce((s,i)=> s + (i.price||0)*(i.qty||1), 0);

  return (
    <div className={"fixed inset-0 z-50 " + (open ? "" : "pointer-events-none")}>
      <div className={"absolute inset-0 bg-black/40 transition-opacity " + (open?"opacity-100":"opacity-0")} onClick={onClose} />
      <aside className={"absolute right-0 top-0 h-full w-[90%] max-w-[420px] bg-white dark:bg-slate-900 shadow-xl transition-transform " + (open?"translate-x-0":"translate-x-full")}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Keranjang</h3>
          <button className="btn btn-outline" onClick={clear}>Kosongkan</button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-160px)]">
          {items.length===0 ? <p className="text-slate-500">Belum ada item.</p> : items.map(it => (
            <div key={it.id} className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-xl p-3">
              <div>
                <p className="font-medium">{it.title}</p>
                <p className="text-sm text-slate-500">x{it.qty} • {toIDR(it.price || 0)}</p>
              </div>
              <button className="btn btn-outline" onClick={()=>removeItem(it.id)}>Hapus</button>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span>Total</span>
            <span className="font-semibold">{toIDR(total)}</span>
          </div>
          <button className="btn btn-primary w-full">Checkout (insert ke Supabase)</button>
        </div>
      </aside>
    </div>
  );
}