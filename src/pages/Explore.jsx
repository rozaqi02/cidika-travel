import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import usePackages from "../hooks/usePackages";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";

const listVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } } };

export default function Explore() {
  const { t } = useTranslation();
  const { rows: data } = usePackages();
  const { fx, currency, locale } = useCurrency();

  return (
    <div className="container mt-6 space-y-4">
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {t("explore.title")}
      </motion.h1>

      <motion.div variants={listVariants} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-4">
        {data.map((p) => (
          <motion.div key={p.id} variants={itemVariants} className="card p-4">
            <details>
              <summary className="cursor-pointer font-semibold text-slate-900 dark:text-slate-100">{p.locale?.title}</summary>

              <div className="mt-3 grid md:grid-cols-2 gap-3">
                <div>
                  {(p.locale?.spots?.length || 0) > 0 && (
                    <>
                      <h4 className="font-medium">{t("explore.spots")}</h4>
                      <ul className="list-disc ml-5 text-sm">{p.locale.spots.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </>
                  )}

                  {(p.locale?.itinerary?.length || 0) > 0 && (
                    <>
                      <h4 className="font-medium mt-2">Itinerary</h4>
                      <ul className="list-disc ml-5 text-sm">{p.locale.itinerary.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </>
                  )}
                </div>

                <div>
                  {(p.locale?.include?.length || 0) > 0 && (
                    <>
                      <h4 className="font-medium">{t("explore.includes")}</h4>
                      <ul className="list-disc ml-5 text-sm">{p.locale.include.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </>
                  )}

                  {(p.price_tiers?.length || 0) > 0 && (
                    <>
                      <h4 className="font-medium mt-2">{t("explore.prices")}</h4>
                      <ul className="list-disc ml-5 text-sm">
                        {p.price_tiers.sort((a, b) => a.pax - b.pax).map((pt) => (
                          <li key={pt.pax}>
                            {pt.pax} {t("home.pax")}: {formatMoneyFromIDR(pt.price_idr, currency, fx, locale)}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {p.locale?.note && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{p.locale.note}</p>}
                </div>
              </div>
            </details>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
