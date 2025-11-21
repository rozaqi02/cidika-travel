// src/pages/PackageDetail.jsx
import React, { useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion"; // Animate
import { ArrowLeft, Calendar, Check, Info, MapPin, DollarSign } from "lucide-react";
import usePackages from "../hooks/usePackages";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";

/* ===== util (sama seperti Explore) ===== */
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

function ItineraryTimeline({ data }) {
  const { t } = useTranslation();
  const steps = Array.isArray(data) ? data : [];
  if (!steps.length) return null;
  return (
    <ol className="mt-4 relative border-l-2 border-sky-200 dark:border-sky-800 space-y-6 ml-2">
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
  if (!note) return null;
  const { t } = useTranslation();
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
  const { t } = useTranslation();
  const nav = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { rows: data = [] } = usePackages();
  const { fx, currency, locale } = useCurrency();

  const pkg = useMemo(() => data.find((p) => p.id === id || p.slug === id), [data, id]);
  const loc = normalizeLocale(pkg, locale?.slice(0, 2));

  const [audience, setAudience] = useState(location.state?.audience || "domestic");
  const [pax, setPax] = useState(location.state?.pax || 1);

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

  const cover = getPkgImage(pkg);
  const gallery = getGalleryList(pkg);

  const tiers = (pkg.price_tiers || []).filter((pt) => pt.audience === audience).sort((a, b) => a.pax - b.pax);
  const selectedTier = tiers.find((pt) => pt.pax === pax) || tiers[0];
  const price = selectedTier?.price_idr || 0;

  const audienceLabel = audience === "domestic" ? t("explore.domestic", { defaultValue: "Domestik" }) : "Foreign";

  const buildAskWAMessage = () => {
    const title = loc?.title || pkg.slug;
    const lines = [
      t("checkout.wa.header", { defaultValue: "Halo Admin CIDIKA, saya ingin bertanya." }),
      "",
      `Paket: ${title}`,
      `${t("home.pax")}: ${pax}`,
      `Tipe: ${audienceLabel}`,
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
    };
    nav("/checkout", { state: { items: [item] } });
  };

  return (
    <div className="container mt-2 pb-20">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl"
      >
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
          src={cover} 
          alt={loc?.title} 
          className="w-full h-[40vh] sm:h-[55vh] object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-900/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <motion.button 
             whileHover={{ x: -5 }}
             onClick={() => nav(-1)} 
             className="btn btn-outline text-white border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 !px-4 !py-2 mb-6 flex items-center gap-2 w-fit"
          >
            <ArrowLeft size={16} /> {t("back", { defaultValue: "Back" })}
          </motion.button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-5xl font-bold text-white leading-tight"
              >
                  {loc?.title || pkg.slug}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-200 text-sm sm:text-lg mt-3 max-w-2xl leading-relaxed"
              >
                  {loc?.summary || ""}
              </motion.p>
            </div>
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.5 }}
               className="text-left md:text-right shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10"
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
                  <motion.img
                    key={i}
                    src={src}
                    alt=""
                    loading="lazy"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    whileHover={{ scale: 1.05, zIndex: 10 }}
                    className="w-full aspect-[4/3] object-cover rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer shadow-sm hover:shadow-lg"
                  />
                ))}
              </div>
            </section>
          )}
        </motion.div>

        {/* Right: sticky booking card */}
        <div className="lg:col-span-1">
           <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="card p-6 h-max sticky top-[7.5rem] bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="font-bold text-xl text-gray-900 dark:text-white">{t("explore.title", { defaultValue: "Booking Options" })}</div>
            </div>

            <div className="space-y-4">
              <div>
                 <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Traveler Type</label>
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
                      {k === "domestic" ? t("explore.domestic", { defaultValue: "Domestik" }) : "Foreign"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                 <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Total Pax</label>
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
                 {formatMoneyFromIDR(price, currency, fx, locale)} x {pax} pax
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
                className="btn btn-outline w-full py-3.5 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                href={`https://wa.me/62895630193926?text=${buildAskWAMessage()}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("actions.askMore", { defaultValue: "Chat on WhatsApp" })}
              </a>
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
               <Info size={12}/> 
               <span>No payment required today</span>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}