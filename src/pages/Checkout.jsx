// src/pages/Checkout.jsx
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabaseClient.js";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";
import { motion } from "framer-motion";

export default function Checkout() {
  const { t } = useTranslation();
  const { items, clear } = useCart();
  const nav = useNavigate();
  const { fx, currency, locale } = useCurrency();

  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // tanggal "hari ini" dalam format YYYY-MM-DD untuk <input type="date">
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // helper angka aman
  const n = (v, f = 0) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : f;
  };

  const lineSubtotal = (it) => {
    const price = n(it.price);
    const pax = Math.max(1, n(it.pax, 1));
    const qty = Math.max(1, n(it.qty, 1));
    return price * pax * qty;
  };

  const grandTotal = useMemo(() => items.reduce((s, it) => s + lineSubtotal(it), 0), [items]);

  const first = items[0] || null;
  const audience = first?.audience || "domestic";
  const audienceLabel =
    audience === "foreign"
      ? t("checkout.audienceForeign", { defaultValue: "Foreign" })
      : t("checkout.audienceDomestic", { defaultValue: "Domestik" });

  const buildWAMessage = (summary) => {
    // summary: { public_code, date, items, grandTotal, name, email, phone, audience }
    const lines = [];
    lines.push(t("checkout.wa.header", { defaultValue: "Halo Admin CIDIKA, saya ingin booking." }));
    lines.push("");
    lines.push(`${t("checkout.wa.name", { defaultValue: "Nama" })}: ${summary.name}`);
    if (summary.phone) lines.push(`${t("checkout.wa.phone", { defaultValue: "WA" })}: ${summary.phone}`);
    if (summary.email) lines.push(`${t("checkout.wa.email", { defaultValue: "Email" })}: ${summary.email}`);
    lines.push(`${t("checkout.wa.date", { defaultValue: "Tanggal" })}: ${summary.date}`);
    lines.push(
      `${t("checkout.wa.audience", { defaultValue: "Tipe" })}: ${
        summary.audience === "foreign" ? "Foreign" : "Domestik"
      }`
    );
    lines.push("");
    lines.push(t("checkout.wa.items", { defaultValue: "Detail Item:" }));
    items.forEach((it) => {
      const pax = Math.max(1, n(it.pax, 1));
      const qty = Math.max(1, n(it.qty, 1));
      const price = n(it.price);
      const subtotal = price * pax * qty;
      const tag = it.audience === "foreign" ? "Foreign" : "Domestik";
      lines.push(
        `• ${it.title} (${tag}) — ${pax} ${t("home.pax", { defaultValue: "pax" })} × ${qty} = ${formatMoneyFromIDR(
          subtotal,
          currency,
          fx,
          locale
        )}`
      );
    });
    lines.push("");
    lines.push(`${t("checkout.wa.total", { defaultValue: "Total" })}: ${formatMoneyFromIDR(summary.grandTotal, currency, fx, locale)}`);
    if (summary.public_code) lines.push(`${t("checkout.wa.code", { defaultValue: "Kode" })}: ${summary.public_code}`);
    lines.push("");
    lines.push(t("checkout.wa.footer", { defaultValue: "Mohon konfirmasinya ya 🙏" }));
    return encodeURIComponent(lines.join("\n"));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!items.length) {
      setMsg(t("checkout.cartEmpty", { defaultValue: "Keranjang kosong." }));
      return;
    }

    setLoading(true);
    setMsg(t("checkout.creating", { defaultValue: "Membuat order..." }));

    try {
      const p_date = form.date || today;
      const payload = {
        p_package_id: first.id,
        p_date,
        p_pax: Math.max(1, n(first.pax, 1)),
        p_audience: audience,
        p_customer_name: form.name,
        p_email: form.email,
        p_phone: form.phone,
        p_notes: form.notes || "",
        // price_idr = harga per pax × pax (per line)
        p_items: items.map((it) => ({
          item_name: it.title + (it.audience ? ` (${it.audience})` : ""),
          qty: Math.max(1, n(it.qty, 1)),
          price_idr: n(it.price) * Math.max(1, n(it.pax, 1)),
        })),
      };

      const { data, error } = await supabase.rpc("place_order_v2", payload);
      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      const public_code = row?.public_code || null;

      // siapkan WA message
      const text = buildWAMessage({
        public_code,
        date: p_date,
        items,
        grandTotal,
        name: form.name,
        email: form.email,
        phone: form.phone,
        audience,
      });

      // bersihkan keranjang dulu supaya balik dari WA state-nya bersih
      clear();

      // redirect ke WhatsApp
      const wa = `https://wa.me/6289523949667?text=${text}`;
      setMsg(t("checkout.redirecting", { defaultValue: "Mengalihkan ke WhatsApp..." }));
      window.location.href = wa;
    } catch (e2) {
      console.error(e2);
      setMsg(e2.message || t("checkout.failed", { defaultValue: "Gagal membuat order" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4 space-y-4">
      {/* HERO / toolbar kecil */}
      <div className="sticky top-16 z-[5] rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md px-4 py-3 glass flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
            {audienceLabel}
          </span>
          <h1 className="text-xl font-bold">{t("checkout.title", { defaultValue: "Checkout" })}</h1>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {t("checkout.itemsCount", { defaultValue: "{{count}} item", count: items.length })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* FORM */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="lg:col-span-2 card p-4"
        >
          <h2 className="font-semibold mb-2">{t("checkout.details", { defaultValue: "Detail Pemesan" })}</h2>
          <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3">
            <input
              className="border rounded-2xl px-3 py-2 dark:bg-slate-900 sm:col-span-2"
              placeholder={t("checkout.name", { defaultValue: "Nama Lengkap" })}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="border rounded-2xl px-3 py-2 dark:bg-slate-900"
              placeholder={t("checkout.email", { defaultValue: "Email" })}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              className="border rounded-2xl px-3 py-2 dark:bg-slate-900"
              placeholder={t("checkout.phone", { defaultValue: "Telepon/WA" })}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            {/* TRIP DATE — pakai calendar picker native */}
            <div className="flex flex-col">
              <label htmlFor="trip-date" className="text-xs mb-1 text-slate-600 dark:text-slate-300">
                {t("checkout.date", { defaultValue: "Tanggal Trip (YYYY-MM-DD)" })}
              </label>
              <input
                id="trip-date"
                type="date"
                className="border rounded-2xl px-3 py-2 dark:bg-slate-900"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                min={today}
                aria-label={t("checkout.date", { defaultValue: "Tanggal Trip (YYYY-MM-DD)" })}
                onFocus={() => {
                  // kalau kosong saat fokus, prefill jadi hari ini agar picker konsisten
                  if (!form.date) setForm((f) => ({ ...f, date: today }));
                }}
              />
            </div>

            <textarea
              className="border rounded-2xl px-3 py-2 dark:bg-slate-900 sm:col-span-2"
              placeholder={t("checkout.notes", { defaultValue: "Catatan" })}
              rows="4"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <div className="sm:col-span-2 flex items-center gap-3 mt-1">
              <button className="btn btn-primary" disabled={loading}>
                {loading ? t("checkout.processing", { defaultValue: "Memproses..." }) : t("checkout.submit", { defaultValue: "Buat Pesanan" })}
              </button>
              {msg && <p className="text-sm text-slate-500">{msg}</p>}
            </div>
          </form>
        </motion.div>

        {/* RINGKASAN (sticky) */}
        <motion.aside
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="card p-4 h-max sticky top-[7.5rem]"
        >
          <h3 className="font-semibold mb-2">
            {t("checkout.summary", { defaultValue: "Ringkasan" })} — <span className="text-sky-700 dark:text-sky-300">{audienceLabel}</span>
          </h3>

          {items.length === 0 ? (
            <p className="text-slate-500">{t("checkout.cartEmptyShort", { defaultValue: "Keranjang kosong" })}</p>
          ) : (
            <>
              <ul className="space-y-2">
                {items.map((it) => {
                  const pax = Math.max(1, n(it.pax, 1));
                  const qty = Math.max(1, n(it.qty, 1));
                  const price = n(it.price);
                  const subtotal = price * pax * qty;
                  const aud = it.audience === "foreign" ? "Foreign" : "Domestik";
                  return (
                    <li key={`${it.id}-${pax}-${it.audience || "domestic"}`} className="flex items-start justify-between gap-2">
                      <span className="text-sm">
                        <span className="font-medium">{it.title}</span>{" "}
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          {aud}
                        </span>
                        <br />
                        <span className="text-slate-500 dark:text-slate-400 text-xs">
                          {pax} {t("home.pax", { defaultValue: "pax" })} × {qty} • {formatMoneyFromIDR(price, currency, fx, locale)}/pax
                        </span>
                      </span>
                      <span className="font-medium">{formatMoneyFromIDR(subtotal, currency, fx, locale)}</span>
                    </li>
                  );
                })}
              </ul>

              <hr className="my-3 border-slate-200 dark:border-slate-800" />
              <div className="flex items-center justify-between font-semibold">
                <span>{t("checkout.total", { defaultValue: "Total" })}</span>
                <span>{formatMoneyFromIDR(grandTotal, currency, fx, locale)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {audience === "foreign"
                  ? t("checkout.noteForeign", { defaultValue: "Termasuk penyesuaian untuk wisatawan mancanegara." })
                  : t("checkout.noteDomestic", { defaultValue: "Harga khusus wisatawan domestik." })}
              </p>
            </>
          )}
        </motion.aside>
      </div>
    </div>
  );
}
