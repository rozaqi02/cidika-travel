// src/pages/admin/Login.jsx
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

/**
 * Efek yang dibawa layar ini: [sama seperti sebelumnya]
 */

function useReduced() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!m) return;
    const on = () => setReduced(!!m.matches);
    on();
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState(localStorage.getItem("adm_email") || "");
  const [password, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(!!localStorage.getItem("adm_email"));
  const [capsOn, setCapsOn] = useState(false);

  const wrapRef = useRef(null);
  const cardRef = useRef(null);
  const reduced = useReduced();

  // Parallax blobs (9 layer) [sama seperti sebelumnya]
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const on = (e) => {
      const r = el.getBoundingClientRect();
      const cx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2); // -1..1
      const cy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      el.style.setProperty("--px", String(reduced ? 0 : cx));
      el.style.setProperty("--py", String(reduced ? 0 : cy));

      // tilt 3D kartu
      const card = cardRef.current;
      if (card && !reduced) {
        const max = 6; // derajat
        card.style.transform = `rotateX(${(-cy * max).toFixed(2)}deg) rotateY(${(cx * max).toFixed(2)}deg) translateZ(0)`;
      }
    };
    window.addEventListener("mousemove", on, { passive: true });
    return () => window.removeEventListener("mousemove", on);
  }, [reduced]);

  // Reset tilt saat mouse keluar jendela [sama]
  useEffect(() => {
    const reset = () => {
      if (cardRef.current) cardRef.current.style.transform = "";
    };
    window.addEventListener("mouseleave", reset);
    return () => window.removeEventListener("mouseleave", reset);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg(t("admin.login.loggingIn", { defaultValue: "Logging in..." }));
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr(error.message);
      setMsg("");
    } else {
      if (remember) localStorage.setItem("adm_email", email);
      else localStorage.removeItem("adm_email");
      window.location.replace("/admin");
    }
  };

  const onForgot = async () => {
    if (!email) {
      setErr(t("admin.login.enterEmail", { defaultValue: "Masukkan email dulu untuk reset." }));
      return;
    }
    setErr("");
    setMsg(t("admin.login.sendingReset", { defaultValue: "Mengirim tautan reset..." }));
    // Fix redirectTo: Gunakan domain produksi (atau env var REACT_APP_SITE_URL untuk dev/prod switch)
    const resetUrl = process.env.REACT_APP_RESET_URL || 'https://cidikatravel.com/admin/reset';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl,
    });
    if (error) {
      console.error('Reset error:', error); // Log untuk debug
      setErr(`Gagal kirim email: ${error.message}`);
      setMsg("");
    } else {
      setMsg(t("admin.login.resetSent", { defaultValue: "Tautan reset dikirim ke email. Cek inbox/spam." }));
    }
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div ref={wrapRef} className="min-h-screen relative overflow-hidden login-bg">
      {/* Grain overlay [sama] */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 mix-blend-soft-light opacity-[.06] dark:opacity-[.08]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' opacity='.6'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* 9 Parallax blobs [sama] */}
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-full blur-3xl opacity-30"
          style={{
            width: 280 + ((i % 3) * 60),
            height: 280 + ((i % 3) * 60),
            background:
              i % 2
                ? "radial-gradient(circle at 30% 30%, #38bdf8, transparent)"
                : "radial-gradient(circle at 70% 70%, #3b82f6, transparent)",
            transform: `translate3d(calc(var(--px,0)*${18 + i * 7}px), calc(var(--py,0)*${18 + i * 7}px), 0)`,
            top: i % 2 ? `${8 + i * 6}%` : "auto",
            bottom: i % 2 ? "auto" : `${6 + ((i * 5) % 20)}%`,
            left: i % 3 ? `${4 + ((i * 7) % 30)}%` : "auto",
            right: i % 3 ? "auto" : `${6 + ((i * 9) % 30)}%`,
          }}
        />
      ))}

      {/* Content [sama] */}
      <div className="container relative mx-auto px-4 py-16 grid place-items-center">
        <motion.div
          initial={{ opacity: 0, y: 18, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: reduced ? 0 : 0.45, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Kartu dengan border gradien [sama] */}
          <div className="rounded-2xl p-[1px] bg-[conic-gradient(from_120deg,rgba(56,189,248,.45),rgba(2,6,23,.0),rgba(99,102,241,.4),rgba(56,189,248,.45))] relative">
            <motion.div
              ref={cardRef}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl shadow-[0_30px_100px_rgba(2,6,23,.35)] p-6 transition-transform will-change-transform"
            >
              {/* Header [sama] */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-sky-600 dark:text-sky-400" size={20} />
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t("admin.login.title", { defaultValue: "Admin Login" })}
                  </h1>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-white/60">CIDIKA TRAVEL</span>
              </div>

              {/* Alerts [sama] */}
              <AnimatePresence>
                {!!err && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200 px-3 py-2 text-sm"
                  >
                    {err}
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {!!msg && !err && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 px-3 py-2 text-sm"
                  >
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form [sama, termasuk onForgot yang sudah diupdate] */}
              <form onSubmit={onSubmit} className="grid gap-3">
                {/* Email [sama] */}
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/50 pointer-events-none"
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyUp={(e) => setCapsOn(e.getModifierState && e.getModifierState("CapsLock"))}
                    className="peer w-full rounded-xl bg-white/70 dark:bg-white/10 text-slate-900 dark:text-white pl-9 pr-20 py-3 border border-slate-300 dark:border-white/10 focus:ring-4 focus:ring-sky-500/25 focus:border-sky-500/70 outline-none transition"
                    placeholder="" // kosong agar tidak menimpa teks
                    aria-label={t("admin.login.email", { defaultValue: "Email" })}
                    autoComplete="username"
                    required
                  />
                  {/* Right hint (placeholder) */}
                  {!email && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-white/50">
                      {t("admin.login.email", { defaultValue: "Email" })}
                    </span>
                  )}
                </div>
                {!emailValid && email.length > 0 && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 -mt-1">
                    {t("admin.login.invalidEmail", { defaultValue: "Format email tidak valid" })}
                  </p>
                )}

                {/* Password [sama] */}
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/50 pointer-events-none"
                  />
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPass(e.target.value)}
                    onKeyUp={(e) => setCapsOn(e.getModifierState && e.getModifierState("CapsLock"))}
                    className="peer w-full rounded-xl bg-white/70 dark:bg-white/10 text-slate-900 dark:text-white pl-9 pr-20 py-3 border border-slate-300 dark:border-white/10 focus:ring-4 focus:ring-sky-500/25 focus:border-sky-500/70 outline-none transition"
                    placeholder=""
                    aria-label={t("admin.login.password", { defaultValue: "Password" })}
                    autoComplete="current-password"
                    required
                  />
                  {/* Right hint (placeholder) */}
                  {!password && (
                    <span className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-white/50">
                      {t("admin.login.password", { defaultValue: "Password" })}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-white/70"
                    aria-label={showPass ? t("admin.login.hidePassword", { defaultValue: "Sembunyikan password" }) : t("admin.login.showPassword", { defaultValue: "Tampilkan password" })}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {capsOn && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 -mt-1">
                    {t("admin.login.capsOn", { defaultValue: "Caps Lock aktif" })}
                  </p>
                )}

                {/* Remember + Forgot [sama, tapi onForgot sudah diupdate] */}
                <div className="flex items-center justify-between mt-1">
                  <label className="inline-flex items-center gap-2 text-slate-800 dark:text-white/80 text-xs">
                    <input
                      type="checkbox"
                      className="accent-sky-500"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    {t("admin.login.remember", { defaultValue: "Ingat email" })}
                  </label>
                  <button
                    type="button"
                    onClick={onForgot}
                    className="text-xs text-sky-700 dark:text-sky-300 hover:underline"
                  >
                    {t("admin.login.forgot", { defaultValue: "Lupa password?" })}
                  </button>
                </div>

                <button
                  className="mt-2 btn btn-primary w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[.98] transition text-white"
                  disabled={loading || !emailValid || !password}
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}{" "}
                  {t("admin.login.submit", { defaultValue: "Masuk" })}
                </button>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}