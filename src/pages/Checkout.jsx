// src/pages/Checkout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next"; // Import
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabaseClient.js";
import { useLocation, useNavigate } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, User, Mail, Phone, Calendar, FileText, 
  ShieldCheck, Lock, CheckCircle2, ArrowRight 
} from "lucide-react";

const WA_NUMBER = "+62895630193926"; 
const SNAP_KEY = "order:justPlaced";
const SNAP_TTL_MS = 1000 * 60 * 30; 

export default function Checkout() {
  const { t, i18n } = useTranslation(); // Hook
  const { items, clear, setAll } = useCart();
  const location = useLocation();
  const nav = useNavigate();
  const { fx, currency, locale } = useCurrency();

  // === Load Items ===
  useEffect(() => {
    const fromState = location.state?.items;
    if (Array.isArray(fromState) && fromState.length) {
      setAll(fromState);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, setAll]);

  // === State ===
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // === Helpers ===
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
  const audienceLabel = audience === "foreign"
      ? t("checkout.audienceForeign")
      : t("checkout.audienceDomestic");

  const labelForAudience = (aud) =>
    aud === "foreign"
      ? t("checkout.audienceForeign")
      : t("checkout.audienceDomestic");

  // === WA Message Builder (Fully Translated) ===
  const buildWAMessage = (summary) => {
    const lines = [];
    lines.push(t("checkout.wa.header"));
    lines.push("");
    lines.push(`${t("checkout.wa.name")}: ${summary.name}`);
    if (summary.phone) lines.push(`${t("checkout.wa.phone")}: ${summary.phone}`);
    if (summary.email) lines.push(`${t("checkout.wa.email")}: ${summary.email}`);
    lines.push(`${t("checkout.wa.date")}: ${summary.date}`);
    lines.push(`${t("checkout.wa.audience")}: ${labelForAudience(summary.audience)}`);
    lines.push("");
    lines.push(t("checkout.wa.items"));
    items.forEach((it) => {
      const pax = Math.max(1, n(it.pax, 1));
      const qty = Math.max(1, n(it.qty, 1));
      const price = n(it.price);
      const subtotal = price * pax * qty;
      const tag = labelForAudience(it.audience === "foreign" ? "foreign" : "domestic");
      lines.push(
        `• ${it.title} (${tag}) — ${pax} ${t("home.pax")} × ${qty} = ${formatMoneyFromIDR(
          subtotal, currency, fx, locale
        )}`
      );
    });
    lines.push("");
    lines.push(`${t("checkout.wa.total")}: ${formatMoneyFromIDR(summary.grandTotal, currency, fx, locale)}`);
    if (summary.public_code) lines.push(`${t("checkout.wa.code")}: ${summary.public_code}`);
    lines.push("");
    lines.push(t("checkout.wa.footer"));
    return encodeURIComponent(lines.join("\n"));
  };

  const buildWAFromSnapshot = (snap) => {
    const lines = [];
    lines.push(t("checkout.wa.header"));
    lines.push("");
    lines.push(`${t("checkout.wa.name")}: ${snap.form.name}`);
    lines.push(`${t("checkout.wa.code")}: ${snap.code}`);
    lines.push(`${t("checkout.wa.total")}: ${formatMoneyFromIDR(n(snap.totals?.grand), currency, fx, locale)}`);
    lines.push("");
    lines.push(t("checkout.success.confirmNote"));
    return encodeURIComponent(lines.join("\n"));
  };

  // === Snapshot Logic ===
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

  const [justPlaced, setJustPlaced] = useState(() => readFreshSnapshot());
  const [confirmSent, setConfirmSent] = useState(false);

  const tryLoadSnapshot = () => {
    const fresh = readFreshSnapshot();
    if (fresh) {
      setJustPlaced(fresh);
      setLoading(false);
    }
  };

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

  // === Submit Handler ===
  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!items.length) {
      setMsg(t("checkout.cartEmpty"));
      return;
    }

    setLoading(true);
    setMsg(t("checkout.creating"));
    
    await new Promise((resolve) => setTimeout(resolve, 800));

    let waTab = null;
    try { waTab = window.open("about:blank", "_blank"); } catch {}

    try {
      const p_date = form.date || today;
      const payload = {
        p_package_id: first?.id || null,
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
          price_idr: n(it.price) * Math.max(1, n(it.pax, 1)),
        })),
      };

      const { data, error } = await supabase.rpc("place_order_v3", payload);
      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      const public_code = row?.public_code || null;

      const snap = snapshotFromCurrent({ public_code, p_date });
      const text = buildWAMessage({
        name: form.name, phone: form.phone, email: form.email,
        date: p_date, audience, grandTotal, public_code, items,
      });
      const waUrl = `https://wa.me/${WA_NUMBER}?text=${text}`;

      saveSnapshot(snap);
      setJustPlaced(snap);
      setConfirmSent(false);
      setLoading(false);
      setMsg("");

      if (waTab && !waTab.closed) {
        try { waTab.location = waUrl; waTab.focus?.(); } catch { window.location.href = waUrl; }
      } else {
        window.open(waUrl, "_blank") || (window.location.href = waUrl);
      }
      clear();
    } catch (e) {
      console.error(e);
      if (e.message?.includes("429")) {
        setMsg(t("checkout.rateLimit"));
      } else {
        setMsg(t("checkout.failed"));
      }
      setLoading(false);
      if (waTab) waTab.close();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Minimalist Sticky Header */}
      <div className="sticky top-0 z-30 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => nav(-1)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={t("back")}
            >
              <ArrowLeft size={20} className="text-slate-700 dark:text-slate-300"/>
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"/>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500"/>
              <span className="font-semibold text-slate-900 dark:text-white tracking-tight">Secure Checkout</span>
            </div>
          </div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            CIDIKA TRAVEL
          </div>
        </div>
      </div>

      <div className="container mt-8">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: FORM */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800"
            >
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                {t("checkout.details")}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {i18n.language === 'id' ? 'Informasi ini digunakan untuk konfirmasi e-ticket.' : 'Used for e-ticket confirmation.'}
              </p>

              <form id="checkout-form" onSubmit={onSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                      {t("checkout.name")}
                    </label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18}/>
                      <input 
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                        placeholder="John Doe"
                        value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                      {t("checkout.email")}
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18}/>
                      <input 
                        type="email"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                        placeholder="email@example.com"
                        value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                      {t("checkout.phone")}
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18}/>
                      <input 
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                        placeholder="+62..."
                        value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                      {t("checkout.date")}
                    </label>
                    <div className="relative group">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18}/>
                      <input 
                        type="date"
                        min={today}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                        value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                        onFocus={() => !form.date && setForm(f => ({...f, date: today}))}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                    {t("checkout.notes")}
                  </label>
                  <div className="relative group">
                    <FileText className="absolute left-3.5 top-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18}/>
                    <textarea 
                      rows="3"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all resize-none"
                      placeholder="..."
                      value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    />
                  </div>
                </div>
              </form>
            </motion.div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 opacity-80 pointer-events-none grayscale-[0.5]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white">Payment Method</h3>
                <Lock size={16} className="text-slate-400"/>
              </div>
              <p className="text-sm text-slate-500">
                Managed via WhatsApp securely.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="lg:col-span-5 xl:col-span-4">
             <motion.div 
               initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
               className="sticky top-24"
             >
               <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
                 <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                   <h3 className="font-bold text-slate-900 dark:text-white">
                     {t("checkout.summary")}
                   </h3>
                   <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                     {audienceLabel}
                   </span>
                 </div>

                 <div className="p-6 space-y-5">
                   {items.length === 0 ? (
                     <p className="text-center text-slate-500 py-4">{t("checkout.cartEmptyShort")}</p>
                   ) : (
                     <div className="space-y-4">
                       {items.map((it, idx) => {
                          const pax = Math.max(1, n(it.pax, 1));
                          const qty = Math.max(1, n(it.qty, 1));
                          const price = n(it.price);
                          const subtotal = price * pax * qty;
                          return (
                            <div key={idx} className="flex gap-3">
                              <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400">
                                <FileText size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{it.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {pax} {t("home.pax")} &times; {qty} Item
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                  {formatMoneyFromIDR(subtotal, currency, fx, locale)}
                                </p>
                              </div>
                            </div>
                          )
                       })}
                     </div>
                   )}

                   <div className="h-px bg-dashed border-t border-slate-200 dark:border-slate-700 my-4" />

                   <div className="flex items-center justify-between">
                     <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                     <span className="font-medium text-slate-900 dark:text-white">
                       {formatMoneyFromIDR(grandTotal, currency, fx, locale)}
                     </span>
                   </div>
                   
                   <div className="mt-4 p-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-between shadow-lg shadow-slate-900/20">
                     <div>
                       <p className="text-xs opacity-80 font-medium uppercase tracking-wider">{t("checkout.success.total")}</p>
                       <p className="text-xl font-bold mt-0.5">
                         {formatMoneyFromIDR(grandTotal, currency, fx, locale)}
                       </p>
                     </div>
                     <ShieldCheck className="opacity-80" size={24}/>
                   </div>

                   <button 
                     form="checkout-form"
                     disabled={loading || items.length === 0}
                     className="w-full btn btn-primary py-4 rounded-xl font-bold text-base shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all flex items-center justify-center gap-2"
                   >
                     {loading ? (
                       <span className="animate-pulse">{t("checkout.processing")}</span>
                     ) : (
                       <>
                         {t("checkout.submit")}
                         <ArrowRight size={18}/>
                       </>
                     )}
                   </button>
                   
                   {msg && (
                     <p className="text-center text-sm text-red-500 mt-2 bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
                       {msg}
                     </p>
                   )}

                   <p className="text-center text-xs text-slate-400 mt-2">
                     {audience === "foreign" ? t("checkout.noteForeign") : t("checkout.noteDomestic")}
                   </p>
                 </div>
               </div>
             </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {justPlaced && (
          <motion.div
            key="success-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
            
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-8 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"/>
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                  className="w-16 h-16 bg-white text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <CheckCircle2 size={32} strokeWidth={3}/>
                </motion.div>
                <h2 className="text-2xl font-bold mb-1">{t("checkout.success.title")}</h2>
                <p className="text-sky-100 text-sm">{t("checkout.success.body")}</p>
              </div>

              <div className="p-6 relative">
                <div className="absolute -top-3 left-0 w-6 h-6 bg-slate-900/80 rounded-full translate-x-[-50%]"/>
                <div className="absolute -top-3 right-0 w-6 h-6 bg-slate-900/80 rounded-full translate-x-[50%]"/>

                <div className="space-y-4 text-center">
                  {justPlaced.code && (
                     <div className="bg-slate-50 dark:bg-slate-800 py-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                       <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{t("checkout.success.code")}</p>
                       <p className="text-xl font-mono font-bold text-slate-900 dark:text-white tracking-wide">
                         {justPlaced.code}
                       </p>
                     </div>
                  )}

                  <div className="flex items-center justify-between text-sm px-2">
                     <span className="text-slate-500">{t("checkout.success.total")}</span>
                     <span className="font-bold text-slate-900 dark:text-white">
                       {formatMoneyFromIDR(justPlaced.totals?.grand, currency, fx, locale)}
                     </span>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <a
                    href={`https://wa.me/${WA_NUMBER}?text=${buildWAFromSnapshot(justPlaced)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full btn btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-sky-500/20"
                    onClick={() => setConfirmSent(true)}
                  >
                    <Phone size={18}/>
                    {t("checkout.success.contactAdmin")}
                  </a>
                  
                  <button
                    className="w-full py-3.5 text-slate-500 hover:text-slate-800 dark:hover:text-white transition font-medium text-sm"
                    disabled={!confirmSent}
                    onClick={() => {
                      try { localStorage.removeItem(SNAP_KEY); } catch {}
                      nav("/");
                    }}
                  >
                    {confirmSent ? t("checkout.success.goHome") : t("checkout.success.mustConfirmHint")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}