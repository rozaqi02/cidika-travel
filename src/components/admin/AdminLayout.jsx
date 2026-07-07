import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Moon,
  PenTool,
  ShieldCheck,
  ShoppingBag,
  Sun,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient.js";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/orderan", label: "Orderan", icon: ShoppingBag },
  { to: "/admin/kustomisasi", label: "Kustomisasi", icon: PenTool },
];

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function AdminLayout({ children }) {
  const { i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { session } = useAuth();
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const previousLang = i18n.language;
    i18n.changeLanguage("id");
    document.body.classList.add("admin-route");
    document.documentElement.lang = "id";

    return () => {
      document.body.classList.remove("admin-route");
      if (previousLang && previousLang !== "id") {
        i18n.changeLanguage(previousLang);
      }
    };
  }, [i18n]);

  useEffect(() => {
    const onScroll = () => setAtTop((window.scrollY || 0) < 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const headerBg = "bg-white/85 dark:bg-[#0a1020]/90 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/10";
  const headerShadow = atTop ? "" : "shadow-sm";

  return (
    <div className="admin-shell min-h-screen bg-[#f3f5fa] text-slate-900 dark:bg-[#060a14] dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 admin-mesh" aria-hidden="true" />

      <header
        className="fixed top-0 left-0 right-0 z-40"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className={cx(headerBg, headerShadow)}>
          <div className="container flex h-16 items-center justify-between gap-3">
            <div className="flex-shrink-0">
              <Link
                to="/admin"
                className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 dark:text-white"
              >
                <ShieldCheck className="text-violet-500" size={20} />
                <span>
                  Admin<span className="text-violet-500">Panel</span>
                </span>
              </Link>
            </div>

            <nav
              className="hidden flex-1 justify-center lg:flex"
              aria-label="Navigasi admin"
            >
              <div className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/60 p-1 dark:border-white/10 dark:bg-white/5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className="relative rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
                    >
                      {({ isActive }) => (
                        <>
                          {isActive ? (
                            <motion.span
                              layoutId="admin-nav-pill"
                              className="absolute inset-0 rounded-full border border-violet-500/20 bg-white shadow-sm dark:border-violet-400/20 dark:bg-violet-500/15"
                              transition={{ type: "spring", stiffness: 380, damping: 32 }}
                            />
                          ) : null}
                          <span
                            className={cx(
                              "relative z-10 inline-flex items-center gap-1.5",
                              isActive
                                ? "text-violet-700 dark:text-violet-300"
                                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            )}
                          >
                            <Icon size={15} />
                            {item.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </nav>

            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
              <Link
                to="/"
                className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-indigo-100 dark:hover:bg-white/5 sm:inline-flex"
                title="Kembali ke situs"
              >
                <ExternalLink size={14} />
                Situs
              </Link>

              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:text-indigo-200 dark:hover:bg-white/5"
                title="Tema"
                aria-label="Tema"
              >
                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-indigo-200 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                title="Keluar"
                aria-label="Keluar"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>

          <nav
            className="container flex gap-2 overflow-x-auto border-t border-slate-200/60 px-0 py-2 dark:border-white/10 lg:hidden"
            aria-label="Navigasi admin mobile"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cx(
                      "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition",
                      isActive
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/25"
                        : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-indigo-100"
                    )
                  }
                >
                  <Icon size={14} />
                  {item.label}
                </NavLink>
              );
            })}
            <Link
              to="/"
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:text-indigo-100"
            >
              <ExternalLink size={14} />
              Situs
            </Link>
          </nav>
        </div>
      </header>

      <main
        className="relative min-h-screen pt-[calc(7.25rem+env(safe-area-inset-top,0px))] lg:pt-[calc(4rem+env(safe-area-inset-top,0px))]"
      >
        <div className="container pb-8 md:pb-10">{children}</div>
      </main>

      {session?.user?.email ? (
        <p className="pointer-events-none fixed bottom-3 right-4 z-10 hidden text-[10px] text-slate-400 dark:text-indigo-300/40 md:block">
          {session.user.email}
        </p>
      ) : null}
    </div>
  );
}