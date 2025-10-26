import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun, LogOut, UserRound, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient.js";
import { AnimatePresence, motion } from "framer-motion";
import ReactCountryFlag from "react-country-flag";

/* ====== Helpers ====== */
const LANGS = [
  { code: "en", label: "English",   country: "US" },
  { code: "id", label: "Indonesia", country: "ID" },
  { code: "ja", label: "日本語",     country: "JP" },
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
// helper kecil untuk emoji bendera (dipakai di <select> mobile)
function flagEmojiFromCountry(cc = "") {
  // 'GB' -> 🇬🇧
  return cc
    .toUpperCase()
    .replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function BurgerIcon({ open, reduced }) {
  const trans = { duration: reduced ? 0.01 : 0.2, ease: "easeInOut" };
const bar = "absolute left-0 right-0 top-1/2 h-[2px] bg-slate-700 dark:bg-slate-300 rounded-full";

  return (
    <span className="relative inline-block h-5 w-6" aria-hidden="true">
      {/* Top */}
      <motion.span
        className={bar}
        initial={false}
        animate={open ? { y: 0, rotate: 45 } : { y: -6, rotate: 0 }}
        transition={trans}
      />
      {/* Middle */}
      <motion.span
        className={bar}
        initial={false}
animate={open ? { opacity: 0, scaleX: 0.6 } : { opacity: 1, scaleX: 1, y: 0 }}        transition={trans}
        style={{ originX: 0.5 }}
      />
      {/* Bottom */}
      <motion.span
        className={bar}
        initial={false}
        animate={open ? { y: 0, rotate: -45 } : { y: 6, rotate: 0 }}
        transition={trans}
      />
    </span>
  );
}


/* ====== Component ====== */
export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const reduced = usePrefersReducedMotion();
  const { atTop, show } = useHideOnScroll();

  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  const { t, i18n } = useTranslation();

    const activeLang = useMemo(() => {
    const code2 = (i18n.language || i18n.resolvedLanguage || "id").slice(0, 2);
    return LANGS.find(l => l.code === code2) || LANGS[0];
  }, [i18n.language, i18n.resolvedLanguage]);

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

  // === Active indicator + sedikit bold ===
  const navBase =
    "group relative px-3 py-2 rounded-2xl transition text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 after:absolute after:left-3 after:right-3 after:-bottom-[2px] after:h-[2px] after:rounded-full after:bg-sky-500 after:opacity-0 after:scale-x-0 after:origin-center after:transition-transform after:duration-200 font-medium";
  const navClass = (active) =>
    cx(navBase, active && "text-slate-900 dark:text-slate-100 after:opacity-100 after:scale-x-100 font-semibold");

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

  const headerBg = cx("bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors");
  const headerShadow = atTop ? "shadow-none" : "shadow-[0_6px_24px_rgba(2,6,23,.06)]";

  return (
    <header
      className={cx("fixed top-0 left-0 right-0 z-40 transition-transform duration-300", show || atTop ? "translate-y-0" : "-translate-y-full")}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className={cx(headerBg, headerShadow)}>
        <div className="container flex items-center justify-between h-16">
          {/* LEFT: brand or admin greeting */}
          {isAdmin ? (
            <Link to="/admin" className="relative h-12 lg:h-14 flex items-center text-lg font-semibold text-slate-900 dark:text-slate-100" aria-label="Admin Dashboard">
              Halo, Admin!
            </Link>
          ) : (
            <Link to="/" className="relative h-12 lg:h-14 w-[210px] select-none" aria-label="CIDIKA TRAVEL&TOUR">
              <img src="/biru.png" alt="CIDIKA TRAVEL&TOUR" className="absolute inset-0 h-full w-auto opacity-100 dark:opacity-0 transition-opacity duration-300" draggable="false" />
              <img src="/putih.png" alt="" className="absolute inset-0 h-full w-auto opacity-0 dark:opacity-100 transition-opacity duration-300" draggable="false" />
            </Link>
          )}

          {/* RIGHT: desktop nav & mobile hamburger */}
          <div className="flex items-center gap-2">
            {/* Desktop Nav */}
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

              {/* Language dropdown (Desktop) */}
              <div className="relative" ref={langRef}>
 <button
   className="px-2 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition inline-flex items-center gap-1"
   onClick={() => setLangOpen(v => !v)}
   aria-haspopup="menu"
   aria-expanded={langOpen}
   aria-label={`${t("nav.language", { defaultValue: "Language" })}: ${activeLang.label}`}
   title={`${activeLang.label}`}
 >
   <ReactCountryFlag
     countryCode={activeLang.country}
     svg
     style={{ width: "1.2em", height: "1.2em", borderRadius: 4 }}
     aria-label={`${activeLang.label} flag`}
   />
   <span className="hidden xl:inline text-xs uppercase opacity-70">
     {activeLang.code}
   </span>
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
                      {LANGS.map(({ code, label, country }) => (
                        <button
                          key={code}
                          onClick={() => onChangeLanguage(code)}
                          className="px-3 py-2 w-full text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                          role="menuitem"
                        >
                          <ReactCountryFlag
                            countryCode={country}
                            svg
                            style={{ width: "1.2em", height: "1.2em", borderRadius: 4 }}
                            aria-label={`${label} flag`}
                            title={label}
                          />
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

            {/* Mobile: Theme Toggle + Language Button + Hamburger */}
            <div className="flex items-center gap-2 lg:hidden">
              {/* Mobile Theme Toggle */}
              <button
                className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label={t("misc.toggleTheme", { defaultValue: "Toggle theme" })}
                title={t("misc.toggleTheme", { defaultValue: "Toggle theme" })}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Mobile Language Button (with flag) */}
              <div className="relative" ref={langRef}>
                <button
                  className="px-2 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition inline-flex items-center gap-1"
                  onClick={() => setLangOpen(v => !v)}
                  aria-haspopup="menu"
                  aria-expanded={langOpen}
                  aria-label={`${t("nav.language", { defaultValue: "Language" })}: ${activeLang.label}`}
                  title={`${activeLang.label}`}
                >
                  <ReactCountryFlag
                    countryCode={activeLang.country}
                    svg
                    style={{ width: "1.2em", height: "1.2em", borderRadius: 4 }}
                    aria-label={`${activeLang.label} flag`}
                  />
                  <ChevronDown size={14} className="opacity-70" />
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ duration: reduced ? 0.01 : 0.16 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-smooth p-1 z-50"
                      role="menu"
                    >
                      {LANGS.map(({ code, label, country }) => (
                        <button
                          key={code}
                          onClick={() => onChangeLanguage(code)}
                          className="px-3 py-2 w-full text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 text-sm"
                          role="menuitem"
                        >
                          <ReactCountryFlag
                            countryCode={country}
                            svg
                            style={{ width: "1em", height: "1em", borderRadius: 3 }}
                            aria-label={`${label} flag`}
                            title={label}
                          />
                          <span className="flex-1">{label}</span>
                          <span className="text-xs text-slate-400 uppercase">{code}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Hamburger */}
              <button
                className={cx(
                  "inline-flex h-10 w-10 items-center justify-center rounded-2xl border leading-none transition shadow-smooth",
                  open
                    ? "border-sky-300/60 bg-sky-50/70 dark:border-sky-500/30 dark:bg-sky-400/10"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                )}
                onClick={() => setOpen(v => !v)}
                aria-label={open ? t("misc.close", { defaultValue: "Close menu" }) : t("misc.open", { defaultValue: "Open menu" })}
                aria-pressed={open}
                aria-expanded={open}
                aria-controls="mobile-menu"
              >
                <BurgerIcon open={open} reduced={reduced} />
              </button>
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: reduced ? 0.1 : 0.3, ease: "easeInOut" }}
              className="lg:hidden overflow-hidden border-t border-slate-200/50 dark:border-slate-800/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md"
            >
              <div className="p-4 space-y-1">
                {/* Navigation Links */}
                <nav className="space-y-1">
                  {!isAdmin ? (
                    <>
                      <Link 
                        to="/" 
                        onClick={() => setOpen(false)} 
                        className="block px-4 py-3 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                      >
                        {t("nav.home", { defaultValue: "Home" })}
                      </Link>
                      <Link 
                        to="/explore" 
                        onClick={() => setOpen(false)} 
                        className="block px-4 py-3 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                      >
                        {t("nav.explore", { defaultValue: "Explore" })}
                      </Link>
                      <Link 
                        to="/destinasi" 
                        onClick={() => setOpen(false)} 
                        className="block px-4 py-3 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                      >
                        {t("nav.destinasi", { defaultValue: "Destinations" })}
                      </Link>
                      <Link 
                        to="/faq" 
                        onClick={() => setOpen(false)} 
                        className="block px-4 py-3 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                      >
                        {t("nav.faq", { defaultValue: "FAQ" })}
                      </Link>
                      <Link 
                        to="/contact" 
                        onClick={() => setOpen(false)} 
                        className="block px-4 py-3 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                      >
                        {t("nav.contact", { defaultValue: "Contact" })}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/admin" 
                        onClick={() => setOpen(false)} 
                        className="block px-4 py-3 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                      >
                        {adminLabels.dashboard}
                      </Link>
                      <Link 
                        to="/admin/orderan" 
                        onClick={() => setOpen(false)} 
                        className="block px-4 py-3 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                      >
                        {adminLabels.orders}
                      </Link>
                      <Link 
                        to="/admin/kustomisasi" 
                        onClick={() => setOpen(false)} 
                        className="block px-4 py-3 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                      >
                        {adminLabels.customize}
                      </Link>
                    </>
                  )}
                </nav>

                {/* Divider */}
                <div className="my-3 h-px bg-slate-200 dark:bg-slate-700" />

                {/* Actions Section */}
                <div className="space-y-2">
                  {/* Theme Toggle */}
                  <button 
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
                    className="w-full px-4 py-3 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-3"
                  >
                    <span className="w-6 h-6 flex items-center justify-center rounded-md bg-sky-100/50 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400">
                      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                    </span>
                    {theme === "dark" ? t("nav.theme.light", { defaultValue: "Light Mode" }) : t("nav.theme.dark", { defaultValue: "Dark Mode" })}
                  </button>

                  {/* Auth Button */}
                  {session ? (
                    <button
                      onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                      className="w-full btn btn-outline flex items-center justify-center gap-2 text-sm"
                    >
                      <LogOut size={16} />
                      {t("nav.logout", { defaultValue: "Logout" })}
                    </button>
                  ) : (
                    <Link 
                      to="/admin/login" 
                      onClick={() => setOpen(false)} 
                      className="w-full btn btn-outline flex items-center justify-center gap-2 text-sm"
                      aria-label="Login"
                    >
                      <UserRound size={16} />
                      {t("nav.login", { defaultValue: "Login" })}
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