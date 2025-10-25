import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun, LogOut, UserRound, ChevronDown } from "lucide-react";import { useTranslation } from "react-i18next";
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
      <div className={cx(headerBg, headerShadow, open && "border-transparent shadow-none")}>
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

              {/* Language dropdown */}
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

            {/* Mobile Hamburger */}
            <button
              className={cx(
                "lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-2xl border leading-none transition shadow-smooth",
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

        {/* === Mobile Fullscreen Overlay Menu === */}
        <AnimatePresence>
          {open && (
            <div className="lg:hidden fixed inset-0 z-[70]">
              {/* Backdrop */}
              <motion.div
                key="mobile-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0.01 : 0.25, ease: "easeOut" }}
                className="absolute inset-0 bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-sm"
                onClick={() => setOpen(false)}
                aria-hidden="true"
              />

              {/* Sheet (fullscreen) */}
<motion.div
  key="mobile-sheet"
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 16 }}
  transition={{ duration: reduced ? 0.01 : 0.28, ease: [0.4, 0, 0.2, 1] }}
  // <-- ubah background agar tidak tembus konten di belakang
  className="absolute inset-0 flex flex-col bg-white dark:bg-slate-900"
  role="dialog"
  aria-modal="true"
  aria-label="Mobile navigation"
  style={{
    paddingTop: "calc(env(safe-area-inset-top) + 12px)",
    paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)"
  }}
>

                {/* Header bar */}
                <div className="px-4 pb-3 flex items-center justify-between">
                  <Link
                    to="/"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100"
                    aria-label="Home"
                  >
                    <img src="/biru.png" alt="CIDIKA TRAVEL&TOUR" className="h-6 w-auto dark:hidden" />
                    <img src="/putih.png" alt="" className="h-6 w-auto hidden dark:block" />
                  </Link>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label={t("misc.close", { defaultValue: "Close" })}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                  >
                    <span aria-hidden className="text-xl leading-none -mt-[1px]">×</span>
                  </button>
                </div>

                {/* Nav list (centered, big, with stagger) */}
                <nav className="flex-1 flex items-center justify-center px-4">
                  <motion.ul
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    variants={{
                      hidden: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
                      show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } }
                    }}
                    className="w-full max-w-sm space-y-2"
                  >
                    {(!isAdmin ? [
                      { to: "/", label: t("nav.home", { defaultValue: "Home" }), end: true },
                      { to: "/explore", label: t("nav.explore", { defaultValue: "Explore" }) },
                      { to: "/destinasi", label: t("nav.destinasi", { defaultValue: "Destinations" }) },
                      { to: "/faq", label: t("nav.faq", { defaultValue: "FAQ" }) },
                      { to: "/contact", label: t("nav.contact", { defaultValue: "Contact" }) },
                    ] : [
                      { to: "/admin", label: adminLabels.dashboard, end: true },
                      { to: "/admin/orderan", label: adminLabels.orders },
                      { to: "/admin/kustomisasi", label: adminLabels.customize },
                    ]).map((item) => (
                      <motion.li
                        key={item.to}
                        variants={{ hidden: { y: 14, opacity: 0 }, show: { y: 0, opacity: 1 } }}
                      >
                        <NavLink
                          to={item.to}
                          end={item.end}
                          onClick={() => setOpen(false)}
                          className={({ isActive }) =>
                            cx(
                              "block px-5 py-4 rounded-2xl text-xl md:text-2xl font-semibold transition-all border",
                              "bg-white/70 dark:bg-slate-900/70 hover:bg-white/90 dark:hover:bg-slate-900/90",
                              "border-slate-200/70 dark:border-slate-800/70 backdrop-blur",
                              isActive
                                ? "ring-2 ring-sky-400/60 text-sky-700 dark:text-sky-300"
                                : "text-slate-800 dark:text-slate-100"
                            )
                          }
                        >
                          {item.label}
                        </NavLink>
                      </motion.li>
                    ))}
                  </motion.ul>
                </nav>

                {/* Bottom actions (theme + language + auth) */}
                <div className="px-4 pt-3 border-t border-slate-200/70 dark:border-slate-800/70">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="btn btn-outline flex items-center justify-center gap-2 text-sm"
                    >
                      {theme === "dark" ? (
                        <>
                          <Sun size={16} /> Light
                        </>
                      ) : (
                        <>
                          <Moon size={16} /> Dark
                        </>
                      )}
                    </button>

                    <div className="flex items-center">
                      <label htmlFor="lang-select" className="sr-only">
                        {t("nav.language", { defaultValue: "Language" })}
                      </label>
                      <select
                        id="lang-select"
                        className="w-full px-3 py-2 rounded-2xl border bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-sm"
                        value={i18n.language?.slice(0, 2) || "id"}
                        onChange={(e) => onChangeLanguage(e.target.value)}
                      >
                        {LANGS.map((l) => (
                          <option key={l.code} value={l.code}>
                            {flagEmojiFromCountry(l.country)} {l.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {session ? (
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = "/";
                        setOpen(false);
                      }}
                      className="btn btn-outline w-full mt-3 mb-1.5 flex items-center justify-center gap-2 text-sm"
                    >
                      <LogOut size={16} /> {t("nav.logout", { defaultValue: "Logout" })}
                    </button>
                  ) : (
                    <Link
                      to="/admin/login"
                      onClick={() => setOpen(false)}
                      className="btn btn-outline w-full mt-3 mb-1.5 flex items-center justify-center gap-2 text-sm"
                      aria-label={t("nav.login", { defaultValue: "Login" })}
                    >
                      <UserRound size={16} /> {t("nav.login", { defaultValue: "Login" })}
                    </Link>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </header>

  );
}