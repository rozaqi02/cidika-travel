// src/components/Navbar.jsx (Versi A)
import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Menu, Moon, Sun, Heart, Globe, LogOut, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient.js";

const LANGS = [
  { code: "en", label: "English",  flag: "🇬🇧" },
  { code: "id", label: "Indonesia", flag: "🇮🇩" },
  { code: "ja", label: "日本語",     flag: "🇯🇵" },
];

export default function Navbar({ onCartOpen }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false); // utk desktop
  const [atTop, setAtTop] = useState(true);
  const [show, setShow] = useState(true);
  const lastY = useRef(0);

  const langRef = useRef(null);
  const { t, i18n } = useTranslation();
  const { items } = useCart();
  const { role, session } = useAuth();
  const isAdmin = role === "admin";
  const wishlistCount = items.reduce((s, it) => s + (it.qty || 0), 0);
  const location = useLocation();

  useEffect(() => {
    const onDocClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setAtTop(y < 4);
      const goingDown = y > lastY.current + 2;
      const goingUp   = y < lastY.current - 2;
      if (goingDown) setShow(false);
      else if (goingUp) setShow(true);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  const onChangeLanguage = (code) => {
    i18n.changeLanguage(code);
    try { localStorage.setItem("i18nextLng", code); } catch {}
  };

  const navItem = (to, label) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 " +
        (isActive ? "bg-slate-100 dark:bg-slate-800" : "")
      }
      onClick={() => setOpen(false)}
    >
      {label}
    </NavLink>
  );

  const adminLabels = {
    dashboard: t("admin.menu.dashboard"),
    orders: t("admin.menu.orders"),
    customize: t("admin.menu.customize"),
  };

  return (
    <header className={"fixed top-0 left-0 right-0 z-40 transition-transform duration-300 " + (show || atTop ? "translate-y-0" : "-translate-y-full")}>
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
              <Menu />
            </button>

            <Link to="/" className="relative h-12 md:h-14 w-[210px] select-none" aria-label="CIDIKA TRAVEL&TOUR">
              <img src="/biru.png" alt="CIDIKA TRAVEL&TOUR" className="absolute inset-0 h-full w-auto opacity-100 dark:opacity-0 transition-opacity duration-300" draggable="false"/>
              <img src="/putih.png" alt="" className="absolute inset-0 h-full w-auto opacity-0 dark:opacity-100 transition-opacity duration-300" draggable="false"/>
            </Link>
          </div>

          {/* DESKTOP */}
          <nav className="hidden md:flex items-center gap-2">
            {!isAdmin ? (
              <>
                {navItem("/", t("nav.home", { defaultValue: "Home" }))} 
                {navItem("/explore", t("nav.explore"))}
                {navItem("/destinasi", t("nav.destinasi"))}
                {navItem("/faq", t("nav.faq"))}
                {navItem("/contact", t("nav.contact"))}
              </>
            ) : (
              <>
                {navItem("/admin", adminLabels.dashboard)}
                {navItem("/admin/orderan", adminLabels.orders)}
                {navItem("/admin/kustomisasi", adminLabels.customize)}
              </>
            )}

            <button
              className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Language (desktop dropdown absolute) */}
            <div className="relative" ref={langRef}>
              <button
                className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setLangOpen(v => !v)}
                aria-label={t("nav.language")}
              >
                <Globe size={18} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-smooth p-1 z-50">
                  {LANGS.map(({ code, label, flag }) => (
                    <button
                      key={code}
                      onClick={() => { onChangeLanguage(code); setLangOpen(false); }}
                      className="px-3 py-2 w-full text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                    >
                      <span className="text-lg">{flag}</span>
                      <span className="flex-1">{label}</span>
                      <span className="text-xs text-slate-400 uppercase">{code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!isAdmin && (
              <button onClick={onCartOpen} className="relative p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Wishlist">
                <Heart size={18} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[6px] rounded-full bg-sky-600 text-white text-[10px] leading-[18px] text-center">
                    {wishlistCount}
                  </span>
                )}
              </button>
            )}

            {!session ? (
              <NavLink to="/admin/login" className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Login">
                <UserRound size={18} />
              </NavLink>
            ) : (
              <button
                className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </nav>
        </div>

        {/* MOBILE PANEL */}
        {open && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 p-2 space-y-2">
            <div className="flex flex-col">
              {!isAdmin ? (
                <>
                  <Link to="/" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.home", { defaultValue: "Home" })}</Link>
                  <Link to="/explore" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.explore")}</Link>
                  <Link to="/destinasi" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.destinasi")}</Link>
                  <Link to="/faq" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.faq")}</Link>
                  <Link to="/contact" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.contact")}</Link>
                </>
              ) : (
                <>
                  <Link to="/admin" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{adminLabels.dashboard}</Link>
                  <Link to="/admin/orderan" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{adminLabels.orders}</Link>
                  <Link to="/admin/kustomisasi" onClick={() => setOpen(false)} className="px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800">{adminLabels.customize}</Link>
                </>
              )}

              {/* Row Actions */}
              <div className="grid grid-cols-2 gap-2 px-3 pt-2">
                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="btn btn-outline">
                  {theme === "dark" ? "Light" : "Dark"}
                </button>

                {/* ✅ Bahasa: pakai SELECT agar selalu muncul */}
                <div className="flex items-center">
                  <label htmlFor="lang-select" className="sr-only">{t("nav.language")}</label>
                  <select
                    id="lang-select"
                    className="w-full px-3 py-2 rounded-2xl border bg-white/90 dark:bg-slate-900/90"
                    value={i18n.language?.slice(0,2) || "id"}
                    onChange={(e) => onChangeLanguage(e.target.value)}
                  >
                    {LANGS.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
                  </select>
                </div>
              </div>

              {!isAdmin && (
                <button onClick={onCartOpen} className="btn btn-outline mx-3 mt-2 relative">
                  Wishlist
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-[6px] rounded-full bg-sky-600 text-white text-[10px] leading-[18px] text-center">
                      {wishlistCount}
                    </span>
                  )}
                </button>
              )}

              {session ? (
                <button
                  onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                  className="btn btn-outline mx-3 mt-2 flex items-center gap-2"
                >
                  <LogOut size={16}/> Logout
                </button>
              ) : (
                <Link to="/admin/login" onClick={() => setOpen(false)} className="btn btn-outline mx-3 mt-2" aria-label="Login">
                  <UserRound size={16} /> Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
