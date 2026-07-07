// src/pages/Explore.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import usePackages from "../hooks/usePackages";
import usePageSections from "../hooks/usePageSections";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";
import { LayoutGrid, Rows, MapPin, Users, Search, ChevronDown, Globe, Clock } from "lucide-react";
import OptimizedImage from "../components/OptimizedImage";
import { PackageCardSkeleton } from "../components/Skeleton";
import { ExploreEmptyState } from "../components/EmptyState";
import { getPkgImage } from "../utils/images";

/* ===============================
   Animation Variants
================================= */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 50, damping: 20 },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

/* ===============================
   Helpers
================================= */
function normalizeLocale(p, lang2) {
  if (p?.locale && p.locale.title) return p.locale;
  const L = Array.isArray(p?.locales) ? p.locales : [];
  const pick = (code) => L.find((l) => (l.lang || "").slice(0, 2) === code);
  return pick((lang2 || "id").slice(0, 2)) || pick("id") || pick("en") || L[0] || {};
}

const MotionArticle = motion.article;

function PackageCard({ p, audience, pax, setPax, currency, fx, locale, t, lang }) {
  const nav = useNavigate();
  const cover = getPkgImage(p);

  const tiersAll = (p.price_tiers || []).filter((x) => x.audience === audience);
  const tierForSelectedPax =
    tiersAll.find((x) => x.pax === pax) ||
    (p.price_tiers || []).find((x) => x.pax === pax) ||
    tiersAll[0] ||
    (p.price_tiers || [])[0];
  const priceSelected = tierForSelectedPax?.price_idr || 0;

  const loc = normalizeLocale(p, lang);
  const audienceLabel = audience === "domestic" ? t("explore.domestic") : t("explore.foreign");

  // Logic Open Trip vs Private
  const isOpenTrip = p.trip_type === "open";
  const labelColor = isOpenTrip ? "bg-amber-500/90" : "bg-sky-500/90";
  const labelText = isOpenTrip ? t("explore.openTrip") : t("explore.privateTour", { defaultValue: "Private Tour" });

  const goDetail = () => nav(`/packages/${p.id}`, { state: { pax, audience } });

  const goOrder = (event) => {
    event.stopPropagation();
    const item = {
      id: p.id,
      title: loc.title || p.slug,
      price: priceSelected,
      pax,
      qty: 1,
      audience,
      trip_type: p.trip_type,
    };
    nav("/checkout", { state: { items: [item] } });
  };

  const stopCardNav = (event) => event.stopPropagation();

  const spotCount = (loc.spots || []).length;
  const tripLabel = isOpenTrip ? t("explore.openTrip") : t("explore.privateTour", { defaultValue: "Private Tour" });

  return (
    <MotionArticle
      layout
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      whileTap={{ scale: 0.99 }}
      id={`pkg-${p.id}`}
      role="link"
      tabIndex={0}
      aria-label={`${loc.title || p.slug} — ${t("home.viewDetails")}`}
      onClick={goDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          goDetail();
        }
      }}
      className="card-package group relative cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        <motion.div className="w-full h-full" whileHover={{ scale: 1.1 }} transition={{ duration: 0.6 }}>
          <OptimizedImage
            src={cover}
            alt={loc?.title}
            preset="card"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </motion.div>
        
        {/* DYNAMIC LABEL (DATABASE) */}
        <div className={`absolute top-3 left-3 z-10 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 ${labelColor}`}>
          {isOpenTrip && <Users size={12} />}
          {labelText}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 line-clamp-1 text-gray-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
          {loc.title || p.slug}
        </h3>

        <div className="flex flex-wrap gap-1 mb-3">
          {(loc.spots || []).slice(0, 3).map((spot, i) => (
            <span
              key={i}
              className="text-xs bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 px-2 py-1 rounded-full"
            >
              <MapPin size={10} className="inline mr-1" /> {spot}
            </span>
          ))}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
            <Clock size={12} className="text-sky-500" />
            {tripLabel}
          </span>
          {spotCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
              <MapPin size={12} className="text-amber-500" />
              {spotCount} {t("explore.spots", { defaultValue: "spots" })}
            </span>
          ) : null}
        </div>

        {/* Price */}
        <div className="mb-4">
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
            {formatMoneyFromIDR(priceSelected, currency, fx, locale)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            / {pax} {t("home.pax")} - {audienceLabel}
          </p>
        </div>

        {/* Actions — klik kartu membuka detail; pax & order tetap independen */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-sky-600 dark:text-sky-400 flex-1 text-left flex items-center gap-1 group-hover:underline pointer-events-none">
            {t("home.viewDetails")}
            <ChevronDown size={14} className="-rotate-90 opacity-60" />
          </span>

          <div className="flex items-center gap-2" onClick={stopCardNav}>
            <select
              value={pax}
              onChange={(e) => setPax(parseInt(e.target.value, 10))}
              aria-label={t("home.pax")}
              className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {t("home.pax")}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={goOrder}
              className="btn btn-primary px-4 py-1.5 rounded-lg text-sm shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 transition-shadow"
            >
              {t("actions.order")}
            </button>
          </div>
        </div>
      </div>
    </MotionArticle>
  );
}

