// src/components/WishlistDrawer.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X, Heart, Trash2 } from "lucide-react";

import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";

export default function WishlistDrawer({ open, onClose }) {
  const { t } = useTranslation();
  const { items, removeItem, clear } = useCart();
  const { fx, currency, locale } = useCurrency();

  // Normalisasi angka biar aman dari NaN/undefined/null
  const n = (val, fallback = 0) => {
    const num = Number(val);
    return Number.isFinite(num) ? num : fallback;
  };

  const itemTotal = (it) => {
    const price = n(it.price);
    const pax = Math.max(1, n(it.pax, 1));
    const qty = Math.max(1, n(it.qty, 1));
    return price * pax * qty;
  };

  const grandTotal = useMemo(
    () => items.reduce((s, i) => s + itemTotal(i), 0),
    [items]
  );

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`absolute right-0 top-0 h-full w-[90%] max-w-[440px] bg-white dark:bg-slate-900 shadow-xl
        transition-transform duration-300 will-change-transform flex flex-col
        ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* HEADER (sticky) */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-50 dark:bg-slate-800">
                <Heart size={18} className="text-sky-600 dark:text-sky-400" />
              </span>
              <h3 className="font-semibold text-lg">
                {t("wishlist.title", { defaultValue: "Wishlist" })}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  className="btn btn-outline px-3 py-1.5 text-sm"
                  onClick={clear}
                  aria-label={t("wishlist.clear", { defaultValue: "Clear" })}
                  title={t("wishlist.clear", { defaultValue: "Clear" })}
                >
                  {t("wishlist.clear", { defaultValue: "Clear" })}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={t("wishlist.close", { defaultValue: "Close" })}
                title={t("wishlist.close", { defaultValue: "Close" })}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
              <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Heart size={20} className="text-slate-500" />
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {t("wishlist.empty", { defaultValue: "No items yet." })}
              </p>
              <Link
                to="/explore"
                onClick={onClose}
                className="inline-flex mt-3 btn btn-primary"
              >
                {t("wishlist.browse", { defaultValue: "Browse Packages" })}
              </Link>
            </div>
          ) : (
            items.map((it) => {
              const subtotal = itemTotal(it);
              return (
                <div
                  key={`${it.id}-${it.pax}`}
                  className="flex items-start justify-between border border-slate-200 dark:border-slate-800 rounded-xl p-3 hover:shadow-md transition"
                >
                  <div className="pr-3">
                    <p className="font-medium leading-snug">{it.title}</p>
                    <p className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
                      {/* contoh: "2 pax × Rp250.000 × 1" */}
                      {t("wishlist.meta", {
                        defaultValue: "{{pax}} pax × {{price}} × {{qty}}",
                        pax: Math.max(1, n(it.pax, 1)),
                        price: formatMoneyFromIDR(n(it.price), currency, fx, locale),
                        qty: Math.max(1, n(it.qty, 1))
                      })}
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {formatMoneyFromIDR(subtotal, currency, fx, locale)}
                    </p>
                  </div>

                  <button
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => removeItem(it.id, it.pax)}
                    aria-label={t("wishlist.remove", { defaultValue: "Remove" })}
                    title={t("wishlist.remove", { defaultValue: "Remove" })}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER (sticky) */}
        <div className="sticky bottom-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-t border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-600 dark:text-slate-300">
              {t("wishlist.estimate", { defaultValue: "Estimate" })}
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {formatMoneyFromIDR(grandTotal, currency, fx, locale)}
            </span>
          </div>
          <Link
            to="/checkout"
            className={`btn btn-primary w-full ${items.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={items.length === 0 ? (e) => e.preventDefault() : onClose}
          >
            {t("wishlist.continue", { defaultValue: "Continue" })}
          </Link>
        </div>
      </aside>
    </div>
  );
}
