// src/pages/admin/Reset.jsx
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";

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

export default function Reset() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPass] = useState("");
  const [confirmPassword, setConfirmPass] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  const wrapRef = useRef(null);
  const cardRef = useRef(null);
  const reduced = useReduced();

  // Deteksi jika ini reset flow (dari email link)
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "recovery") {
      setIsRecovery(true);
      // Supabase auto-signs in user via token, tapi kita fokus ke form update
    } else {
      // Bukan reset, redirect ke login
      navigate("/admin/login");
    }
  }, [searchParams, navigate]);

  // Parallax blobs [sama seperti Login]
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const on = (e) => {
      const r = el.getBoundingClientRect();
      const cx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const cy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      el.style.setProperty("--px", String(reduced ? 0 : cx));
      el.style.setProperty("--py", String(reduced ? 0 : cy));

      const card = cardRef.current;
      if (card && !reduced) {
        const max = 6;
        card.style.transform = `rotateX(${(-cy * max).toFixed(2)}deg) rotateY(${(cx * max).toFixed(2)}deg) translateZ(0)`;
      }
    };
    window.addEventListener("mousemove", on, { passive: true });
    return () => window.removeEventListener("mousemove", on);
  }, [reduced]);

  useEffect(() => {
    const reset = () => {
      if (cardRef.current) cardRef.current.style.transform = "";
    };
    window.addEventListener("mouseleave", reset);
    return () => window.removeEventListener("mouseleave", reset);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErr("Password konfirmasi tidak cocok.");
      return;
    }
    if (newPassword.length < 6) {
      setErr("Password minimal 6 karakter.");
      return;
    }
    setErr("");
    setMsg("Memperbarui password...");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      console.error('Update error:', error);
      setErr(`Gagal update: ${error.message}`);
      setMsg("");
    } else {
      setMsg("Password berhasil diupdate! Redirect ke login...");
      setTimeout(() => navigate("/admin/login"), 2000);
    }
  };

  if (!isRecovery) {
    return null; // Akan redirect otomatis
  }

  const passValid = newPassword.length >= 6 && newPassword === confirmPassword;

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

      <div className="container relative mx-auto px-4 py-16 grid place-items-center">
        <motion.div
          initial={{ opacity: 0, y: 18, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: reduced ? 0 : 0.45, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl p-[1px] bg-[conic-gradient(from_120deg,rgba(56,189,248,.45),rgba(2,6,23,.0),rgba(99,102,241,.4),rgba(56,189,248,.45))] relative">
            <motion.div
              ref={cardRef}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl shadow-[0_30px_100px_rgba(2,6,23,.35)] p-6 transition-transform will-change-transform"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigate("/admin/login")}
                  className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 text-sm"
                >
                  <ArrowLeft size={16} /> Kembali
                </button>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-sky-600 dark:text-sky-400" size={20} />
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Reset Password
                  </h1>
                </div>
              </div>

              {/* Alerts */}
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

              {/* Form */}
              <form onSubmit={onSubmit} className="grid gap-3">
                {/* Password Baru */}
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/50 pointer-events-none"
                  />
                  <input
                    id="new-password"
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="peer w-full rounded-xl bg-white/70 dark:bg-white/10 text-slate-900 dark:text-white pl-9 pr-10 py-3 border border-slate-300 dark:border-white/10 focus:ring-4 focus:ring-sky-500/25 focus:border-sky-500/70 outline-none transition"
                    placeholder="Password baru"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-white/70"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Konfirmasi Password */}
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/50 pointer-events-none"
                  />
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="peer w-full rounded-xl bg-white/70 dark:bg-white/10 text-slate-900 dark:text-white pl-9 pr-4 py-3 border border-slate-300 dark:border-white/10 focus:ring-4 focus:ring-sky-500/25 focus:border-sky-500/70 outline-none transition"
                    placeholder="Konfirmasi password baru"
                    autoComplete="new-password"
                    required
                  />
                </div>
                {!passValid && (newPassword || confirmPassword) && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 -mt-1">
                    Password harus cocok dan minimal 6 karakter.
                  </p>
                )}

                <button
                  className="mt-2 btn btn-primary w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[.98] transition text-white"
                  disabled={loading || !passValid}
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}{" "}
                  Update Password
                </button>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}