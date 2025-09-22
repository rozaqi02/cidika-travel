// src/pages/Explore.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import usePackages from "../hooks/usePackages";
import { useCurrency } from "../context/CurrencyContext";
import { useCart } from "../context/CartContext";
import { formatMoneyFromIDR } from "../utils/currency";
import { Calendar, Check, DollarSign, Info, MapPin, Tag } from "lucide-react";

/* ===============================
   Motion presets
================================= */
const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

/* ===============================
   Helpers
================================= */
function getPkgImage(p) {
  const raw =
    p?.default_image ||
    p?.cover_url ||
    p?.thumbnail ||
    p?.thumb_url ||
    p?.image_url ||
    (Array.isArray(p?.images) && p.images[0]) ||
    (p?.data?.images && p.data.images[0]) ||
    "";
  if (!raw) return "/23.jpg";
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function getGalleryList(p) {
  const urls = new Set();
  const push = (u) => {
    if (!u) return;
    const s = String(u);
    const final = /^https?:\/\//i.test(s) ? s : s.startsWith("/") ? s : `/${s}`;
    urls.add(final);
  };
  push(p?.default_image);
  if (Array.isArray(p?.images)) p.images.forEach(push);
  if (Array.isArray(p?.data?.images)) p.data.images.forEach(push);
  if (p?.cover_url) push(p.cover_url);
  if (p?.thumb_url) push(p.thumb_url);
  return Array.from(urls).slice(0, 8);
}

function normalizeLocale(p, currentLang) {
  const byCtx = p?.locale || (Array.isArray(p?.locales) ? p.locales.find((l) => l.lang === currentLang) : null);
  return byCtx || p?.locales?.[0] || {};
}

function ItineraryTimeline({ data }) {
  const steps = Array.isArray(data) ? data : [];
  if (!steps.length) return null;
  return (
    <ol className="mt-2 relative border-l border-slate-200 dark:border-slate-800 pl-4 space-y-3">
      {steps.map((step, i) => {
        const isObj = step && typeof step === "object";
        const time = String(isObj ? step.time ?? "" : "").trim();
        const text = String(isObj ? step.text ?? "" : step).trim();

        return (
          <li key={i} className="relative">
            <span className="absolute -left-[9px] top-[3px] w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white dark:ring-slate-900" />
            <div className="flex items-start gap-2">
              {time && (
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                  {time}
                </span>
              )}
              <p className="text-sm leading-relaxed">{text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function PillList({ items }) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {arr.map((s, i) => (
        <span
          key={i}
          className="px-2.5 py-1 rounded-full text-[12px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60"
        >
          {typeof s === "string" ? s : JSON.stringify(s)}
        </span>
      ))}
    </div>
  );
}

/* ===============================
   Tilt hook
================================= */
function useTiltRef() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let rAF = 0;
    const max = 6;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => {
        el.style.transform = `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(
          2
        )}deg)`;
      });
    };
    const reset = () => {
      cancelAnimationFrame(rAF);
      el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", reset);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", reset);
      cancelAnimationFrame(rAF);
    };
  }, []);
  return ref;
}

/* ===============================
   Mini components for Detail (dipakai beberapa bagian)
================================= */
const SectionTitle = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 mt-2">
    {Icon && <Icon size={16} className="text-sky-600 dark:text-sky-400" />}
    <h4 className="font-medium">{children}</h4>
  </div>
);

