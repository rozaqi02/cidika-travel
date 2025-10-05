// src/pages/Explore.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import usePackages from "../hooks/usePackages";
import usePageSections from "../hooks/usePageSections";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";

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

function normalizeLocale(p, currentLang) {
  const byCtx =
    p?.locale || (Array.isArray(p?.locales) ? p.locales.find((l) => l.lang === currentLang) : null);
  return byCtx || p?.locales?.[0] || {};
}

/* ===============================
   Tilt hook
================================= */
function useTiltRef() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let rAF = 0;
    const max = 6;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => {
        el.style.transform = `perspective(1000px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
      });
    };
    const reset = () => { cancelAnimationFrame(rAF); el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)"; };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", reset);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", reset); cancelAnimationFrame(rAF); };
  }, []);
  return ref;
}

/* ===============================
   PackageCard
================================= */
function PackageCard({ p, audience, pax, setPax, currency, fx, locale, t }) {
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

  const loc =
    p?.locale ||
    (Array.isArray(p?.locales)
      ? p.locales.find((l) => l.lang === (locale || "").slice(0, 2))
      : null) ||
    p?.locales?.[0] ||
    {};

  const audienceLabel =
    (locale || "").startsWith("id")
      ? audience === "domestic" ? "Domestik" : "Mancanegara"
      : (locale || "").startsWith("ja")
      ? audience === "domestic" ? "国内" : "海外"
      : audience === "domestic" ? "Domestic" : "Foreign";

  const goOrder = () => {
    // kirim 1 item ke Checkout via navigate state
    const item = {
      id: p.id,
      title: loc?.title || p.slug,
      price: priceSelected,    // harga per pax
      pax,                     // jumlah orang yang dipilih di Explore
      qty: 1,
      audience,                // domestic/foreign
    };
    nav("/checkout", { state: { items: [item] } });
  };

  return (
    <motion.article variants={itemVariants} id={`pkg-${p.id}`} className="card bg-transparent relative overflow-hidden p-0 hover-lift">
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
                  {audienceLabel} • {pax} {t("home.pax")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions row */}
      <div className="px-4 py-2 flex items-center justify-between gap-3">
        <button onClick={() => nav(`/packages/${p.id}`, { state: { pax, audience } })} className="btn glass">
          {t("explore.seeDetail", { defaultValue: "See Details" })}
        </button>

        <div className="flex items-center gap-2">
          <select value={pax} onChange={(e) => setPax(parseInt(e.target.value))} className="px-3 py-2 rounded-2xl">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} {t("home.pax")}
              </option>
            ))}
          </select>
          <button className="btn btn-primary glass" onClick={goOrder}>
            {t("actions.order", { defaultValue: "Order" })}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* ===============================
   Explore Page
================================= */
export default function Explore() {
  const { t, i18n } = useTranslation();
  const { rows: data = [] } = usePackages();
  const { fx, currency, locale } = useCurrency();
  const { sections: destSections = [] } = usePageSections("destinations");

  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const qsId = qs.get("pkg");
  const qsDest = qs.get("dest");
  const initialPax = Number(location.state?.pax) || 1;

  const [pax, setPax] = useState(initialPax);
  const [audience, setAudience] = useState("domestic");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [compact, setCompact] = useState(false);
  const [dest, setDest] = useState(qsDest || "all"); // default SEMUA

  // Ambil opsi destinasi dari DB (section_key "cards": extra.items/data.items). Fallback: Nusa Penida.
  const S = useMemo(
    () => Object.fromEntries((destSections || []).map((s) => [s.section_key, s])),
    [destSections]
  );
  const destinationOptions = useMemo(() => {
    const items =
      S.cards?.locale?.extra?.items ||
      S.cards?.data?.items ||
      [];
    const opts = (items || []).map((it) => ({
      key:
        it.key ||
        it.slug ||
        it.id ||
        (it.title || it.name || "dest").toLowerCase().replace(/\s+/g, "-"),
      label: it.title || it.name || it.key,
    }));
    // Pastikan minimal ada Nusa Penida agar aman saat awal.
    if (!opts.find((o) => o.key === "nusa-penida")) {
      opts.push({
        key: "nusa-penida",
        label: t("dest.penidaTitle", { defaultValue: "Nusa Penida" }),
      });
    }
    return [{ key: "all", label: t("explore.all", { defaultValue: "Semua" }) }, ...opts];
  }, [S, t]);

  // theme reactive
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : false
  );
  // hide-on-scroll
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

  // sticky toolbar
  const { scrollY } = useScroll();
  const barH = useTransform(scrollY, [0, 120], ["6.25rem", "4.75rem"]);
  const barShadow = useTransform(scrollY, [0, 80], ["0 6px 24px rgba(2,6,23,.06)", "0 4px 18px rgba(2,6,23,.12)"]);
  const bgFrom = isDark ? "rgba(2,6,23,0.45)" : "rgba(255,255,255,0.60)";
  const bgTo = isDark ? "rgba(2,6,23,0.72)" : "rgba(255,255,255,0.90)";
  const barBg = useTransform(scrollY, [0, 80], [bgFrom, bgTo]);

  // label sort
  const { sortPriceLabel, sortNameLabel, domesticLabel, foreignLabel } = useMemo(() => {
    const lang = (i18n.language || "id").slice(0, 2);
    if (lang === "ja") {
      return { sortPriceLabel: "最安", sortNameLabel: "A–Z", domesticLabel: "国内", foreignLabel: "海外" };
    }
    if (lang === "en") {
      return { sortPriceLabel: "Cheapest", sortNameLabel: "A–Z", domesticLabel: "Domestic", foreignLabel: "Foreign" };
    }
    return { sortPriceLabel: "Termurah", sortNameLabel: "A–Z", domesticLabel: "Domestik", foreignLabel: "Mancanegara" };
  }, [i18n.language]);

  // filter + sort
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const list0 = data.map((p) => {
      const loc = normalizeLocale(p, locale?.slice(0, 2));
      return { ...p, _loc: loc };
    });
    // Terapkan filter destinasi
    const list =
      dest === "all"
        ? list0
        : list0.filter((p) => {
            // dukung beberapa kemungkinan field — ke depan bisa set p.destination_key atau p.data.destination
            const k =
              p.destination_key ||
              p.destination ||
              p.data?.destination ||
              p.data?.dest ||
              // fallback heuristik (sementara semua paket dianggap Nusa Penida)
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
  }, [data, query, pax, sortBy, audience, locale]);

  return (
    <div className="container mt-2 space-y-5">
      {/* Sticky glass toolbar */}
      <motion.div
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
              title={compact ? "Cozy grid" : "Compact grid"}
            >
              {compact ? "🔳" : "🔲"}
            </button>
          </div>

          <div className="grid grid-cols-12 gap-2 items-center">
            {/* Search */}
            <div className="col-span-12 sm:col-span-5">
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

            {/* Destinations */}
            <div className="col-span-12 sm:col-span-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                  {t("explore.destinations", { defaultValue: "Destinations" })}
                </label>
                <select
                  value={dest}
                  onChange={(e) => setDest(e.target.value)}
                  className="px-3 py-2 rounded-2xl w-full"
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
              <div className="flex items-center gap-1 bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-1 overflow-x-auto no-scrollbar">
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
                <label htmlFor="pax" className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
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
            </div>

            {/* Sort */}
            <div className="col-span-12 sm:hidden">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 rounded-2xl w-full">
                <option value="price">{sortPriceLabel}</option>
                <option value="name">{sortNameLabel}</option>
              </select>
            </div>
            <div className="hidden sm:col-span-2 sm:flex items-center justify-end">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 rounded-2xl w-full sm:w-auto">
                <option value="price">{sortPriceLabel}</option>
                <option value="name">{sortNameLabel}</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid */}
      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="show"
        className={`grid gap-4 ${compact ? "sm:grid-cols-3" : "md:grid-cols-2"}`}
      >
        {filtered.map((p) => (
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
          />
        ))}
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