/* ===============================
   Explore Page
================================= */
export default function Explore() {
  const { t, i18n } = useTranslation();
  const { rows: data = [], loading } = usePackages();
  const { fx, currency, locale } = useCurrency();
  const lang = (i18n.resolvedLanguage || i18n.language || "id").split("-")[0];

  const { sections: destSections = [] } = usePageSections("destinations");

  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const initialPax = Number(location.state?.pax) || 6;

  const [dest, setDest] = useState(searchParams.get("dest") || "all");
  const [pax, setPax] = useState(initialPax);
  const [audience, setAudience] = useState("domestic");
  const [query, setQuery] = useState("");
  const sortBy = "price";
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const currentDest = searchParams.get("dest");
    if (currentDest) {
      setDest(currentDest);
    } else {
      setDest("all");
    }
  }, [searchParams]);

  // Logic pembuatan Dropdown
  const destinationOptions = useMemo(() => {
    const opts = [
        { key: "all", label: t("explore.all", { defaultValue: "Semua" }) }
    ];

    const hasNusa = destSections.some(s => s.section_key === 'nusa-penida');
    if (!hasNusa) {
        opts.push({ 
            key: "nusa-penida", 
            label: t("dest.penidaTitle", { defaultValue: "Nusa Penida" }) 
        });
    }

    const ignored = ['hero', 'intro', 'cards', 'all']; 
    
    const dynamicOpts = destSections
        .filter(s => !ignored.includes(s.section_key))
        .map(s => ({
            key: s.section_key, 
            label: s.locale?.title || s.title || s.section_key
        }));

    return [...opts, ...dynamicOpts];
  }, [destSections, t]);

  const domesticLabel = t("explore.domestic");
  const foreignLabel = t("explore.foreign");

  // Filter + sort
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();

    const list0 = data.map((p) => ({
      ...p,
      _loc: normalizeLocale(p, lang),
    }));

    const list =
      dest === "all"
        ? list0
        : list0.filter((p) => {
            const pkgDest = p.destination_key || "nusa-penida";
            return pkgDest === dest;
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
  }, [data, query, pax, sortBy, audience, dest, lang]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mt-6 space-y-8"
    >
      {/* Controls (PROFESSIONAL TOOLBAR) */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200/80 bg-white/90 p-3 shadow-sm backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-900/90 lg:flex-row"
      >
        
        {/* Left Side: Filters Group */}
        <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto flex-1">
          
          {/* Search Input */}
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("explore.searchPlaceholder", { defaultValue: "Search packages..." })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none text-sm"
            />
          </div>

          {/* Destination Dropdown (Custom Style) */}
          <div className="relative w-full md:w-56 group">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors" size={18} />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <select
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 appearance-none rounded-xl bg-gray-50 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none text-sm cursor-pointer"
            >
              {destinationOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side: Toggles */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          
          {/* Audience Segmented Control */}
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center">
            {["domestic", "foreign"].map((k) => {
               const active = audience === k;
               return (
                <button
                  key={k}
                  onClick={() => setAudience(k)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    active
                      ? "bg-white dark:bg-gray-700 text-sky-600 dark:text-sky-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {k === "foreign" && <Globe size={14} />}
                  {k === "domestic" ? domesticLabel : foreignLabel}
                </button>
               )
            })}
          </div>

          {/* Layout Toggle */}
          <button
            className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors text-gray-600 dark:text-gray-300"
            onClick={() => setCompact((v) => !v)}
            title={t("misc.toggleLayout", { defaultValue: "Toggle layout" })}
          >
            {compact ? <LayoutGrid size={18} /> : <Rows size={18} />}
          </button>
        </div>
      </motion.div>

      {/* Result Count & Sort (Optional info bar) */}
      <div className="flex items-center justify-between px-2">
         <span className="text-sm text-gray-500 dark:text-gray-400">
            {t("explore.resultsCount", {
              count: filtered.length,
              defaultValue: "Found {{count}} packages",
            })}
         </span>
      </div>

      {/* Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid gap-6 ${compact ? "sm:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-3"}`}
      >
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => <PackageCardSkeleton key={`sk-${index}`} />)
          ) : filtered.length ? (
            filtered.map((p) => (
              <PackageCard
                key={p.id}
                p={p}
                audience={audience}
                pax={pax}
                setPax={setPax}
                currency={currency}
                fx={fx}
                locale={locale}
                t={t}
                lang={lang}
              />
            ))
          ) : (
            <ExploreEmptyState
              t={t}
              onReset={() => {
                setQuery("");
                setDest("all");
                setAudience("domestic");
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