/* ===============================
   PackageCard
================================= */
function PackageCard({
  p,
  loc,
  audience,
  pax,
  setPax,
  currency,
  fx,
  locale,
  addItem,
  t,
}) {
  const nav = useNavigate();
  const cover = getPkgImage(p);
  const tiltRef = useTiltRef();

  const tiersAll = (p.price_tiers || []).filter((x) => x.audience === audience);
  const tierForSelectedPax =
    tiersAll.find((x) => x.pax === pax) ||
    (p.price_tiers || []).find((x) => x.pax === pax) ||
    tiersAll[0] ||
    (p.price_tiers || [])[0];
  const priceSelected = tierForSelectedPax?.price_idr || 0;

  return (
    <motion.article
      variants={itemVariants}
      id={`pkg-${p.id}`}
      className="card bg-transparent relative overflow-hidden p-0 hover-lift"
    >
      {/* Cover */}
      <div className="relative">
        <div ref={tiltRef} className="relative aspect-[16/9] overflow-hidden will-change-transform transform-gpu">
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover hero-img"
            onLoad={(e) => e.currentTarget.classList.add("kenburns")}
          />
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200/50 to-slate-100/30 dark:from-slate-800/30 dark:to-slate-900/30 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 p-4 pt-12 bg-gradient-to-t from-white/90 via-white/50 to-transparent dark:from-slate-950/85 dark:via-slate-950/35">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg">{loc?.title || p.slug}</h3>
                <p className="text-[13px] text-slate-600 dark:text-slate-300 line-clamp-1">
                  {(loc?.spots || []).slice(0, 6).join(" • ")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sky-700 dark:text-sky-300 font-extrabold">
                  {formatMoneyFromIDR(priceSelected, currency, fx, locale)}{" "}
                  <span className="text-sm font-normal text-slate-600 dark:text-slate-400">/ {t("home.perPax")}</span>
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {audience === "domestic" ? "Domestik" : "Foreign"} • {pax} {t("home.pax")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions row */}
      <div className="px-4 py-2 flex items-center justify-between gap-3">
        <button
          onClick={() => nav(`/packages/${p.id}`, { state: { pax, audience } })}
          className="btn glass"
        >
          {t("explore.seeDetail", { defaultValue: "See Detail" })}
        </button>

        <div className="flex items-center gap-2">
          <select value={pax} onChange={(e) => setPax(parseInt(e.target.value))} className="px-3 py-2 rounded-2xl">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} {t("home.pax")}
              </option>
            ))}
          </select>
          <motion.button
            className="btn btn-primary glass"
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              addItem({
                id: p.id,
                title: loc?.title || p.slug,
                price:
                  (p.price_tiers || []).find((x) => x.pax === pax && x.audience === audience)?.price_idr ||
                  priceSelected,
                pax,
                qty: 1,
                audience,
              });
              window.dispatchEvent(new CustomEvent("WISHLIST_FX"));
            }}
          >
            {t("home.addToCart", { defaultValue: "Add to Cart" }).replace(/cart|keranjang/i, "Wishlist")}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

