// src/pages/admin/Reset.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Lock, Eye, EyeOff, Loader2, ArrowLeft, KeyRound } from "lucide-react";

export default function Reset() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [newPassword, setNewPass] = useState("");
  const [confirmPassword, setConfirmPass] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  
  // Kita asumsikan user sudah diarahkan ke sini
  // Event listener auth di bawah akan memastikan user punya sesi valid
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Cek apakah user memiliki sesi (dari link email)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Jika tidak ada sesi, berarti link expired atau akses langsung
        navigate("/admin/login");
      } else {
        setIsReady(true);
      }
    };

    // Listener untuk menangani event PASSWORD_RECOVERY
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsReady(true);
      } else if (event === "SIGNED_OUT") {
        navigate("/admin/login");
      }
    });

    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return setErr(t("admin.reset.mismatch"));
    if (newPassword.length < 6) return setErr(t("admin.reset.minChar"));
    
    setErr("");
    setMsg(t("admin.reset.process"));
    setLoading(true);
    
    // Update password untuk user yang sedang login (hasil klik link email)
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    setLoading(false);
    
    if (error) {
      setErr(error.message);
      setMsg("");
    } else {
      setMsg(t("admin.reset.success"));
      // Logout dan redirect ke login
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/admin/login");
      }, 2000);
    }
  };

  if (!isReady) {
    // Loading state sementara cek sesi
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8"
        >
          {/* ... (SISA KODE TAMPILAN SAMA SEPERTI SEBELUMNYA) ... */}
          {/* Copy paste bagian JSX return dari file Reset.jsx sebelumnya mulai dari <button onClick...> */}
          <button
            onClick={() => navigate("/admin/login")}
            className="group flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            {t("back")}
          </button>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400 mb-4">
              <KeyRound size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t("admin.reset.title")}
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              {t("admin.reset.subtitle")}
            </p>
          </div>

          <AnimatePresence mode="wait">
             {err && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">{err}</div>}
             {msg && !err && <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-sm">{msg}</div>}
          </AnimatePresence>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t("admin.reset.newPass")}
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  placeholder="Min 6 chars"
                />
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                   {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t("admin.reset.confirmPass")}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  placeholder="..."
                />
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-lg shadow-sky-500/20 transition-all"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : t("admin.reset.btn")}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}