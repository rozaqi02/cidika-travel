import React, { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Compass, Map, HelpCircle, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const PUBLIC_ITEMS = [
  { to: "/", labelKey: "nav.home", icon: Home, end: true },
  { to: "/explore", labelKey: "nav.explore", icon: Compass },
  { to: "/destinasi", labelKey: "nav.destinasi", icon: Map },
  { to: "/faq", labelKey: "nav.faq", icon: HelpCircle },
];

const WA_HREF = "https://wa.me/62895630193926";

export default function MobileBottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const { role } = useAuth();
  const isAdmin = role === "admin";

  const hiddenPaths = ["/checkout", "/admin/login", "/admin/reset"];
  const hide =
    isAdmin ||
    hiddenPaths.includes(pathname) ||
    pathname.startsWith("/admin");

  useEffect(() => {
    if (hide) {
      document.body.classList.remove("has-mobile-nav");
      return undefined;
    }
    document.body.classList.add("has-mobile-nav");
    return () => document.body.classList.remove("has-mobile-nav");
  }, [hide]);

  if (hide) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
        {PUBLIC_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition-colors ${
                  isActive
                    ? "text-sky-600 dark:text-sky-400"
                    : "text-slate-500 dark:text-slate-400"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{t(item.labelKey)}</span>
                </>
              )}
            </NavLink>
          );
        })}
        <a
          href={WA_HREF}
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
        >
          <MessageCircle size={20} />
          <span>WA</span>
        </a>
      </div>
    </nav>
  );
}