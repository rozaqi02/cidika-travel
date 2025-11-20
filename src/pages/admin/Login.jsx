// src/pages/admin/Login.jsx
import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, LayoutDashboard, Globe } from "lucide-react";

export default function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState(localStorage.getItem("adm_email") || "");
  const [password, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(!!localStorage.getItem("adm_email"));

  // Language Switcher Logic
  const toggleLang = () => {
    const current = i18n.language;
    const next = current === "en" ? "id" : current === "id" ? "ja" : "en";
    i18n.changeLanguage(next);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    
    await new Promise(r => setTimeout(r, 500));

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setErr(error.message === "Invalid login credentials" ? t("misc.error") : error.message);
    } else {
      if (remember) localStorage.setItem("adm_email", email);
      else localStorage.removeItem("adm_email");
      window.location.replace("/admin");
    }
  };

  const onForgot = async () => {
    if (!email) {
      setErr(t("admin.login.email") + " required.");
      return;
    }
    setErr("");
    setMsg(t("misc.loading"));
    const resetUrl = process.env.REACT_APP_RESET_URL || window.location.origin + '/admin/reset';
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl,
    });
    
    if (error) {
      setErr(error.message);
      setMsg("");
    } else {
      setMsg("Check email.");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-slate-950">
      
      {/* --- LEFT SIDE (Visual / Branding) --- */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900 items-center justify-center">
        <div 
          className="absolute inset-0 z-0 opacity-60 mix-blend-overlay"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-sky-600/40 to-slate-900/90 z-10" />
        
        <div className="relative z-20 p-12 max-w-lg text-white">
          <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
            <LayoutDashboard size={24} className="text-sky-300" />
          </div>
          <h2 className="text-4xl font-bold font-hero mb-4 leading-tight tracking-tight whitespace-pre-line">
            {t("admin.loginHero.title")}
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed mb-8 font-sans">
            {t("admin.loginHero.desc")}
          </p>
          
          <div className="flex gap-8 border-t border-white/10 pt-8">
            <div>
              <p className="text-3xl font-bold text-white">100%</p>
              <p className="text-sm text-slate-400 uppercase tracking-wider mt-1">{t("admin.loginHero.secure")}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">24/7</p>
              <p className="text-sm text-slate-400 uppercase tracking-wider mt-1">{t("admin.loginHero.monitoring")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE (Form) --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Language Switcher Absolute */}
        <button 
          onClick={toggleLang}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors flex items-center gap-1 text-xs font-bold uppercase"
        >
          <Globe size={16} /> {i18n.language}
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[400px]"
        >
          <div className="lg:hidden mb-8 text-center">
             <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-hero">Cidika Admin</h1>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight font-sans">
              {t("admin.login.title")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {t("admin.login.loggingIn")}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {err && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"/> {err}
              </motion.div>
            )}
            {msg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"/> {msg}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t("admin.login.email")}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-sans"
                  placeholder="admin@cidika.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("admin.login.password")}</label>
                <button type="button" onClick={onForgot} className="text-xs font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 transition-colors">
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPass(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-sans"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center ml-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500/20 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                Remember Email
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-white bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-slate-900/20 dark:shadow-sky-900/20 font-medium text-sm sm:text-base"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {t("admin.login.submit")} <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>
          
          <div className="mt-10 text-center">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Cidika Travel. Admin Portal.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}