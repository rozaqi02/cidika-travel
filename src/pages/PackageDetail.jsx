import React, { useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
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
    // PERUBAHAN 1: Hapus `pl-6` dari <ol> agar `<li>` bisa mengontrol paddingnya sendiri
    <ol className="mt-4 relative border-l-2 border-sky-200 dark:border-sky-800 space-y-4">
      {steps.map((step, i) => {
        const isObj = step && typeof step === "object";
        const time = String(isObj ? step.time ?? "" : "").trim();
        const text = String(isObj ? step.text ?? "" : step).trim();
        return (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            // PERUBAHAN 2: Tambahkan padding kiri di sini untuk memberi ruang bagi teks
            className="relative pl-8"
          >
            {/* PERUBAHAN 3: Ubah cara pemosisian dot agar sempurna di tengah garis */}
            <span className="absolute left-[1px] top-1.5 w-4 h-4 rounded-full bg-sky-500 ring-4 ring-white dark:ring-gray-900 -translate-x-1/2" />
            <div className="flex items-start gap-3">
              {time && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 shrink-0">
                  {time}
                </span>
              )}
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">{text}</p>
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
        <span
          key={i}
          className="px-3 py-1.5 rounded-full text-sm bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-700/60 transition hover:bg-sky-200 dark:hover:bg-sky-800/50"
        >
          {typeof s === "string" ? s : JSON.stringify(s)}
        </span>
      ))}
    </div>
  );
}

function NoteSection({ note }) {
  if (!note) return null;
  const { t } = useTranslation();
  // Parse note untuk memisahkan poin-poin dan tabel harga
  const lines = note.split("\n").map(line => line.trim()).filter(line => line);
  const bulletPoints = lines.filter(line => !line.match(/^\d\s+IDR/));
  const priceLines = lines.filter(line => line.match(/^\d\s+IDR/)).map(line => {
    const [pax, price, total] = line.split(/\s+IDR[\s.]+|Rp[\s.]+/).filter(Boolean);
    return { pax: parseInt(pax), price: parseInt(price.replace(/\./g, '')), total: parseInt(total.replace(/\./g, '')) };
  });

  return (
    <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-start gap-2 mb-3">
        <Info size={18} className="mt-1 text-amber-600 dark:text-amber-400 shrink-0" />
        <h4 className="font-semibold text-base text-gray-900 dark:text-white">{t("explore.notes", { defaultValue: "Additional Notes" })}</h4>
      </div>
      <ul className="space-y-2">
        {bulletPoints.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span>{point.replace(/Catatan\s*:/i, "").trim()}</span>
          </li>
        ))}
      </ul>
      {priceLines.length > 0 && (
        <>
          <h5 className="font-semibold text-sm mt-4 mb-2 text-gray-900 dark:text-white">{t("explore.pricingTable", { defaultValue: "Pricing Details" })}</h5>
          <div className="grid grid-cols-3 gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
            <div className="font-semibold">{t("home.pax")}</div>
            <div className="font-semibold">{t("explore.pricePerPax", { defaultValue: "Price/Pax" })}</div>
            <div className="font-semibold">{t("explore.totalPrice", { defaultValue: "Total" })}</div>
            {priceLines.map((row, i) => (
              <React.Fragment key={i}>
                <div>{row.pax}</div>
                <div>IDR {row.price.toLocaleString()}</div>
                <div>IDR {row.total.toLocaleString()}</div>
              </React.Fragment>
            ))}
          </div>
        </>
      )}
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

  // WA text — untuk "Tanya lebih lanjut"
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

  // klik Order → ke Checkout dengan item sesuai pilihan
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
    <div className="container mt-2">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg"
      >
        <img src={cover} alt={loc?.title} className="w-full h-[40vh] sm:h-[50vh] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <button onClick={() => nav(-1)} className="btn btn-primary glass !px-4 !py-2 mb-4 flex items-center gap-2">
            <ArrowLeft size={16} /> {t("back", { defaultValue: "Back" })}
          </button>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">{loc?.title || pkg.slug}</h1>
              <p className="text-gray-200 text-sm sm:text-base mt-2 line-clamp-2">{loc?.summary || ""}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sky-400 font-extrabold text-2xl sm:text-3xl">
                {formatMoneyFromIDR(price, currency, fx, locale)} <span className="text-sm font-normal text-gray-300">/ {t("home.perPax")}</span>
              </div>
              <div className="text-sm text-gray-300">{audienceLabel} • {pax} {t("home.pax")}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content grid */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {loc.include.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check size={16} className="mt-1 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">{typeof s === "string" ? s : JSON.stringify(s)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {loc?.note && <NoteSection note={loc.note} />}

          {gallery.length > 1 && (
            <>
              <SectionTitle icon={DollarSign}>{t("explore.prices", { defaultValue: "Price per Pax" })}</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tiers.map((pt) => (
                  <button
                    key={pt.pax}
                    onClick={() => setPax(pt.pax)}
                    className={`rounded-xl border px-4 py-3 text-left transition-all hover:shadow-md ${
                      pt.pax === pax ? "border-sky-400 bg-sky-50 dark:bg-sky-950/30" : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400">{pt.pax} {t("home.pax")}</div>
                    <div className="text-base font-semibold text-gray-900 dark:text-white">{formatMoneyFromIDR(pt.price_idr, currency, fx, locale)}</div>
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className="w-full aspect-[4/3] object-cover rounded-xl border border-slate-200 dark:border-slate-800 hover:scale-105 transition-transform"
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: sticky booking card */}
        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card p-5 h-max sticky top-[7.5rem] bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-700/60"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-lg text-gray-900 dark:text-white">{t("explore.title", { defaultValue: "Explore Packages" })}</div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1 bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-1">
              {["domestic", "foreign"].map((k) => (
                <button
                  key={k}
                  onClick={() => setAudience(k)}
                  className={`btn ${audience === k ? "btn-primary" : "btn-outline"} !py-1.5 !px-3 text-sm transition-all`}
                >
                  {k === "domestic" ? t("explore.domestic", { defaultValue: "Domestik" }) : "Foreign"}
                </button>
              ))}
            </div>

            <select
              value={pax}
              onChange={(e) => setPax(parseInt(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/50 text-sm"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {t("home.pax")}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="text-sm text-gray-500 dark:text-gray-400">{t("explore.prices", { defaultValue: "Price per Pax" })}</div>
            <div className="text-2xl font-extrabold text-sky-700 dark:text-sky-300">{formatMoneyFromIDR(price, currency, fx, locale)}</div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              className="btn btn-primary flex-1 py-2.5 rounded-xl hover:bg-sky-600 transition-colors"
              onClick={goOrder}
            >
              {t("actions.order", { defaultValue: "Order" })}
            </button>
            <a
              className="btn btn-outline py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              href={`https://wa.me/62895630193926?text=${buildAskWAMessage()}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("actions.askMore", { defaultValue: "Tanya lebih lanjut" })}
            </a>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}