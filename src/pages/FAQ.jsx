// src/pages/FAQ.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import usePageSections from "../hooks/usePageSections";

export default function FAQ() {
  const { t } = useTranslation();
  const { sections, loading } = usePageSections("faq");
  const S = Object.fromEntries((sections||[]).map(s=>[s.section_key,s]));

  // Ambil dari DB (locale.extra.items → data.items → i18n list)
  const itemsFromDB =
    S.faq_list?.locale?.extra?.items ||
    S.faq_list?.data?.items ||
    [];
  const itemsFromI18n = t("faq.list", { returnObjects: true }) || [];
  const faqs = itemsFromDB.length ? itemsFromDB : itemsFromI18n;

  return (
    <div className="container mt-4 space-y-4">
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md p-4 glass">
        <h1 className="text-2xl font-bold mb-1">{S.hero?.locale?.title || t("faq.title")}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {S.hero?.locale?.body_md || t("faq.subtitle", { defaultValue: "Pertanyaan umum seputar pemesanan & tur." })}
        </p>
      </div>

      {loading ? <div>{t("misc.loading")}</div> : (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.25}} className="space-y-3">
          {faqs.map((item,i)=>(
            <details key={i} className="card p-4">
              <summary className="font-medium cursor-pointer hover-lift">{item.q}</summary>
              <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </motion.div>
      )}
    </div>
  );
}
