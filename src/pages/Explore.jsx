// src/pages/Explore.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useScroll, useTransform } from "framer-motion"; // dipakai untuk animasi toolbar (bisa dibiarkan walau toolbar off)
import { useLocation, useNavigate } from "react-router-dom";
import usePackages from "../hooks/usePackages";
import usePageSections from "../hooks/usePageSections";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";
import { LayoutGrid, Rows, Star, Heart, MapPin } from "lucide-react";

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
  if (p?.locale && p.locale.title) return p.locale; // pakai objek tunggal
  const L = Array.isArray(p?.locales) ? p.locales : [];
  const pick = (code) => L.find((l) => (l.lang || "").slice(0, 2) === code);
  return pick((lang2 || "id").slice(0, 2)) || pick("id") || pick("en") || L[0] || {};
}

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

  const goOrder = () => {
    const item = {
      id: p.id,
      title: loc.title || p.slug,
      price: priceSelected,
      pax,
      qty: 1,
      audience,
    };
    nav("/checkout", { state: { items: [item] } });
  };

  const rating = 4.8;
  const stars = Array.from({ length: 5 }, (_, i) => (
    <Star key={i} size={14} className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
  ));

  return (
    <article
      id={`pkg-${p.id}`}
      className="group relative overflow-hidden rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 bg-white dark:bg-gray-900"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={cover}
          alt={loc?.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 z-10 bg-blue-500/90 text-white px-2 py-1 rounded-full text-xs font-medium">
          {t("explore.privateTour")}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <button className="absolute top-3 right-3 z-10 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <Heart size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 line-clamp-1 text-gray-900 dark:text-white">
          {loc.title || p.slug}
        </h3>

        <div className="flex flex-wrap gap-1 mb-3">
          {(loc.spots || []).slice(0, 3).map((spot, i) => (
            <span
              key={i}
              className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full"
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
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatMoneyFromIDR(priceSelected, currency, fx, locale)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            / {pax} {t("home.pax")} • {audienceLabel}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => nav(`/packages/${p.id}`, { state: { pax, audience } })}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex-1 mr-2"
          >
            {t("home.viewDetails")}
          </button>
          <select
            value={pax}
            onChange={(e) => setPax(parseInt(e.target.value))}
            className="px-2 py-1 text-xs border border-gray-300 rounded-lg mr-2"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} {t("home.pax")}
              </option>
            ))}
          </select>
          <button onClick={goOrder} className="btn btn-primary px-4 py-2 rounded-lg">
            {t("actions.order")}
          </button>
        </div>
      </div>
    </article>
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
  const qsDest = qs.get("dest");
  const initialPax = Number(location.state?.pax) || 6;

  const [pax, setPax] = useState(initialPax);
  const [audience, setAudience] = useState("domestic");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [compact, setCompact] = useState(false);
  const [dest, setDest] = useState(qsDest || "all");

  // Ambil opsi destinasi dari DB
  const S = useMemo(
    () => Object.fromEntries((destSections || []).map((s) => [s.section_key, s])),
    [destSections]
  );
  const destinationOptions = useMemo(() => {
    const items = S.cards?.locale?.extra?.items || S.cards?.data?.items || [];
    const opts = (items || []).map((it) => ({
      key:
        it.key ||
        it.slug ||
        it.id ||
        (it.title || it.name || "dest").toLowerCase().replace(/\s+/g, "-"),
      label: it.title || it.name || it.key,
    }));
    if (!opts.find((o) => o.key === "nusa-penida")) {
      opts.push({
        key: "nusa-penida",
        label: t("dest.penidaTitle", { defaultValue: "Nusa Penida" }),
      });
    }
    return [{ key: "all", label: t("explore.all", { defaultValue: "Semua" }) }, ...opts];
  }, [S, t]);

  // Theme & scroll (dipakai bila toolbar diaktifkan)
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

  const { scrollY } = useScroll();
  const barH = useTransform(scrollY, [0, 120], ["6.25rem", "4.75rem"]);
  const barShadow = useTransform(scrollY, [0, 80], ["0 6px 24px rgba(2,6,23,.06)", "0 4px 18px rgba(2,6,23,.12)"]);
  const bgFrom = isDark ? "rgba(2,6,23,0.45)" : "rgba(255,255,255,0.60)";
  const bgTo = isDark ? "rgba(2,6,23,0.72)" : "rgba(255,255,255,0.90)";
  const barBg = useTransform(scrollY, [0, 80], [bgFrom, bgTo]);

  const sortPriceLabel = t("explore.sortPrice");
  const sortNameLabel = t("explore.sortName");
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
            const k =
              p.destination_key ||
              p.destination ||
              p.data?.destination ||
              p.data?.dest ||
              (dest === "nusa-penida" ? "nusa-penida" : null);
            return k === dest;
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

  // <<< Toggle toolbar di sini
  const SHOW_TOOLBAR = false;

  return (
    <div className="container mt-2 space-y-6">
      {SHOW_TOOLBAR && (
        <div
          style={{ minHeight: barH, boxShadow: barShadow, background: barBg }}
          className={`sticky top-[4.75rem] z-[5] rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md px-3 sm:px-4 py-3 sm:py-4 flex items-center transition-transform duration-200 ${
            hideToolbar ? "-translate-y-[120%]" : "translate-y-0"
          }`}
        >
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center gap-2 justify-between">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 pr-2">
                {t("explore.title")}
              </h1>
              <button
                className="btn btn-outline !py-1.5 !px-3"
                onClick={() => setCompact((v) => !v)}
                title={compact ? t("explore.cozyGrid") : t("explore.compactGrid")}
              >
                {compact ? <LayoutGrid size={16} /> : <Rows size={16} />}
                <span className="ml-2 text-xs">{compact ? t("explore.compact") : t("explore.cozy")}</span>
              </button>
            </div>

            <div className="grid grid-cols-12 gap-2 items-center">
              {/* Search */}
              <div className="col-span-12 sm:col-span-5">
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("explore.searchPlaceholder", { defaultValue: "Search packages or spots…" })}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm focus:shadow-md transition-shadow"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                </div>
              </div>

              {/* Destinations */}
              <div className="col-span-12 sm:col-span-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                    {t("explore.destinations", { defaultValue: "Destinations" })}
                  </label>
                  <select
                    value={dest}
                    onChange={(e) => setDest(e.target.value)}
                    className="px-3 py-2 rounded-xl w-full border border-gray-200/60 dark:border-gray-700/60"
                  >
                    {destinationOptions.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Audience */}
              <div className="col-span-7 sm:col-span-3">
                <div className="flex items-center gap-1 bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-1 overflow-x-auto no-scrollbar">
                  {["domestic", "foreign"].map((k) => (
                    <button
                      key={k}
                      onClick={() => setAudience(k)}
                      className={`btn ${audience === k ? "btn-primary" : "btn-outline"} !py-1.5 !px-3 text-xs whitespace-nowrap`}
                    >
                      {k === "domestic" ? domesticLabel : foreignLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pax */}
              <div className="col-span-5 sm:col-span-2">
                <div className="flex items-center gap-2 justify-end">
                  <label className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{t("home.calcFor")}</label>
                  <select
                    value={pax}
                    onChange={(e) => setPax(parseInt(e.target.value))}
                    className="px-3 py-2 rounded-xl border border-gray-200/60 dark:border-gray-700/60"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {t("home.pax")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sort (mobile & desktop) */}
              <div className="col-span-12 sm:hidden">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 rounded-xl w-full border border-gray-200/60 dark:border-gray-700/60"
                >
                  <option value="price">{sortPriceLabel}</option>
                  <option value="name">{sortNameLabel}</option>
                </select>
              </div>
              <div className="hidden sm:col-span-2 sm:flex items-center justify-end">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 rounded-xl w-full sm:w-auto border border-gray-200/60 dark:border-gray-700/60"
                >
                  <option value="price">{sortPriceLabel}</option>
                  <option value="name">{sortNameLabel}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid — No Motion/Fade */}
      <div className={`grid gap-6 ${compact ? "sm:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-3"}`}>
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
          <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-4">
              {t("explore.empty", { defaultValue: "No packages match your filters." })}
            </p>
            <div className="flex justify-center space-x-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-48 w-full mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
