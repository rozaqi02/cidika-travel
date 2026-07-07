// src/components/Navbar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun, LogOut, ShieldCheck, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient.js";
import { AnimatePresence, motion } from "framer-motion";
import ReactCountryFlag from "react-country-flag";

/* ====== CONFIG ====== */
const LANGS = [
  { code: "en", label: "English", country: "US" },
  { code: "id", label: "Indonesia", country: "ID" },
  { code: "ja", label: "\u65e5\u672c\u8a9e", country: "JP" },
];

/* ====== HOOKS ====== */
function usePrefersReducedMotion() {
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

function useScrollAtTop() {
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const onScroll = () => setAtTop((window.scrollY || 0) < 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return atTop;
}

function cx(...x) {
  return x.filter(Boolean).join(" ");
}

/* ====== COMPONENT ====== */
export default function Navbar() {
  const { theme, setTheme } = useTheme();
  usePrefersReducedMotion();
  const atTop = useScrollAtTop();

  const navigate = useNavigate();

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  const { t, i18n } = useTranslation();
  const { role, session } = useAuth();
  const isAdmin = role === "admin";
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const activeLang = useMemo(() => {
    const code2 = (i18n.language || i18n.resolvedLanguage || "id").slice(0, 2);
    return LANGS.find((l) => l.code === code2) || LANGS[0];
  }, [i18n.language, i18n.resolvedLanguage]);

  const adminLabels = useMemo(() => ({
    dashboard: t("admin.menu.dashboard", { defaultValue: "Dashboard" }),
    orders: t("admin.menu.orders", { defaultValue: "Orders" }),
    customize: t("admin.menu.customize", { defaultValue: "Customize" }),
  }), [t]);

  const menuItems = useMemo(() => {
    if (isAdmin) {
      return [
        { to: "/admin", label: adminLabels.dashboard, end: true },
        { to: "/admin/orderan", label: adminLabels.orders },
        { to: "/admin/kustomisasi", label: adminLabels.customize },
      ];
    }
    return [
      { to: "/", label: t("nav.home", { defaultValue: "Home" }), end: true },
      { to: "/explore", label: t("nav.explore", { defaultValue: "Explore" }) },
      { to: "/destinasi", label: t("nav.destinasi", { defaultValue: "Destinations" }) },
      { to: "/faq", label: t("nav.faq", { defaultValue: "FAQ" }) },
      { to: "/contact", label: t("nav.contact", { defaultValue: "Contact" }) },
    ];
  }, [isAdmin, t, adminLabels]);

  useEffect(() => {
    setLangOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const onChangeLanguage = (code) => {
    i18n.changeLanguage(code).then(() => {
      try { localStorage.setItem("i18nextLng", code); } catch {}
      setLangOpen(false);
    });
  };

  const headerBg = "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50";
  const headerShadow = atTop ? "" : "shadow-sm";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 translate-y-0"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className={cx(headerBg, headerShadow)}>
        <div className="container flex items-center justify-between h-16">

          {/* --- LEFT: LOGO --- */}
          <div className="flex-shrink-0 w-[140px] md:w-[180px]">
            {isAdmin ? (
              <Link to="/admin" className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1">
                <ShieldCheck className="text-sky-500" size={20} />
                <span>Admin<span className="text-sky-500">Panel</span></span>
              </Link>
            ) : (
              <Link to="/">
                <motion.div
                  className="relative block h-10 w-full"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  aria-label="CIDIKA TRAVEL"
                >
                  <img src="/biru.png" alt="CIDIKA" className="absolute h-full w-auto object-contain left-0 dark:opacity-0 transition-opacity duration-300" />
                  <img src="/putih.png" alt="CIDIKA" className="absolute h-full w-auto object-contain left-0 opacity-0 dark:opacity-100 transition-opacity duration-300" />
                </motion.div>
              </Link>
            )}
          </div>

          {/* --- CENTER: DESKTOP PILL NAV --- */}
          <div className="hidden lg:flex flex-1 justify-center">
            <nav className="flex items-center gap-1 p-1 rounded-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 shadow-inner backdrop-blur-sm">
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className="relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full shadow-sm border border-black/5 dark:border-white/10"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                      <span className={`relative z-10 ${isActive ? "text-sky-700 dark:text-sky-400 font-bold" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* --- RIGHT: ACTIONS (mobile + desktop) --- */}
          <div className="flex items-center justify-end gap-1 sm:gap-2 lg:gap-3 lg:w-[180px]">
            <motion.button
              whileHover={{ rotate: 45, scale: 1.1 }}
              whileTap={{ rotate: -45, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300 }}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 sm:p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={t("nav.theme", { defaultValue: "Theme" })}
              aria-label={t("nav.theme", { defaultValue: "Theme" })}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>

            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all text-sm font-medium"
                aria-expanded={langOpen}
                aria-haspopup="listbox"
              >
                <ReactCountryFlag countryCode={activeLang.country} svg style={{ width: "1.2em", height: "1.2em", borderRadius: "50%" }} />
                <span className="uppercase text-xs text-slate-600 dark:text-slate-300">{activeLang.code}</span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50 origin-top-right"
                    role="listbox"
                  >
                    {LANGS.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => onChangeLanguage(l.code)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${activeLang.code === l.code ? "bg-sky-50 dark:bg-sky-900/20 text-sky-600 font-medium" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
                        role="option"
                        aria-selected={activeLang.code === l.code}
                      >
                        <ReactCountryFlag countryCode={l.country} svg style={{ borderRadius: "2px" }} />
                        <span>{l.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {session ? (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLogout}
                className="p-1.5 sm:p-2 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title={t("nav.logout", { defaultValue: "Logout" })}
                aria-label={t("nav.logout", { defaultValue: "Logout" })}
              >
                <LogOut size={18} />
              </motion.button>
            ) : (
              <Link
                to="/admin/login"
                title={t("nav.adminAccess", { defaultValue: "Admin access" })}
                aria-label={t("nav.adminAccess", { defaultValue: "Admin access" })}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 sm:p-2 rounded-full text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                >
                  <ShieldCheck size={18} />
                </motion.div>
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}