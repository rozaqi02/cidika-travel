import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import usePackages from "../hooks/usePackages";
import { useCurrency } from "../context/CurrencyContext";
import { useCart } from "../context/CartContext";
import { formatMoneyFromIDR } from "../utils/currency";

const listVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } } };

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

export default function Explore() {
  const { t } = useTranslation();
  const { rows: data } = usePackages();
  const { fx, currency, locale } = useCurrency();
  const { addItem } = useCart();

  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const stateOpenId = location.state?.openId || null;
  const qsId = qs.get("pkg");
  const initialOpenId = stateOpenId || qsId || null;
  const initialPax = Number(location.state?.pax) || 1;

  const [openId, setOpenId] = useState(initialOpenId);
  const [pax, setPax] = useState(initialPax);

  const refs = useRef({});
  useEffect(() => {
    if (!openId) return;
    const el = refs.current[openId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openId, data]);

  return (
    <div className="container mt-6 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex items-end justify-between gap-3"
      >
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t("explore.title")}
        </h1>

        <div className="flex items-center gap-2">
          <label htmlFor="pax" className="text-sm text-slate-500 dark:text-slate-400">
            {t("home.calcFor")}
          </label>
          <select
            id="pax"
            value={pax}
            onChange={(e) => setPax(parseInt(e.target.value))}
            className="px-3 py-2 rounded-2xl"
          >
            {[1,2,3,4,5,6].map(n => (
              <option key={n} value={n}>{n} {t("home.pax")}</option>
            ))}
          </select>
        </div>
      </motion.div>

      <motion.div variants={listVariants} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-4">
        {data.map((p) => {
          const isOpen = openId === p.id;
          const cover = getPkgImage(p);
          const tierForSelectedPax = (p.price_tiers || []).find(x => x.pax === pax) || (p.price_tiers || [])[0];
          const priceSelected = tierForSelectedPax?.price_idr || 0;

          return (
            <motion.article
              key={p.id}
              variants={itemVariants}
              ref={(el) => (refs.current[p.id] = el)}
              className="card bg-transparent relative overflow-hidden p-0 hover-lift"
              id={`pkg-${p.id}`}
            >
              {/* HEADER ala Home */}
              <div className="relative p-4">
                <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/45 to-white/15 dark:from-slate-950/70 dark:via-slate-950/35 dark:to-slate-950/10" />
                <div className="relative">
                  <h3 className="font-semibold text-lg">{p.locale?.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-1">
                    {(p.locale?.spots || []).slice(0, 6).join(" • ")}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sky-700 dark:text-sky-300 font-bold">
                      {formatMoneyFromIDR(priceSelected, currency, fx, locale)}{" "}
                      <span className="text-sm font-normal text-slate-600 dark:text-slate-400">/ {t("home.perPax")}</span>
                    </p>
                    <button onClick={() => setOpenId(isOpen ? null : p.id)} className="btn glass">
                      {isOpen
                        ? t("explore.hideDetail", { defaultValue: "Hide Detail" })
                        : t("explore.seeDetail", { defaultValue: "See Detail" })}
                    </button>
                  </div>
                </div>
              </div>

              {/* DETAIL */}
              {isOpen && (
                <div className="relative px-4 pb-4 pt-2">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Kolom A */}
                    <div>
                      {(p.locale?.spots?.length || 0) > 0 && (
                        <>
                          <h4 className="font-medium">{t("explore.spots")}</h4>
                          <ul className="mt-1 list-disc ml-5 text-sm">
                            {p.locale.spots.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </>
                      )}

                      {(p.locale?.itinerary?.length || 0) > 0 && (
                        <>
                          <h4 className="font-medium mt-3">{t("explore.itinerary", { defaultValue: "Itinerary" })}</h4>
                          <ul className="mt-1 list-disc ml-5 text-sm">
                            {p.locale.itinerary.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </>
                      )}
                    </div>

                    {/* Kolom B */}
                    <div>
                      {(p.locale?.include?.length || 0) > 0 && (
                        <>
                          <h4 className="font-medium">{t("explore.includes")}</h4>
                          <ul className="mt-1 list-disc ml-5 text-sm">
                            {p.locale.include.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </>
                      )}

                      {(p.price_tiers?.length || 0) > 0 && (
                        <>
                          <h4 className="font-medium mt-3">{t("explore.prices")}</h4>
                          <ul className="mt-1 list-disc ml-5 text-sm">
                            {[...(p.price_tiers || [])]
                              .sort((a, b) => a.pax - b.pax)
                              .map((pt) => (
                                <li key={pt.pax} className={pt.pax === pax ? "font-semibold" : ""}>
                                  {pt.pax} {t("home.pax")}: {formatMoneyFromIDR(pt.price_idr, currency, fx, locale)}
                                  {pt.pax === pax && " ←"}
                                </li>
                              ))}
                          </ul>
                        </>
                      )}

                      {p.locale?.note && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">{p.locale.note}</p>
                      )}
                    </div>
                  </div>

                  {/* Aksi */}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <label htmlFor={`pax-${p.id}`} className="text-sm text-slate-500 dark:text-slate-400">
                        {t("home.calcFor")}
                      </label>
                      <select
                        id={`pax-${p.id}`}
                        value={pax}
                        onChange={(e) => setPax(parseInt(e.target.value))}
                        className="px-3 py-2 rounded-2xl"
                      >
                        {[1,2,3,4,5,6].map(n => (
                          <option key={n} value={n}>{n} {t("home.pax")}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      className="btn btn-primary glass"
                      onClick={() =>
                        addItem({
                          id: p.id,
                          title: p.locale?.title,
                          price: (p.price_tiers || []).find(x => x.pax === pax)?.price_idr || priceSelected,
                          pax,
                          qty: 1,
                        })
                      }
                    >
                      {t("home.addToCart", { defaultValue: "Add to Cart" }).replace(/cart|keranjang/i,"Wishlist")}
                    </button>
                  </div>
                </div>
              )}
            </motion.article>
          );
        })}
      </motion.div>
    </div>
  );
}
