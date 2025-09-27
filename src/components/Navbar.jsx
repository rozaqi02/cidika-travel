// src/components/Navbar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Menu, X, Moon, Sun, Globe, LogOut, UserRound, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient.js";
import { AnimatePresence, motion } from "framer-motion";

/* ====== Helpers ====== */
const LANGS = [
  { code: "en", label: "English",  flag: "🇬🇧" },
  { code: "id", label: "Indonesia", flag: "🇮🇩" },
  { code: "ja", label: "日本語",     flag: "🇯🇵" },
];

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
        const goingUp   = y < lastY.current - 2;
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
function cx(...x){ return x.filter(Boolean).join(" "); }

/* ====== Component ====== */
export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const reduced = usePrefersReducedMotion();
  const { atTop, show } = useHideOnScroll();

  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  const { t, i18n } = useTranslation();
  const { role, session } = useAuth();
  const isAdmin = role === "admin";
  const location = useLocation();

  // Tutup panel/dropdown saat pindah halaman
  useEffect(() => { setOpen(false); setLangOpen(false); }, [location.pathname]);

  // Klik di luar untuk nutup dropdown bahasa
  useEffect(() => {
    const onDocClick = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ESC menutup panel/dropdown
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); setLangOpen(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Kunci scroll saat panel mobile terbuka
  useEffect(() => {
    const html = document.documentElement;
    if (open) html.style.overflow = "hidden"; else html.style.overflow = "";
    return () => { html.style.overflow = ""; };
  }, [open]);

  const onChangeLanguage = (code) => {
    i18n.changeLanguage(code);
    try { localStorage.setItem("i18nextLng", code); } catch {}
    setLangOpen(false);
  };

  // === Active indicator: garis biru tipis tepat di bawah teks ===
  const navBase =
    "group relative px-3 py-2 rounded-2xl transition text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 after:absolute after:left-3 after:right-3 after:-bottom-[2px] after:h-[2px] after:rounded-full after:bg-sky-500 after:opacity-0 after:scale-x-0 after:origin-center after:transition-transform after:duration-200";
  const navClass = (active) =>
    cx(navBase, active && "text-slate-900 dark:text-slate-100 after:opacity-100 after:scale-x-100");

  const NavItem = ({ to, children, end=false }) => (
    <NavLink to={to} end={end} className={({ isActive }) => navClass(isActive)}>
      {children}
    </NavLink>
  );

  const adminLabels = useMemo(() => ({
    dashboard: t("admin.menu.dashboard", { defaultValue: "Dashboard" }),
    orders:    t("admin.menu.orders",    { defaultValue: "Orders" }),
    customize: t("admin.menu.customize", { defaultValue: "Customize" }),
  }), [t]);

  const mobileVariants = {
    hidden: { opacity: 0, y: -10 },
    show:   { opacity: 1, y: 0, transition: { duration: reduced ? 0.01 : 0.18, ease: "easeOut" } },
    exit:   { opacity: 0, y: -8,  transition: { duration: reduced ? 0.01 : 0.14, ease: "easeIn"  } },
  };

  const headerBg = cx("bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors");
  const headerShadow = atTop ? "shadow-none" : "shadow-[0_6px_24px_rgba(2,6,23,.06)]";

  return (
    <header
      className={cx("fixed top-0 left-0 right-0 z-40 transition-transform duration-300", show || atTop ? "translate-y-0" : "-translate-y-full")}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className={cx(headerBg, headerShadow)}>
        <div className="container flex items-center justify-between h-16">
          {/* LEFT: brand + hamburger */}
          <div className="flex items-center gap-2">
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              onClick={() => setOpen(v => !v)}
              aria-label={open ? t("misc.close", { defaultValue: "Close menu" }) : t("misc.open", { defaultValue: "Open menu" })}
            >
              <motion.span initial={false} animate={{ rotate: open ? 90 : 0, scale: open ? 0.92 : 1 }} transition={{ duration: reduced ? 0.01 : 0.18 }}>
                {open ? <X /> : <Menu />}
              </motion.span>
            </button>

            <Link to="/" className="relative h-12 lg:h-14 w-[210px] select-none" aria-label="CIDIKA TRAVEL&TOUR">
              <img src="/biru.png" alt="CIDIKA TRAVEL&TOUR" className="absolute inset-0 h-full w-auto opacity-100 dark:opacity-0 transition-opacity duration-300" draggable="false" />
              <img src="/putih.png" alt="" className="absolute inset-0 h-full w-auto opacity-0 dark:opacity-100 transition-opacity duration-300" draggable="false" />
            </Link>
          </div>

          {/* RIGHT: desktop nav */}
          <nav className="hidden lg:flex items-center gap-2">
            {!isAdmin ? (
              <>
                <NavItem to="/" end>{t("nav.home", { defaultValue: "Home" })}</NavItem>
                <NavItem to="/explore">{t("nav.explore", { defaultValue: "Explore" })}</NavItem>
                <NavItem to="/destinasi">{t("nav.destinasi", { defaultValue: "Destinations" })}</NavItem>
                <NavItem to="/faq">{t("nav.faq", { defaultValue: "FAQ" })}</NavItem>
                <NavItem to="/contact">{t("nav.contact", { defaultValue: "Contact" })}</NavItem>
              </>
            ) : (
              <>
                <NavItem to="/admin" end>{adminLabels.dashboard}</NavItem>
                <NavItem to="/admin/orderan">{adminLabels.orders}</NavItem>
                <NavItem to="/admin/kustomisasi">{adminLabels.customize}</NavItem>
              </>
            )}

            {/* Theme toggle */}
            <button
              className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={t("misc.toggleTheme", { defaultValue: "Toggle theme" })}
              title={t("misc.toggleTheme", { defaultValue: "Toggle theme" })}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Language dropdown */}
            <div className="relative" ref={langRef}>
              <button
                className="px-2 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition inline-flex items-center gap-1"
                onClick={() => setLangOpen(v => !v)}
                aria-haspopup="menu"
                aria-expanded={langOpen}
                aria-label={t("nav.language", { defaultValue: "Language" })}
              >
                <Globe size={18} />
                <ChevronDown size={14} className="opacity-70" />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: reduced ? 0.01 : 0.16 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-smooth p-1 z-50"
                    role="menu"
                  >
                    {LANGS.map(({ code, label, flag }) => (
                      <button
                        key={code}
                        onClick={() => onChangeLanguage(code)}
                        className="px-3 py-2 w-full text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                        role="menuitem"
                      >
                        <span className="text-lg" aria-hidden>{flag}</span>
                        <span className="flex-1">{label}</span>
                        <span className="text-xs text-slate-400 uppercase">{code}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Auth */}
            {!session ? (
              <NavLink to="/admin/login" className={navBase} aria-label="Login">
                <UserRound size={18} />
              </NavLink>
            ) : (
              <button
                className={navBase}
                onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </nav>
        </div>

        {/* MOBILE PANEL (sekarang rata kiri) */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="mobile-panel"
              initial="hidden"
              animate="show"
              exit="exit"
              variants={mobileVariants}
              className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <div className="p-2 space-y-2 text-left">
                <div className="flex flex-col">
                  {!isAdmin ? (
                    <>
                      <Link to="/" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.home", { defaultValue: "Home" })}</Link>
                      <Link to="/explore" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.explore", { defaultValue: "Explore" })}</Link>
                      <Link to="/destinasi" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.destinasi", { defaultValue: "Destinations" })}</Link>
                      <Link to="/faq" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.faq", { defaultValue: "FAQ" })}</Link>
                      <Link to="/contact" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.contact", { defaultValue: "Contact" })}</Link>
                    </>
                  ) : (
                    <>
                      <Link to="/admin" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{adminLabels.dashboard}</Link>
                      <Link to="/admin/orderan" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{adminLabels.orders}</Link>
                      <Link to="/admin/kustomisasi" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{adminLabels.customize}</Link>
                    </>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 px-3 pt-2">
                    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="btn btn-outline">
                      {theme === "dark" ? "Light" : "Dark"}
                    </button>

                    <div className="flex items-center">
                      <label htmlFor="lang-select" className="sr-only">{t("nav.language", { defaultValue: "Language" })}</label>
                      <select
                        id="lang-select"
                        className="w-full px-3 py-2 rounded-2xl border bg-white dark:bg-slate-900"
                        value={i18n.language?.slice(0,2) || "id"}
                        onChange={(e) => onChangeLanguage(e.target.value)}
                      >
                        {LANGS.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Auth */}
                  {session ? (
                    <button
                      onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                      className="btn btn-outline mx-3 mt-2 flex items-center gap-2"
                    >
                      <LogOut size={16}/> Logout
                    </button>
                  ) : (
                    <Link to="/admin/login" onClick={() => setOpen(false)} className="btn btn-outline mx-3 mt-2 flex items-center gap-2" aria-label="Login">
                      <UserRound size={16} /> Login
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
