import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Menu, Moon, Sun, ShoppingCart, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Navbar({ onCartOpen }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const navItem = (to, label) => (
    <NavLink to={to} className={({isActive}) =>
      "px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 " + (isActive ? "bg-slate-100 dark:bg-slate-800" : "")
    } onClick={()=>setOpen(false)}>{label}</NavLink>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-2" onClick={()=>setOpen(!open)} aria-label="Toggle menu"><Menu /></button>
          <Link to="/" className="font-bold text-xl tracking-wide">CIDIKA <span className="text-sky-600">TRAVEL&TOUR</span></Link>
        </div>
        <nav className="hidden md:flex items-center gap-2">
          {navItem("/explore", t("nav.explore"))}
          {navItem("/destinasi", t("nav.destinasi"))}
          {navItem("/faq", t("nav.faq"))}
          {navItem("/contact", t("nav.contact"))}
          <NavLink to="/admin/login" className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.login")}</NavLink>
          <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" onClick={()=>setTheme(theme==="dark"?"light":"dark")} aria-label="Toggle theme">
            {theme==="dark"? <Sun size={18}/> : <Moon size={18}/>}
          </button>
          <div className="relative group">
            <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Language"><Globe size={18}/></button>
            <div className="absolute right-0 mt-2 hidden group-hover:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {["en","id","ja"].map(l=> (
                <button key={l} onClick={()=>i18n.changeLanguage(l)} className="px-3 py-2 block w-full text-left hover:bg-slate-100 dark:hover:bg-slate-800">{l.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <button onClick={onCartOpen} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Cart">
            <ShoppingCart size={18}/>
          </button>
        </nav>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 p-2 space-y-2">
          <div className="flex flex-col">
            <Link to="/explore" onClick={()=>setOpen(false)} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.explore")}</Link>
            <Link to="/destinasi" onClick={()=>setOpen(false)} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.destinasi")}</Link>
            <Link to="/faq" onClick={()=>setOpen(false)} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.faq")}</Link>
            <Link to="/contact" onClick={()=>setOpen(false)} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.contact")}</Link>
            <Link to="/admin/login" onClick={()=>setOpen(false)} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">{t("nav.login")}</Link>
            <div className="flex items-center gap-2 px-3">
              <button onClick={()=>setTheme(theme==="dark"?"light":"dark")} className="btn btn-outline">{theme==="dark"?"Light":"Dark"}</button>
              <button onClick={()=>setOpen(false)&&i18n.changeLanguage("en")} className="btn btn-outline">EN</button>
              <button onClick={()=>setOpen(false)&&i18n.changeLanguage("id")} className="btn btn-outline">ID</button>
              <button onClick={()=>setOpen(false)&&i18n.changeLanguage("ja")} className="btn btn-outline">JA</button>
              <button onClick={onCartOpen} className="btn btn-outline">Cart</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}