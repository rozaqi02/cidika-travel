// src/components/Navbar.jsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"; // Tambah useNavigate
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun, LogOut, UserRound, ChevronDown, X, Home, Compass, Map, HelpCircle, Phone, LayoutDashboard, ShoppingBag, PenTool } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient.js";
import { AnimatePresence, motion } from "framer-motion";
import ReactCountryFlag from "react-country-flag";

/* ====== CONFIG ====== */
const LANGS = [
  { code: "en", label: "English", country: "US" },
  { code: "id", label: "Indonesia", country: "ID" },
  { code: "ja", label: "日本語", country: "JP" },
];

/* ====== ICONS MAP FOR MOBILE ====== */
const ICONS = {
  "/": Home,
  "/explore": Compass,
  "/destinasi": Map,
  "/faq": HelpCircle,
  "/contact": Phone,
  "/admin": LayoutDashboard,
  "/admin/orderan": ShoppingBag,
  "/admin/kustomisasi": PenTool
};

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

function useHideOnScroll() {
  const [atTop, setAtTop] = useState(true);
  const [show, setShow] = useState(true);
  const lastY = useRef(0);
  const ticking = useRef(false);
  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        setAtTop(y < 4);
        const goingDown = y > lastY.current + 2;
        const goingUp = y < lastY.current - 2;
        if (goingDown) setShow(false);
        else if (goingUp) setShow(true);
        lastY.current = y;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return { atTop, show };
}

function cx(...x) {
  return x.filter(Boolean).join(" ");
}

