import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabaseClient.js";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";

export default function Checkout() {
  const { t } = useTranslation();
  const { items, clear } = useCart();
  const nav = useNavigate();
  const { fx, currency, locale } = useCurrency();

  const [form, setForm] = useState({ name:"", email:"", phone:"", date:"", notes:"" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // helper angka aman
  const n = (v, f=0) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : f;
  };

  const lineSubtotal = (it) => {
    const price = n(it.price);
    const pax   = Math.max(1, n(it.pax, 1));
    const qty   = Math.max(1, n(it.qty, 1));
    return price * pax * qty;
  };

  const grandTotal = useMemo(
    () => items.reduce((s, it) => s + lineSubtotal(it), 0),
    [items]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!items.length) { setMsg(t("checkout.cartEmpty", { defaultValue: "Wishlist kosong." })); return; }

    const first = items[0]; // order-level pax ambil dari item pertama (satu paket per order)
    setLoading(true);
    setMsg(t("checkout.creating", { defaultValue: "Membuat order..." }));

    try {
      const payload = {
        p_package_id: first.id,
        p_date: form.date || new Date().toISOString().slice(0,10),
        p_pax: Math.max(1, n(first.pax, 1)),
        p_audience: "domestic",
        p_customer_name: form.name,
        p_email: form.email,
        p_phone: form.phone,
        p_notes: form.notes || "",
        // KUNCI: kirim price_idr = price_per_pax × pax → biar backend (qty*price_idr) = subtotal baris
        p_items: items.map(it => ({
          item_name: it.title,
          qty: Math.max(1, n(it.qty, 1)),
          price_idr: n(it.price) * Math.max(1, n(it.pax, 1))
        }))
      };

      const { data, error } = await supabase.rpc("place_order", payload);
      if (error) throw error;

      clear();
      setMsg(t("checkout.success", { defaultValue: "Order dibuat!", code: data?.[0]?.public_code || "" }));
      nav("/"); // arahkan pulang / bisa diarahkan ke halaman 'Terima kasih'
    } catch (e2) {
      setMsg(e2.message || t("checkout.failed", { defaultValue: "Gagal membuat order" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-6 grid md:grid-cols-2 gap-6">
      <div className="card p-4">
        <h1 className="text-2xl font-bold mb-2">{t("checkout.title", { defaultValue: "Checkout" })}</h1>
        <form onSubmit={onSubmit} className="grid gap-3">
          <input className="border rounded-2xl px-3 py-2 dark:bg-slate-900" placeholder={t("checkout.name", { defaultValue: "Nama Lengkap" })} value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
          <input className="border rounded-2xl px-3 py-2 dark:bg-slate-900" placeholder={t("checkout.email", { defaultValue: "Email" })} type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
          <input className="border rounded-2xl px-3 py-2 dark:bg-slate-900" placeholder={t("checkout.phone", { defaultValue: "Telepon/WA" })} value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
          <input className="border rounded-2xl px-3 py-2 dark:bg-slate-900" placeholder={t("checkout.date", { defaultValue: "Tanggal Trip (YYYY-MM-DD)" })} value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
          <textarea className="border rounded-2xl px-3 py-2 dark:bg-slate-900" placeholder={t("checkout.notes", { defaultValue: "Catatan" })} rows="4" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} />
          <button className="btn btn-primary" disabled={loading}>
            {loading ? t("checkout.processing", { defaultValue: "Memproses..." }) : t("checkout.submit", { defaultValue: "Buat Pesanan" })}
          </button>
          {msg && <p className="text-sm text-slate-500">{msg}</p>}
        </form>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-2">{t("checkout.summary", { defaultValue: "Ringkasan" })}</h2>
        {items.length === 0 ? (
          <p className="text-slate-500">{t("checkout.cartEmptyShort", { defaultValue: "Wishlist kosong" })}</p>
        ) : (
          <>
            <ul className="space-y-2">
              {items.map(it => {
                const pax = Math.max(1, n(it.pax, 1));
                const qty = Math.max(1, n(it.qty, 1));
                const price = n(it.price);
                const subtotal = price * pax * qty;
                return (
                  <li key={`${it.id}-${pax}`} className="flex items-center justify-between">
                    <span>
                      {it.title} — {pax} {t("home.pax", { defaultValue: "pax" })} × {qty}
                    </span>
                    <span>{formatMoneyFromIDR(subtotal, currency, fx, locale)}</span>
                  </li>
                );
              })}
            </ul>
            <hr className="my-3 border-slate-200 dark:border-slate-800" />
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>{formatMoneyFromIDR(grandTotal, currency, fx, locale)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
