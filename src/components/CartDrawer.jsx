import React from "react";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";

export default function CartDrawer({ open, onClose }) {
  const { items, removeItem, clear } = useCart();
  const { fx, currency, locale } = useCurrency();

  const itemTotal = (it) => (it.price || 0) * (it.pax || 1) * (it.qty || 1);
  const grandTotal = items.reduce((s, i) => s + itemTotal(i), 0);

  return (
    <div className={"fixed inset-0 z-50 " + (open ? "" : "pointer-events-none")}>
      <div
        className={
          "absolute inset-0 bg-black/40 transition-opacity " +
          (open ? "opacity-100" : "opacity-0")
        }
        onClick={onClose}
      />
      <aside
        className={
          "absolute right-0 top-0 h-full w-[90%] max-w-[420px] bg-white dark:bg-slate-900 shadow-xl transition-transform " +
          (open ? "translate-x-0" : "translate-x-full")
        }
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Keranjang</h3>
          <button className="btn btn-outline" onClick={clear}>
            Kosongkan
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-160px)]">
          {items.length === 0 ? (
            <p className="text-slate-500">Belum ada item.</p>
          ) : (
            items.map((it) => (
              <div
                key={it.id + "-" + (it.pax || 1)}
                className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-xl p-3"
              >
                <div>
                  <p className="font-medium">{it.title}</p>
                  <p className="text-sm text-slate-500">
                    {it.pax} pax × {formatMoneyFromIDR(it.price, currency, fx, locale)}
                  </p>
                </div>
                {/* NOTE: pastikan removeItem di CartContext mendukung (id, pax) */}
                <button className="btn btn-outline" onClick={() => removeItem(it.id, it.pax)}>
                  Hapus
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span>Total</span>
            <span className="font-semibold">
              {formatMoneyFromIDR(grandTotal, currency, fx, locale)}
            </span>
          </div>
          <Link to="/checkout" className="btn btn-primary w-full" onClick={onClose}>
            Checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}
