import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function FAQ() {
  const { t } = useTranslation();
  const faqs = t("faq.list", { returnObjects: true }) || [];

  return (
    <div className="container mt-4 space-y-4">
      {/* hero */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md p-4 glass">
        <h1 className="text-2xl font-bold mb-1">{t("faq.title")}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("faq.subtitle", { defaultValue: "Pertanyaan umum seputar pemesanan & tur." })}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-3"
      >
        {faqs.map((item, i) => (
          <details key={i} className="card p-4">
            <summary className="font-medium cursor-pointer hover-lift">{item.q}</summary>
            <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </motion.div>
    </div>
  );
}