/* ===============================
   Explore Page
================================= */
export default function Explore() {
  const { t } = useTranslation();
  const { rows: data = [] } = usePackages();
  const { fx, currency, locale } = useCurrency();
  const { addItem } = useCart();

  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const qsId = qs.get("pkg");
  const initialPax = Number(location.state?.pax) || 1;

  const [pax, setPax] = useState(initialPax);
  const [audience, setAudience] = useState("domestic");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [compact, setCompact] = useState(false);

  // sticky glass toolbar shrink on scroll
  const { scrollY } = useScroll();
  const barH = useTransform(scrollY, [0, 80], ["4.5rem", "3.5rem"]);
  const barShadow = useTransform(scrollY, [0, 80], ["0 6px 24px rgba(2,6,23,.06)", "0 4px 18px rgba(2,6,23,.12)"]);
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const bgFrom = isDark ? "rgba(2,6,23,0.45)" : "rgba(255,255,255,0.60)";
  const bgTo   = isDark ? "rgba(2,6,23,0.72)" : "rgba(255,255,255,0.90)";
  const barBg  = useTransform(scrollY, [0, 80], [bgFrom, bgTo]);

  // filter + sort
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const list = data.map((p) => {
      const loc = normalizeLocale(p, locale?.slice(0, 2));
      return { ...p, _loc: loc };
    });
    const searched = q
      ? list.filter((p) => {
          const hay =
            (p._loc?.title || "") +
            " " +
            (Array.isArray(p._loc?.spots) ? p._loc.spots.join(" ") : "") +
            " " +
            (p.slug || "");
          return hay.toLowerCase().includes(q);
        })
      : list;

    if (sortBy === "name") {
      return searched.sort((a, b) => (a._loc?.title || "").localeCompare(b._loc?.title || ""));
    }

    return searched.sort((a, b) => {
      const pa =
        (a.price_tiers || []).find((x) => x.pax === pax && x.audience === audience) ||
        (a.price_tiers || []).find((x) => x.pax === pax) ||
        (a.price_tiers || [])[0];
      const pb =
        (b.price_tiers || []).find((x) => x.pax === pax && x.audience === audience) ||
        (b.price_tiers || []).find((x) => x.pax === pax) ||
        (b.price_tiers || [])[0];
      return (pa?.price_idr || 0) - (pb?.price_idr || 0);
    });
  }, [data, query, pax, sortBy, audience, locale]);

  return (
    <div className="container mt-2 space-y-5">
      {/* Sticky glass toolbar */}
      <motion.div
        style={{ height: barH, boxShadow: barShadow, background: barBg }}
        className="sticky top-16 z-[5] rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md px-3 sm:px-4 flex items-center"
      >
        <div className="w-full flex flex-wrap items-center gap-2 sm:gap-3">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 pr-2">
            {t("explore.title")}
          </h1>

          <div className="flex-1 min-w-[160px]">
            <div className="relative">
              <input
                type="text"
                defaultValue={qsId ? "" : undefined}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("explore.searchPlaceholder", { defaultValue: "Search packages or spots…" })}
                className="w-full pl-9 pr-3 py-2 rounded-2xl border-slate-200 dark:border-slate-700"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
            </div>
          </div>

          {/* Audience */}
          <div className="flex items-center gap-1 bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-1">
            {["domestic", "foreign"].map((k) => (
              <button
                key={k}
                onClick={() => setAudience(k)}
                className={`btn ${audience === k ? "btn-primary" : "btn-outline"} !py-1 !px-2 text-xs`}
              >
                {k === "domestic" ? t("explore.domestic", { defaultValue: "Domestik" }) : "Foreign"}
              </button>
            ))}
          </div>

          {/* Pax */}
          <div className="flex items-center gap-2">
            <label htmlFor="pax" className="text-xs text-slate-500 dark:text-slate-400">
              {t("home.calcFor")}
            </label>
            <select id="pax" value={pax} onChange={(e) => setPax(parseInt(e.target.value))} className="px-3 py-2 rounded-2xl">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {t("home.pax")}
                </option>
              ))}
            </select>
          </div>

          {/* Sort + density */}
          <div className="flex items-center gap-2">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 rounded-2xl">
              <option value="price">{t("explore.sortPrice", { defaultValue: "Termurah" })}</option>
              <option value="name">{t("explore.sortName", { defaultValue: "A-Z" })}</option>
            </select>
            <button className="btn btn-outline !py-2 !px-3" onClick={() => setCompact((v) => !v)} title={compact ? "Cozy grid" : "Compact grid"}>
              {compact ? "🔳" : "🔲"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Grid */}
      <motion.div variants={listVariants} initial="hidden" animate="show" className={`grid gap-4 ${compact ? "sm:grid-cols-3" : "md:grid-cols-2"}`}>
        {filtered.map((p) => {
          const loc = normalizeLocale(p, locale?.slice(0, 2));
          return (
            <PackageCard
              key={p.id}
              p={p}
              loc={loc}
              audience={audience}
              pax={pax}
              setPax={setPax}
              currency={currency}
              fx={fx}
              locale={locale}
              addItem={addItem}
              t={t}
            />
          );
        })}
      </motion.div>

      {/* Empty state */}
      {!filtered.length && (
        <div className="text-center text-slate-500 dark:text-slate-400 py-16">
          {t("explore.empty", { defaultValue: "No packages match your filters." })}
        </div>
      )}
    </div>
  );
}
