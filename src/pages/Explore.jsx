// src/pages/Explore.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useScroll, useTransform, motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import usePackages from "../hooks/usePackages";
import usePageSections from "../hooks/usePageSections";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";
import { LayoutGrid, Rows, Star, Heart, MapPin, Users } from "lucide-react"; // Tambah icon Users

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
  const labelText = isOpenTrip ? "Open Trip" : t("explore.privateTour", { defaultValue: "Private Tour" });

  const goOrder = () => {
    const item = {
      id: p.id,
      title: loc.title || p.slug,
      price: priceSelected,
      pax,
      qty: 1,
      audience,
      trip_type: p.trip_type, // Bawa info ini ke checkout jika perlu
    };
    nav("/checkout", { state: { items: [item] } });
  };

  const rating = 4.8;
  const stars = Array.from({ length: 5 }, (_, i) => (
    <Star key={i} size={14} className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
  ));

  return (
    <MotionArticle
      layout
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      id={`pkg-${p.id}`}
      className="group relative overflow-hidden rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-900"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <motion.img
          src={cover}
          alt={loc?.title}
          loading="lazy"
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.6 }}
        />
        
        {/* DYNAMIC LABEL (DATABASE) */}
        <div className={`absolute top-3 left-3 z-10 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 ${labelColor}`}>
          {isOpenTrip && <Users size={12} />}
          {labelText}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <button className="absolute top-3 right-3 z-10 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95">
          <Heart size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
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

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex">{stars}</div>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">({rating.toFixed(1)})</span>
        </div>

        {/* Price */}
        <div className="mb-4">
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
            {formatMoneyFromIDR(priceSelected, currency, fx, locale)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            / {pax} {t("home.pax")} • {audienceLabel}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => nav(`/packages/${p.id}`, { state: { pax, audience } })}
            className="text-sm font-medium text-sky-600 dark:text-sky-400 hover:underline flex-1 text-left"
          >
            {t("home.viewDetails")}
          </button>

          <div className="flex items-center gap-2">
            <select
              value={pax}
              onChange={(e) => setPax(parseInt(e.target.value))}
              className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-sky-500/50"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {t("home.pax")}
                </option>
              ))}
            </select>
            <button onClick={goOrder} className="btn btn-primary px-4 py-1.5 rounded-lg text-sm shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 transition-shadow">
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
  const { rows: data = [] } = usePackages();
  const { fx, currency, locale } = useCurrency();
  const lang = (i18n.language || "id").slice(0, 2);

  const { sections: destSections = [] } = usePageSections("destinations");

  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const initialPax = Number(location.state?.pax) || 6;

  // Inisialisasi dest langsung dari URL
  const [dest, setDest] = useState(qs.get("dest") || "all");
  
  const [pax, setPax] = useState(initialPax);
  const [audience, setAudience] = useState("domestic");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const currentDest = qs.get("dest");
    if (currentDest) {
      setDest(currentDest);
    } else {
      setDest("all");
    }
  }, [location.search]);

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

  // Theme & scroll
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : false
  );
  const lastScrollYRef = useRef(0);
  const [hideToolbar, setHideToolbar] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      const last = lastScrollYRef.current;
      const down = y > last;
      const delta = Math.abs(y - last);
      if (delta > 14) {
        setHideToolbar(down && y > 80);
        lastScrollYRef.current = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

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
      className="container mt-2 space-y-6"
    >
      {/* Controls */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("explore.searchPlaceholder", { defaultValue: "Search..." })}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </div>
          <select
            value={dest}
            onChange={(e) => {
                setDest(e.target.value);
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm"
          >
            {destinationOptions.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {["domestic", "foreign"].map((k) => (
              <button
                key={k}
                onClick={() => setAudience(k)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  audience === k
                    ? "bg-white dark:bg-gray-700 shadow text-sky-600 dark:text-sky-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
              >
                {k === "domestic" ? domesticLabel : foreignLabel}
              </button>
            ))}
          </div>

          <button
            className="btn btn-outline !p-2 rounded-xl"
            onClick={() => setCompact((v) => !v)}
          >
            {compact ? <LayoutGrid size={18} /> : <Rows size={18} />}
          </button>
        </div>
      </motion.div>

      {/* Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid gap-6 ${compact ? "sm:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-3"}`}
      >
        <AnimatePresence mode="popLayout">
          {filtered.length ? (
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400"
            >
              <p className="text-lg mb-4">
                {t("explore.empty", { defaultValue: "No packages match your filters." })}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}