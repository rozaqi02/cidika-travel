// src/pages/PackageDetail.jsx
import React, { useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Check, Info, MapPin, DollarSign, Users, ArrowRight } from "lucide-react";
import usePackages from "../hooks/usePackages";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";
import OptimizedImage from "../components/OptimizedImage";
import Lightbox from "../components/Lightbox";
import { PackageDetailSkeleton } from "../components/Skeleton";
import { getPkgImage, normalizeImageUrl } from "../utils/images";

/* ===== util ===== */

function getGalleryList(p) {
  const urls = new Set();
  const push = (u) => {
    if (!u) return;
    urls.add(normalizeImageUrl(u));
  };
  push(p?.default_image);
  if (Array.isArray(p?.images)) p.images.forEach(push);
  if (Array.isArray(p?.data?.images)) p.data.images.forEach(push);
  if (p?.cover_url) push(p.cover_url);
  if (p?.thumb_url) push(p.thumb_url);
  return Array.from(urls).slice(0, 12);
}

function normalizeLocale(p, currentLang) {
  const byCtx = p?.locale || (Array.isArray(p?.locales) ? p.locales.find((l) => l.lang === currentLang) : null);
  return byCtx || p?.locales?.[0] || {};
}

/* ===== small components ===== */
const SectionTitle = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 mt-6 mb-4">
    {Icon && <Icon size={20} className="text-sky-600 dark:text-sky-400" />}
    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{children}</h3>
  </div>
);