/* ====== COMPONENT ====== */
export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const reduced = usePrefersReducedMotion();
  const { atTop, show } = useHideOnScroll();
  
  // Hooks Navigasi
  const navigate = useNavigate();

  // State
  const [open, setOpen] = useState(false); // Mobile Sidebar
  const [langOpenDesktop, setLangOpenDesktop] = useState(false);
  const desktopLangRef = useRef(null);

  const { t, i18n } = useTranslation();
  const { role, session } = useAuth();
  const isAdmin = role === "admin";
  const location = useLocation();

  // === LOGIC LOGOUT YANG AMAN ===
  const handleLogout = async () => {
    try {
      // 1. Tunggu sampai Supabase benar-benar sign out
      await supabase.auth.signOut();
      
      // 2. Tutup sidebar mobile jika terbuka
      setOpen(false);

      // 3. Pindah ke halaman Home menggunakan React Router (SPA navigation)
      // Ini memicu AuthContext untuk update state tanpa refresh halaman
      navigate("/", { replace: true });
      
      // Opsional: Reload halaman jika state benar-benar nyangkut (biasanya tidak perlu)
      // window.location.reload(); 
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Derived State
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

  // Effects
  useEffect(() => { // Close sidebar on route change
    setOpen(false);
    setLangOpenDesktop(false);
  }, [location.pathname]);

  useEffect(() => { // Close lang dropdown on outside click
    const onDocClick = (e) => {
      if (desktopLangRef.current && !desktopLangRef.current.contains(e.target)) {
        setLangOpenDesktop(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => { // Lock scroll when mobile sidebar open
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const onChangeLanguage = (code) => {
    i18n.changeLanguage(code).then(() => {
      try { localStorage.setItem("i18nextLng", code); } catch {}
      setLangOpenDesktop(false);
    });
  };

  // Styles
  const headerBg = "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50";
  const headerShadow = atTop ? "" : "shadow-sm";

  return (
    <>
      <header
        className={cx("fixed top-0 left-0 right-0 z-40 transition-transform duration-300 will-change-transform", show || atTop ? "translate-y-0" : "-translate-y-full")}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className={cx(headerBg, headerShadow)}>
          <div className="container flex items-center justify-between h-16">
            
            {/* --- LEFT: LOGO (ANIMATED) --- */}
            <div className="flex-shrink-0 w-[140px] md:w-[180px]">
              {isAdmin ? (
                <Link to="/admin" className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1">
                  <LayoutDashboard className="text-sky-500" size={20}/>
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

            {/* --- RIGHT: ACTIONS (ANIMATED) --- */}
            <div className="hidden lg:flex items-center justify-end gap-3 w-[180px]">
               {/* Theme (Animated Rotation) */}
               <motion.button
                  whileHover={{ rotate: 45, scale: 1.1 }}
                  whileTap={{ rotate: -45, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title={t("misc.toggleTheme")}
                >
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </motion.button>

                {/* Lang (Dropdown) */}
                <div className="relative" ref={desktopLangRef}>
                  <button
                    onClick={() => setLangOpenDesktop(!langOpenDesktop)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all text-sm font-medium"
                  >
                    <ReactCountryFlag countryCode={activeLang.country} svg style={{ width: '1.2em', height: '1.2em', borderRadius: '50%' }} />
                    <span className="uppercase text-xs text-slate-600 dark:text-slate-300">{activeLang.code}</span>
                    <ChevronDown size={12} className={`text-slate-400 transition-transform ${langOpenDesktop ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {langOpenDesktop && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50 origin-top-right"
                      >
                        {LANGS.map((l) => (
                          <button
                            key={l.code}
                            onClick={() => onChangeLanguage(l.code)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${activeLang.code === l.code ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 font-medium' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                          >
                            <ReactCountryFlag countryCode={l.country} svg style={{ borderRadius: '2px' }} />
                            <span>{l.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Auth Toggle (Animated Scale) */}
                {session ? (
                   <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleLogout} 
                      className="p-2 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" 
                      title="Logout"
                   >
                      <LogOut size={18} />
                   </motion.button>
                ) : (
                   <Link to="/admin/login">
                      <motion.div 
                         whileHover={{ scale: 1.1 }}
                         whileTap={{ scale: 0.9 }}
                         className="p-2 rounded-full text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                      >
                        <UserRound size={18} />
                      </motion.div>
                   </Link>
                )}
            </div>

            {/* --- MOBILE TRIGGER --- */}
            <button 
              onClick={() => setOpen(true)} 
              className="lg:hidden p-2 -mr-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
               <div className="flex flex-col gap-1.5 w-6 items-end">
                <span className="h-0.5 w-full bg-current rounded-full" />
                <span className="h-0.5 w-3/4 bg-current rounded-full" />
                <span className="h-0.5 w-full bg-current rounded-full" />
              </div>
            </button>

          </div>
        </div>
      </header>

      {/* ====== MOBILE SIDEBAR (DRAWER) ====== */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[9998] bg-slate-900/20 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Sidebar Panel */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 z-[9999] w-[85%] max-w-[300px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl border-l border-slate-200/50 dark:border-slate-800/50 flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/50">
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Menu</span>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setOpen(false)}
                  className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
                >
                  <X size={24} />
                </motion.button>
              </div>

              {/* Sidebar Links */}
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {menuItems.map((item) => {
                  const Icon = ICONS[item.to] || ChevronDown;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => cx(
                        "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200",
                        isActive 
                          ? "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 font-semibold" 
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                      onClick={() => setOpen(false)} // Close sidebar on link click
                    >
                      <Icon size={20} className="opacity-70" />
                      <span className="text-base">{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>

              {/* Sidebar Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/30 space-y-4">
                {/* Theme Switcher */}
                <div className="flex items-center justify-between px-2">
                   <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Appearance</span>
                   <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                      <button 
                        onClick={() => setTheme('light')} 
                        className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        <Sun size={16}/>
                      </button>
                      <button 
                        onClick={() => setTheme('dark')} 
                        className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-slate-700 text-sky-400 shadow-sm' : 'text-slate-500'}`}
                      >
                        <Moon size={16}/>
                      </button>
                   </div>
                </div>

                {/* Language Grid */}
                <div className="grid grid-cols-3 gap-2">
                   {LANGS.map(l => (
                     <button
                       key={l.code}
                       onClick={() => onChangeLanguage(l.code)}
                       className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl border transition-all ${
                         activeLang.code === l.code
                           ? "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:border-sky-800 dark:text-sky-300"
                           : "border-transparent hover:bg-white dark:hover:bg-slate-800"
                       }`}
                     >
                        <ReactCountryFlag countryCode={l.country} svg style={{ borderRadius: '4px', width: '1.2em' }} />
                        <span className="text-[10px] font-bold uppercase">{l.code}</span>
                     </button>
                   ))}
                </div>

                {/* Auth Action */}
                {session ? (
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors text-sm font-semibold"
                  >
                    <LogOut size={16}/> Logout
                  </button>
                ) : (
                  <Link 
                    to="/admin/login"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity text-sm font-bold"
                  >
                    <UserRound size={16}/> Login
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}