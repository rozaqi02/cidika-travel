// src/pages/Checkout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabaseClient.js";
import { useLocation, useNavigate } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";
import { motion, AnimatePresence } from "framer-motion";

const WA_NUMBER = "+62895630193926"; // ganti jika perlu
const SNAP_KEY = "order:justPlaced";
const SNAP_TTL_MS = 1000 * 60 * 30; // 30 menit

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const { items, clear, setAll } = useCart();
  const location = useLocation();
  const nav = useNavigate();
  const { fx, currency, locale } = useCurrency();

  // ambil item yang dikirim dari Explore/PackageDetail
  useEffect(() => {
    const fromState = location.state?.items;
    if (Array.isArray(fromState) && fromState.length) {
      setAll(fromState);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, setAll]);

  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // ===== Helpers =====
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const n = (v, f = 0) => { const x = Number(v); return Number.isFinite(x) ? x : f; };

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

  const labelForAudience = (aud) =>
    aud === "foreign"
      ? t("checkout.audienceForeign", { defaultValue: "Foreign" })
      : t("checkout.audienceDomestic", { defaultValue: "Domestik" });

  // ===== Build text WA (multi-bahasa) =====
  const buildWAMessage = (summary) => {
    const lines = [];
    lines.push(t("checkout.wa.header", { defaultValue: "Halo Admin CIDIKA, saya ingin booking." }));
    lines.push("");
    lines.push(`${t("checkout.wa.name", { defaultValue: "Nama" })}: ${summary.name}`);
    if (summary.phone) lines.push(`${t("checkout.wa.phone", { defaultValue: "WA" })}: ${summary.phone}`);
    if (summary.email) lines.push(`${t("checkout.wa.email", { defaultValue: "Email" })}: ${summary.email}`);
    lines.push(`${t("checkout.wa.date", { defaultValue: "Tanggal" })}: ${summary.date}`);
    lines.push(`${t("checkout.wa.audience", { defaultValue: "Tipe" })}: ${labelForAudience(summary.audience)}`);
    lines.push("");
    lines.push(t("checkout.wa.items", { defaultValue: "Detail Item:" }));
    items.forEach((it) => {
      const pax = Math.max(1, n(it.pax, 1));
      const qty = Math.max(1, n(it.qty, 1));
      const price = n(it.price);
      const subtotal = price * pax * qty;
      const tag = labelForAudience(it.audience === "foreign" ? "foreign" : "domestic");
      lines.push(
        `• ${it.title} (${tag}) — ${pax} ${t("home.pax", { defaultValue: "pax" })} × ${qty} = ${formatMoneyFromIDR(
          subtotal, currency, fx, locale
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

  // ===== Snapshot untuk popup =====
  const snapshotFromCurrent = ({ public_code, p_date }) => ({
    _ts: Date.now(),
    code: public_code || null,
    lang: i18n.language?.slice(0, 2) || "id",
    audience,
    form: { name: form.name, email: form.email, phone: form.phone, date: p_date, notes: form.notes || "" },
    items: items.map((it) => ({
      title: it.title,
      audience: it.audience || "domestic",
      pax: Math.max(1, n(it.pax, 1)),
      qty: Math.max(1, n(it.qty, 1)),
      price: n(it.price)
    })),
    totals: { grand: grandTotal }
  });

  const saveSnapshot = (snap) => {
    try { localStorage.setItem(SNAP_KEY, JSON.stringify(snap)); } catch {}
  };
  const readFreshSnapshot = () => {
    try {
      const raw = localStorage.getItem(SNAP_KEY);
      if (!raw) return null;
      const snap = JSON.parse(raw);
      if (!snap?._ts || Date.now() - snap._ts > SNAP_TTL_MS) {
        localStorage.removeItem(SNAP_KEY);
        return null;
      }
      return snap;
    } catch {
      localStorage.removeItem(SNAP_KEY);
      return null;
    }
  };

  // ===== Popup sukses (ditampilkan segera setelah order sukses) =====
  const [justPlaced, setJustPlaced] = useState(() => readFreshSnapshot());
  const [confirmSent, setConfirmSent] = useState(false);

  const tryLoadSnapshot = () => {
    const fresh = readFreshSnapshot();
    if (fresh) {
      setJustPlaced(fresh);
      setLoading(false); // hentikan loading bila popup muncul
    }
  };

  // load saat halaman pertama kali dirender / saat kembali fokus
  useEffect(() => { tryLoadSnapshot(); }, []);
  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === "visible") tryLoadSnapshot(); };
    window.addEventListener("focus", tryLoadSnapshot);
    window.addEventListener("pageshow", tryLoadSnapshot);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", tryLoadSnapshot);
      window.removeEventListener("pageshow", tryLoadSnapshot);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // ===== Submit =====
const onSubmit = async (e) => {
  e.preventDefault();
  if (loading) return;
  if (!items.length) {
    setMsg(t("checkout.cartEmpty", { defaultValue: "Keranjang kosong." }));
    return;
  }

  // Disable button immediately to prevent multiple submissions
  setLoading(true);
  setMsg(t("checkout.creating", { defaultValue: "Membuat order..." }));

  // Add a short delay to simulate throttling
  await new Promise((resolve) => setTimeout(resolve, 1000));

  let waTab = null;
  try {
    waTab = window.open("about:blank", "_blank");
  } catch {
    console.warn("Popup blocked by browser");
  }

  try {
    const p_date = form.date || today;
const payload = {
  p_package_id: first?.id || null, // Use first item's ID or null
  p_date,
  p_pax: Math.max(1, n(first?.pax, 1)),
  p_customer_name: form.name,
  p_email: form.email,
  p_phone: form.phone || null,
  p_notes: form.notes || null,
  p_audience: audience,
  p_items: items.map((it) => ({
    item_name: it.title + (it.audience ? ` (${it.audience})` : ""),
    qty: Math.max(1, n(it.qty, 1)),
    price_idr: n(it.price) * Math.max(1, n(it.pax, 1)), // Total price per item (price * pax)
  })),
};
const { data, error } = await supabase.rpc("place_order_v3", payload);
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    const public_code = row?.public_code || null;

    const snap = snapshotFromCurrent({ public_code, p_date });
const text = buildWAMessage({
  name: form.name,
  phone: form.phone,
  email: form.email,
  date: p_date,
  audience,
  grandTotal,
  public_code,
  items,
});
const waUrl = `https://wa.me/${WA_NUMBER}?text=${text}`;

    saveSnapshot(snap);
    setJustPlaced(snap);
    setConfirmSent(false);
    setLoading(false);
    setMsg("");

  if (waTab && !waTab.closed) {
    try {
      waTab.location = waUrl;
      waTab.focus?.();
    } catch {
      window.location.href = waUrl;
    }
  } else {
    // Directly open WhatsApp URL without pre-opening blank tab
    window.open(waUrl, "_blank") || (window.location.href = waUrl);
  }

    clear();
  } catch (e) {
  console.error("Error details:", e.message, e.stack);
  if (e.message.includes("429")) {
    setMsg(t("checkout.rateLimit", { defaultValue: "Terlalu banyak permintaan. Coba lagi nanti atau hubungi support." }));
  } else {
    setMsg(e.message || t("checkout.failed", { defaultValue: "Gagal membuat order" }));
  }
  setLoading(false);
}
};

  const buildWAFromSnapshot = (snap) => {
    const lines = [];
    lines.push(t("checkout.wa.header", { defaultValue: "Halo Admin CIDIKA, saya ingin booking." }));
    lines.push("");
    lines.push(`${t("checkout.wa.name", { defaultValue: "Nama" })}: ${snap.form.name}`);
    if (snap.form.phone) lines.push(`${t("checkout.wa.phone", { defaultValue: "WA" })}: ${snap.form.phone}`);
    if (snap.form.email) lines.push(`${t("checkout.wa.email", { defaultValue: "Email" })}: ${snap.form.email}`);
    lines.push(`${t("checkout.wa.date", { defaultValue: "Tanggal" })}: ${snap.form.date}`);
    lines.push(`${t("checkout.wa.audience", { defaultValue: "Tipe" })}: ${labelForAudience(snap.audience)}`);
    lines.push("");
    lines.push(t("checkout.wa.items", { defaultValue: "Detail Item:" }));
    (snap.items || []).forEach((it) => {
      const subtotal = n(it.price) * Math.max(1, n(it.pax, 1)) * Math.max(1, n(it.qty, 1));
      const tag = labelForAudience(it.audience === "foreign" ? "foreign" : "domestic");
      lines.push(
        `• ${it.title} (${tag}) — ${it.pax} ${t("home.pax", { defaultValue: "pax" })} × ${it.qty} = ${formatMoneyFromIDR(
          subtotal, currency, fx, locale
        )}`
      );
    });
    lines.push("");
    lines.push(`${t("checkout.wa.total", { defaultValue: "Total" })}: ${formatMoneyFromIDR(n(snap.totals?.grand), currency, fx, locale)}`);
    if (snap.code) lines.push(`${t("checkout.wa.code", { defaultValue: "Kode" })}: ${snap.code}`);
    lines.push("");
    lines.push(t("checkout.success.confirmNote", { defaultValue: "Konfirmasi: data di atas benar. Mohon diproses, ya 🙏" }));
    return encodeURIComponent(lines.join("\n"));
  };

  // ===== UI =====
  return (
    <div className="container mt-4 space-y-4">
      {/* toolbar */}
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
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="lg:col-span-2 card p-4">
          <h2 className="font-semibold mb-2">{t("checkout.details", { defaultValue: "Detail Pemesan" })}</h2>
          <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3">
            <input className="border rounded-2xl px-3 py-2 dark:bg-slate-900 sm:col-span-2"
              placeholder={t("checkout.name", { defaultValue: "Nama Lengkap" })} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="border rounded-2xl px-3 py-2 dark:bg-slate-900" type="email"
              placeholder={t("checkout.email", { defaultValue: "Email" })} value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input className="border rounded-2xl px-3 py-2 dark:bg-slate-900"
              placeholder={t("checkout.phone", { defaultValue: "Telepon/WA" })} value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div className="flex flex-col">
              <label htmlFor="trip-date" className="text-xs mb-1 text-slate-600 dark:text-slate-300">
                {t("checkout.date", { defaultValue: "Tanggal Trip (YYYY-MM-DD)" })}
              </label>
              <input id="trip-date" type="date" className="border rounded-2xl px-3 py-2 dark:bg-slate-900"
                value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                min={today} onFocus={() => { if (!form.date) setForm((f) => ({ ...f, date: today })); }} />
            </div>
            <textarea className="border rounded-2xl px-3 py-2 dark:bg-slate-900 sm:col-span-2"
              placeholder={t("checkout.notes", { defaultValue: "Catatan" })} rows="4"
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="sm:col-span-2 flex items-center gap-3 mt-1">
              <button className="btn btn-primary" disabled={loading}>
                {loading ? t("checkout.processing", { defaultValue: "Memproses..." }) : t("checkout.submit", { defaultValue: "Buat Pesanan" })}
              </button>
              {msg && <p className="text-sm text-slate-500">{msg}</p>}
            </div>
          </form>
        </motion.div>

        {/* RINGKASAN */}
        <motion.aside initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }} className="card p-4 h-max sticky top-[7.5rem]">
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
                  const aud = labelForAudience(it.audience === "foreign" ? "foreign" : "domestic");
                  return (
                    <li key={`${it.id}-${pax}-${it.audience || "domestic"}`} className="flex items-start justify-between gap-2">
                      <span className="text-sm">
                        <span className="font-medium">{it.title}</span>{" "}
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          {aud}
                        </span>
                        <br />
                      <span className="text-slate-500 dark:text-slate-400 text-xs">
                        {pax} {t("home.pax")} × {qty} • {formatMoneyFromIDR(price, currency, fx, locale)}/{t("home.perPax")}
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

      {/* ===== SUCCESS MODAL ===== */}
      <AnimatePresence>
        {justPlaced && (
          <motion.div
            key="success-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => {}}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.96, y: 8, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 8, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative z-[61] w-[92vw] max-w-lg card p-6 text-center"
              role="dialog"
              aria-modal="true"
              aria-labelledby="order-success-title"
            >
              {/* Header */}
              <h3 id="order-success-title" className="text-xl font-bold">
                {t("checkout.success.title", { defaultValue: "Pesanan diterima!" })}
              </h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                {t("checkout.success.body", { defaultValue: "Admin kami akan segera memproses pesananmu." })}
              </p>

              {/* Summary */}
              <div className="mt-3 text-sm text-slate-500 space-y-1">
                {justPlaced.code && (
                  <div>
                    {t("checkout.success.code", { defaultValue: "Kode Pesanan" })}:{" "}
                    <span className="font-semibold">{justPlaced.code}</span>
                  </div>
                )}
                {Number.isFinite(justPlaced?.totals?.grand) && (
                  <div>
                    {t("checkout.success.total", { defaultValue: "Total" })}:{" "}
                    {formatMoneyFromIDR(justPlaced.totals.grand, currency, fx, locale)}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${buildWAFromSnapshot(justPlaced)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  onClick={() => setConfirmSent(true)}
                >
                  {t("checkout.success.contactAdmin", { defaultValue: "Konfirmasi Admin" })}
                </a>

                <button
                  className="btn btn-outline disabled:opacity-50"
                  disabled={!confirmSent}
                  onClick={() => {
                    try {
                      localStorage.removeItem(SNAP_KEY);
                    } catch {}
                    nav("/");
                  }}
                  title={
                    !confirmSent
                      ? t("checkout.success.mustConfirmHint", {
                          defaultValue: "Tekan 'Konfirmasi Admin' dulu",
                        })
                      : undefined
                  }
                >
                  {t("checkout.success.goHome", { defaultValue: "Ke Beranda" })}
                </button>
              </div>

              {/* Guard note */}
              {!confirmSent && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  {t("checkout.success.mustConfirm", {
                    defaultValue:
                      "Silakan tekan 'Konfirmasi Admin' terlebih dahulu sebelum kembali ke beranda.",
                  })}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}