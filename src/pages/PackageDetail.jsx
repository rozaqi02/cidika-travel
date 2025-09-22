// src/pages/PackageDetail.jsx
import React, { useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Check, Info, MapPin, DollarSign, Heart } from "lucide-react";
import usePackages from "../hooks/usePackages";
import { useCurrency } from "../context/CurrencyContext";
import { useCart } from "../context/CartContext";
import { formatMoneyFromIDR } from "../utils/currency";

/* ===== util dari Explore ===== */
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
  <div className="flex items-center gap-2 mt-4">
    {Icon && <Icon size={18} className="text-sky-600 dark:text-sky-400" />}
    <h3 className="font-semibold text-base">{children}</h3>
  </div>
);

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
    <div className="mt-2 flex flex-wrap gap-2">
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

/* ===== page ===== */
export default function PackageDetail() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { rows: data = [] } = usePackages();
  const { fx, currency, locale } = useCurrency();
  const { addItem } = useCart();

  const pkg = useMemo(() => data.find((p) => p.id === id || p.slug === id), [data, id]);
  const loc = normalizeLocale(pkg, locale?.slice(0, 2));

  const [audience, setAudience] = useState(location.state?.audience || "domestic");
  const [pax, setPax] = useState(location.state?.pax || 1);

  if (!pkg) {
    return (
      <div className="container py-12">
        <button onClick={() => nav(-1)} className="btn btn-outline mb-4"><ArrowLeft size={16} className="mr-2" />{t("back", { defaultValue: "Back" })}</button>
        <div className="card p-6 text-slate-600 dark:text-slate-300">{t("explore.empty", { defaultValue: "No packages match your filters." })}</div>
      </div>
    );
  }

  const cover = getPkgImage(pkg);
  const gallery = getGalleryList(pkg);

  const tiers = (pkg.price_tiers || []).filter((pt) => pt.audience === audience).sort((a, b) => a.pax - b.pax);
  const selectedTier = tiers.find((pt) => pt.pax === pax) || tiers[0];
  const price = selectedTier?.price_idr || 0;

  const audienceLabel = audience === "domestic" ? t("explore.domestic", { defaultValue: "Domestik" }) : "Foreign";

  const buildWAMessage = () => {
    const title = loc?.title || pkg.slug;
    const lines = [
      t("checkout.wa.header", { defaultValue: "Halo Admin CIDIKA, saya ingin booking." }),
      "",
      `Paket: ${title}`,
      `${t("home.pax")}: ${pax}`,
      `Tipe: ${audienceLabel}`,
      `${t("checkout.wa.total", { defaultValue: "Total" })}: ${formatMoneyFromIDR(price, currency, fx, locale)}/pax`,
      "",
      t("checkout.wa.footer", { defaultValue: "Mohon konfirmasinya ya 🙏" }),
    ];
    return encodeURIComponent(lines.join("\n"));
  };

  return (
    <div className="container mt-2">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <img src={cover} alt="" className="w-full h-[36vh] sm:h-[46vh] object-cover hero-img" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/40 to-transparent dark:from-slate-950/85 dark:via-slate-950/35" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <button onClick={() => nav(-1)} className="btn glass !px-3 !py-1.5 mb-3">
            <ArrowLeft size={16} className="mr-1" /> {t("back", { defaultValue: "Back" })}
          </button>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{loc?.title || pkg.slug}</h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mt-1 line-clamp-2">{loc?.summary || ""}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sky-700 dark:text-sky-300 font-extrabold text-xl">
                {formatMoneyFromIDR(price, currency, fx, locale)} <span className="text-sm font-normal text-slate-600 dark:text-slate-400">/ {t("home.perPax")}</span>
              </div>
              <div className="text-[12px] text-slate-500 dark:text-slate-400">{audienceLabel} • {pax} {t("home.pax")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid lg:grid-cols-3 gap-5 mt-4">
        {/* Left: details */}
        <div className="lg:col-span-2 card p-4 sm:p-5">
          {(loc?.spots?.length || 0) > 0 && (
            <>
              <SectionTitle icon={MapPin}>{t("explore.spots", { defaultValue: "Attractions" })}</SectionTitle>
              <PillList items={loc?.spots} />
            </>
          )}

          {(loc?.itinerary?.length || 0) > 0 && (
            <>
              <SectionTitle icon={Calendar}>{t("explore.itinerary", { defaultValue: "Itinerary" })}</SectionTitle>
              <ItineraryTimeline data={loc?.itinerary} />
            </>
          )}

          {(loc?.include?.length || 0) > 0 && (
            <>
              <SectionTitle icon={Check}>{t("explore.includes", { defaultValue: "Includes" })}</SectionTitle>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {loc.include.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-sm">{typeof s === "string" ? s : JSON.stringify(s)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {loc?.note && (
            <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex gap-2">
              <Info size={16} className="mt-1 text-amber-600" />
              <p className="text-sm text-slate-600 dark:text-slate-300">{loc.note}</p>
            </div>
          )}

          {/* Gallery */}
          {gallery.length > 1 && (
            <>
              <SectionTitle icon={DollarSign}>{t("explore.prices", { defaultValue: "Price per Pax" })}</SectionTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                {tiers.map((pt) => (
                  <button
                    key={pt.pax}
                    onClick={() => setPax(pt.pax)}
                    className={`rounded-xl border px-3 py-2 text-left transition ${pt.pax === pax ? "border-sky-400 bg-sky-50 dark:bg-sky-950/30" : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"}`}
                  >
                    <div className="text-[11px] text-slate-500">
                      {pt.pax} {t("home.pax")}
                    </div>
                    <div className="text-sm font-semibold">{formatMoneyFromIDR(pt.price_idr, currency, fx, locale)}</div>
                  </button>
                ))}
              </div>

              <SectionTitle>{t("gallery", { defaultValue: "Gallery" })}</SectionTitle>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {gallery.map((src, i) => (
                  <img key={i} src={src} alt="" loading="lazy" className="w-full aspect-[4/3] object-cover rounded-xl border border-slate-200 dark:border-slate-800" />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: sticky booking card */}
        <motion.aside
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="card p-4 h-max sticky top-[7.5rem] backdrop-blur-md"
          style={{ background: "color-mix(in srgb, rgba(255,255,255,.72) 50%, transparent)" }}
        >
          {/* dark: glassy */}
          <div className="hidden dark:block absolute inset-0 -z-10 rounded-2xl backdrop-blur-md" style={{ background: "rgba(2,6,23,.55)" }} />
          <div className="flex items-center justify-between">
            <div className="font-semibold">{t("explore.title", { defaultValue: "Explore Packages" })}</div>
          </div>

          <div className="mt-3 flex items-center gap-2">
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

            <select value={pax} onChange={(e) => setPax(parseInt(e.target.value))} className="px-3 py-2 rounded-2xl">
              {[1,2,3,4,5,6].map((n) => (
                <option key={n} value={n}>{n} {t("home.pax")}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
            <div className="text-[12px] text-slate-500 dark:text-slate-400">{t("explore.prices", { defaultValue: "Price per Pax" })}</div>
            <div className="text-xl font-extrabold text-sky-700 dark:text-sky-300">{formatMoneyFromIDR(price, currency, fx, locale)}</div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              className="btn btn-primary glass flex-1"
              onClick={() => {
                addItem({
                  id: pkg.id,
                  title: loc?.title || pkg.slug,
                  price: price,
                  pax,
                  qty: 1,
                  audience,
                });
                window.dispatchEvent(new CustomEvent("WISHLIST_FX"));
              }}
            >
              <Heart size={16} className="mr-2" /> {t("home.addToCart", { defaultValue: "Add to Cart" }).replace(/cart|keranjang/i, "Wishlist")}
            </button>
            <a
              className="btn btn-outline"
              href={`https://wa.me/6289523949667?text=${buildWAMessage()}`}
              target="_blank" rel="noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