// --- KOMPONEN KARTU REKOMENDASI BARU ---
function RecommendationCard({ p, currency, fx, locale, lang, t }) {
  const nav = useNavigate();
  const cover = getPkgImage(p);
  const loc = normalizeLocale(p, lang);
  
  // Ambil harga terendah untuk display "Starts from"
  const lowestPrice = (p.price_tiers || []).reduce((min, t) => (t.price_idr < min ? t.price_idr : min), Infinity);
  const displayPrice = lowestPrice === Infinity ? 0 : lowestPrice;

  // Scroll ke atas saat pindah halaman
  const handleClick = () => {
    nav(`/packages/${p.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="card-package group cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
        <div className="relative h-40 overflow-hidden">
        <OptimizedImage
          src={cover}
          alt={loc.title}
          preset="card"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium uppercase text-white backdrop-blur-sm">
           {p.trip_type === 'open' ? t("explore.openTrip") : t("explore.private")}
        </div>
      </div>
      <div className="p-4">
        <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 mb-1" title={loc.title || p.slug}>
          {loc.title || p.slug}
        </h4>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
           <MapPin size={12} /> {p.destination_key ? p.destination_key.replace('-', ' ') : t("packageDetail.countryFallback", { defaultValue: "Indonesia" })}
        </div>
        <div className="flex items-center justify-between">
           <div className="text-xs text-gray-400">
             {t("packageDetail.from", { defaultValue: "From" })}
           </div>
           <div className="font-bold text-sky-600 dark:text-sky-400 text-sm">
              {formatMoneyFromIDR(displayPrice, currency, fx, locale)}
           </div>
        </div>
      </div>
    </motion.div>
  );
}

function ItineraryTimeline({ data }) {
  const steps = Array.isArray(data) ? data : [];
  if (!steps.length) return null;
  return (
    <ol className="relative ml-2 mt-4 space-y-6">
      <div className="itinerary-line absolute bottom-2 left-[7px] top-2 w-0.5" aria-hidden />
      {steps.map((step, i) => {
        const isObj = step && typeof step === "object";
        const time = String(isObj ? step.time ?? "" : "").trim();
        const text = String(isObj ? step.text ?? "" : step).trim();
        return (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="relative pl-8"
          >
            <span className="absolute left-[-9px] top-1.5 w-4 h-4 rounded-full bg-sky-500 ring-4 ring-white dark:ring-gray-900" />
            <div className="flex flex-col sm:flex-row sm:items-start gap-2">
              {time && (
                <span className="px-3 py-1 text-xs font-bold tracking-wide rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 shrink-0 w-fit">
                  {time}
                </span>
              )}
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200 mt-0.5">{text}</p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

function PillList({ items }) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {arr.map((s, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="px-3 py-1.5 rounded-full text-sm bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-700/60 transition hover:bg-sky-200 dark:hover:bg-sky-800/50"
        >
          {typeof s === "string" ? s : JSON.stringify(s)}
        </motion.span>
      ))}
    </div>
  );
}

function NoteSection({ note }) {
  const { t } = useTranslation();
  if (!note) return null;
  const lines = note.split("\n").map(line => line.trim()).filter(line => line);
  const bulletPoints = lines.filter(line => !line.match(/^\d\s+IDR/));
  const priceLines = lines.filter(line => line.match(/^\d\s+IDR/)).map(line => {
    const [pax, price, total] = line.split(/\s+IDR[\s.]+|Rp[\s.]+/).filter(Boolean);
    return { pax: parseInt(pax), price: parseInt(price.replace(/\./g, '')), total: parseInt(total.replace(/\./g, '')) };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-6 rounded-xl border border-amber-200/50 dark:border-amber-800/30 p-5 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm"
    >
      <div className="flex items-start gap-2 mb-3">
        <Info size={20} className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <h4 className="font-bold text-base text-gray-900 dark:text-white">{t("explore.notes", { defaultValue: "Additional Notes" })}</h4>
      </div>
      <ul className="space-y-2">
        {bulletPoints.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span>{point.replace(/Catatan\s*:/i, "").trim()}</span>
          </li>
        ))}
      </ul>
      {priceLines.length > 0 && (
        <>
          <h5 className="font-semibold text-sm mt-5 mb-3 text-gray-900 dark:text-white">{t("explore.pricingTable", { defaultValue: "Pricing Details" })}</h5>
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
             <div className="grid grid-cols-3 gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 p-3">
                <div>{t("home.pax")}</div>
                <div>{t("explore.pricePerPax", { defaultValue: "Price/Pax" })}</div>
                <div>{t("explore.totalPrice", { defaultValue: "Total" })}</div>
             </div>
             <div className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
               {priceLines.map((row, i) => (
                 <div key={i} className="grid grid-cols-3 gap-2 text-sm p-3 text-gray-600 dark:text-gray-300">
                   <div>{row.pax}</div>
                   <div>IDR {row.price.toLocaleString()}</div>
                   <div>IDR {row.total.toLocaleString()}</div>
                 </div>
               ))}
             </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ===== page ===== */
export default function PackageDetail() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { rows: data = [], loading } = usePackages();
  const { fx, currency, locale } = useCurrency();
  const lang = (i18n.resolvedLanguage || i18n.language || "id").split("-")[0];

  const pkg = useMemo(() => data.find((p) => p.id === id || p.slug === id), [data, id]);
  const loc = normalizeLocale(pkg, locale?.slice(0, 2));

  const [audience, setAudience] = useState(location.state?.audience || "domestic");
  const [pax, setPax] = useState(location.state?.pax || 1);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  // --- LOGIC REKOMENDASI ---
  const recommendations = useMemo(() => {
    if (!data.length || !pkg) return [];
    // Filter paket agar tidak menampilkan paket yang sedang dilihat
    const otherPackages = data.filter(p => p.id !== pkg.id);
    // Acak urutan array
    const shuffled = [...otherPackages].sort(() => 0.5 - Math.random());
    // Ambil 3 pertama
    return shuffled.slice(0, 3);
  }, [data, pkg]);
  // -------------------------

  if (loading) {
    return <PackageDetailSkeleton />;
  }

  if (!pkg) {
    return (
      <div className="container py-12">
        <button onClick={() => nav(-1)} className="btn btn-outline mb-4 flex items-center gap-2">
          <ArrowLeft size={16} /> {t("back", { defaultValue: "Back" })}
        </button>
        <div className="card p-6 text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
          {t("explore.empty", { defaultValue: "No packages match your filters." })}
        </div>
      </div>
    );
  }

  // --- LOGIC TRIP TYPE ---
  const isOpenTrip = pkg.trip_type === "open";
  const tripTypeLabel = isOpenTrip ? t("explore.openTrip") : t("explore.privateTour", { defaultValue: "Private Trip" });
  const tripTypeColor = isOpenTrip ? "bg-amber-500 text-white" : "bg-sky-500 text-white";
  const tripTypeBadge = (
      <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide sm:text-xs ${tripTypeColor}`}>
          {isOpenTrip && <Users size={12} className="shrink-0" />}
          <span className="truncate">{tripTypeLabel}</span>
      </span>
  );
  // -----------------------

  const cover = getPkgImage(pkg);
  const gallery = getGalleryList(pkg);

  const tiers = (pkg.price_tiers || []).filter((pt) => pt.audience === audience).sort((a, b) => a.pax - b.pax);
  const selectedTier = tiers.find((pt) => pt.pax === pax) || tiers[0];
  const price = selectedTier?.price_idr || 0;

  const audienceLabel = audience === "domestic" ? t("explore.domestic", { defaultValue: "Domestik" }) : t("explore.foreign", { defaultValue: "Foreign" });

  const buildAskWAMessage = () => {
    const title = loc?.title || pkg.slug;
    const lines = [
      t("checkout.wa.header", { defaultValue: "Halo Admin CIDIKA, saya ingin bertanya." }),
      "",
      `${t("packageDetail.askPackage", { defaultValue: "Package" })}: ${title}`,
      `${t("packageDetail.askTripType", { defaultValue: "Trip Type" })}: ${tripTypeLabel}`,
      `${t("home.pax")}: ${pax}`,
      `${t("packageDetail.askAudience", { defaultValue: "Traveler Type" })}: ${audienceLabel}`,
      t("checkout.wa.footer", { defaultValue: "Mohon info lebih lanjut ya 🙏" }),
    ];
    return encodeURIComponent(lines.join("\n"));
  };

  const goOrder = () => {
    const item = {
      id: pkg.id,
      title: loc?.title || pkg.slug,
      price,  // per pax
      pax,
      qty: 1,
      audience,
      trip_type: pkg.trip_type,
    };
    nav("/checkout", { state: { items: [item] } });
  };

  return (
    <div className="container mt-2 pb-28 lg:pb-20">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl"
      >
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative w-full h-[40vh] min-h-[280px] sm:h-[55vh] sm:min-h-[320px]"
        >
          <OptimizedImage
            src={cover}
            alt={loc?.title}
            preset="detail"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchpriority="high"
          />
          <div className="absolute inset-0 hero-tropical-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-900/20 to-transparent" />
        </motion.div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => nav(-1)}
          className="absolute left-4 top-4 z-20 flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/20 sm:left-6 sm:top-6"
        >
          <ArrowLeft size={16} /> {t("back", { defaultValue: "Back" })}
        </motion.button>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-gray-950/95 via-gray-950/70 to-transparent pt-16 sm:pt-20">
          <div className="pointer-events-auto p-4 sm:p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
            <div className="min-w-0 flex-1">
              {/* Trip Type Badge Hero */}
              <motion.div 
                 initial={{ opacity: 0, y: 10 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 className="mb-3 max-w-full"
              >
                  {tripTypeBadge}
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="home-hero-title line-clamp-3 break-words text-white text-[clamp(28px,7vw,68px)] leading-[1.05] max-w-4xl"
              >
                  {loc?.title || pkg.slug}
              </motion.h1>
              {loc?.summary ? (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-200 text-sm sm:text-base md:text-lg mt-2 sm:mt-3 max-w-2xl leading-relaxed line-clamp-2 sm:line-clamp-3"
                >
                  {loc.summary}
                </motion.p>
              ) : null}
            </div>
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.5 }}
               className="w-full shrink-0 text-left md:w-auto md:max-w-[240px] md:text-right bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10"
            >
              <div className="text-sky-400 font-extrabold text-3xl sm:text-4xl">
                {formatMoneyFromIDR(price, currency, fx, locale)} 
              </div>
              <div className="text-sm text-gray-300 mt-1 flex items-center md:justify-end gap-2">
                 <span>{audienceLabel}</span>
                 <span className="w-1 h-1 bg-gray-500 rounded-full"/>
                 <span>{pax} {t("home.pax")}</span>
              </div>
            </motion.div>
          </div>
          </div>
        </div>
      </motion.div>

      {/* Content grid */}
      <div className="grid lg:grid-cols-3 gap-8 mt-8">
        {/* Left: details */}
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2, duration: 0.5 }}
           className="lg:col-span-2 space-y-8"
        >
          {(loc?.spots?.length || 0) > 0 && (
            <section>
              <SectionTitle icon={MapPin}>{t("explore.spots", { defaultValue: "Attractions" })}</SectionTitle>
              <PillList items={loc?.spots} />
            </section>
          )}

          {(loc?.itinerary?.length || 0) > 0 && (
            <section>
              <SectionTitle icon={Calendar}>{t("explore.itinerary", { defaultValue: "Itinerary" })}</SectionTitle>
              <ItineraryTimeline data={loc?.itinerary} />
            </section>
          )}

          {(loc?.include?.length || 0) > 0 && (
            <section>
              <SectionTitle icon={Check}>{t("explore.includes", { defaultValue: "Includes" })}</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                {loc.include.map((s, i) => (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    whileInView={{ opacity: 1 }} 
                    transition={{ delay: i*0.05 }}
                    key={i} 
                    className="flex items-start gap-2.5"
                  >
                    <div className="mt-1 p-0.5 bg-emerald-200 dark:bg-emerald-800 rounded-full">
                       <Check size={12} className="text-emerald-800 dark:text-emerald-200 font-bold" strokeWidth={3} />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-200">{typeof s === "string" ? s : JSON.stringify(s)}</span>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {loc?.note && <NoteSection note={loc.note} />}

          {gallery.length > 1 && (
            <section>
              <SectionTitle icon={DollarSign}>{t("explore.prices", { defaultValue: "Price per Pax" })}</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tiers.map((pt) => (
                  <button
                    key={pt.pax}
                    onClick={() => setPax(pt.pax)}
                    className={`rounded-xl border px-4 py-3 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                      pt.pax === pax 
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-900/40 ring-2 ring-sky-500/20" 
                        : "border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700"
                    }`}
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">{pt.pax} {t("home.pax")}</div>
                    <div className="text-base font-bold text-gray-900 dark:text-white mt-1">{formatMoneyFromIDR(pt.price_idr, currency, fx, locale)}</div>
                  </button>
                ))}
              </div>

              <SectionTitle>{t("gallery", { defaultValue: "Gallery" })}</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {gallery.map((src, i) => (
                  <motion.button
                    type="button"
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    whileHover={{ scale: 1.05, zIndex: 10 }}
                    onClick={() => setLightboxIdx(i)}
                    className="w-full aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-transparent shadow-sm hover:shadow-lg dark:border-slate-800"
                  >
                    <OptimizedImage
                      src={src}
                      alt=""
                      preset="gallery"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </motion.button>
                ))}
              </div>
            </section>
          )}
        </motion.div>

        {/* Right: sticky booking card */}
        <div className="hidden lg:col-span-1 lg:block">
           <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="card p-6 h-max sticky top-[7.5rem] bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="font-bold text-xl text-gray-900 dark:text-white">{t("packageDetail.bookingOptions", { defaultValue: "Booking Options" })}</div>
            </div>

            <div className="space-y-4">
              {/* Trip Type Info */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <span className="shrink-0 text-xs font-semibold text-gray-500 uppercase">
                    {t("packageDetail.tripType", { defaultValue: "Trip Type" })}
                  </span>
                  <span className={`max-w-[58%] truncate rounded px-2 py-0.5 text-right text-xs font-bold ${isOpenTrip ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                      {tripTypeLabel}
                  </span>
              </div>

              <div>
                 <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                   {t("packageDetail.travelerType", { defaultValue: "Traveler Type" })}
                 </label>
                 <div className="grid grid-cols-2 gap-2">
                  {["domestic", "foreign"].map((k) => (
                    <button
                      key={k}
                      onClick={() => setAudience(k)}
                      className={`py-2 px-3 text-sm rounded-xl border transition-all font-medium ${
                         audience === k 
                          ? "bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-200 dark:shadow-none" 
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {k === "domestic" ? t("explore.domestic", { defaultValue: "Domestik" }) : t("explore.foreign", { defaultValue: "Foreign" })}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                 <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
                   {t("packageDetail.totalPax", { defaultValue: "Total Pax" })}
                 </label>
                 <select
                  value={pax}
                  onChange={(e) => setPax(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {t("home.pax")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t("explore.prices", { defaultValue: "Total Price" })}</div>
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                 {formatMoneyFromIDR(price * pax, currency, fx, locale)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                 {formatMoneyFromIDR(price, currency, fx, locale)} x {pax} {t("home.pax")}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                className="btn btn-primary w-full py-3.5 rounded-xl text-base font-bold shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all active:scale-[0.98]"
                onClick={goOrder}
              >
                {t("actions.order", { defaultValue: "Book Now" })}
              </button>
              <a
                className="btn btn-wa w-full rounded-xl py-3.5 font-semibold"
                href={`https://wa.me/62895630193926?text=${buildAskWAMessage()}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("actions.askMore", { defaultValue: "Chat on WhatsApp" })}
              </a>
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
               <Info size={12}/> 
               <span>
                 {t("packageDetail.noPaymentToday", {
                   defaultValue: "No payment required today",
                 })}
               </span>
            </div>
          </motion.aside>
        </div>
      </div>

      {/* --- RECOMMENDATIONS SECTION (BARU) --- */}
      {recommendations.length > 0 && (
        <div className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
               {t("explore.recommended", { defaultValue: "Other Trips You Might Like" })}
             </h2>
             <button onClick={() => nav('/explore')} className="text-sm font-semibold text-sky-600 hover:underline flex items-center gap-1">
                {t("packageDetail.seeAll", { defaultValue: "See All" })} <ArrowRight size={14}/>
             </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
             {recommendations.map(p => (
                <RecommendationCard 
                   key={p.id} 
                   p={p} 
                   currency={currency} 
                   fx={fx} 
                   locale={locale} 
                   lang={lang} 
                   t={t}
                />
             ))}
          </div>
        </div>
      )}
      {/* -------------------------------------- */}

      {lightboxIdx !== null ? (
        <Lightbox
          images={gallery}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={setLightboxIdx}
        />
      ) : null}

      <div
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:hidden"
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {t("explore.prices", { defaultValue: "Total" })}
            </div>
            <div className="text-xl font-extrabold text-sky-600 dark:text-sky-400">
              {formatMoneyFromIDR(price * pax, currency, fx, locale)}
            </div>
          </div>
          <button type="button" className="btn btn-primary rounded-full px-6 py-3" onClick={goOrder}>
            {t("actions.order", { defaultValue: "Book Now" })}
          </button>
        </div>
      </div>

    </div>
  );
}
