// src/pages/FAQ.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import usePageSections from "../hooks/usePageSections";

function Chevron({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className={`transition-transform ${open ? "rotate-180" : ""}`}>
      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function FAQ() {
  const { t } = useTranslation();
  const { sections, loading } = usePageSections("faq");
  const S = Object.fromEntries((sections || []).map((s) => [s.section_key, s]));

  // sumber data
  const itemsFromDB = S.faq_list?.locale?.extra?.items || S.faq_list?.data?.items || [];
  const itemsFromI18n = t("faq.list", { returnObjects: true }) || [];
  const faqs = itemsFromDB.length ? itemsFromDB : itemsFromI18n;

  // search + auto-expand
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q) return faqs;
    const needle = q.toLowerCase();
    return faqs.filter(({ q, a }) => (q + " " + a).toLowerCase().includes(needle));
  }, [faqs, q]);

  // track item yang terbuka
  const [openIdx, setOpenIdx] = useState(null);
  useEffect(() => {
    // saat search, buka item pertama yang cocok
    if (q && filtered.length) setOpenIdx(0);
  }, [q, filtered.length]);

  // pointer glow (untuk liquid border)
  const wrapRef = useRef(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--px", `${e.clientX - r.left}px`);
      el.style.setProperty("--py", `${e.clientY - r.top}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const title = S.hero?.locale?.title || t("faq.title", { defaultValue: "FAQ" });
  const subtitle =
    S.hero?.locale?.body_md ||
    t("faq.subtitle", { defaultValue: "Pertanyaan umum seputar pemesanan & tur." });

  return (
    <div ref={wrapRef} className="container my-6 space-y-6">
      {/* header glassy */}
      <div className="faq-hero glass rounded-3xl p-6 border border-white/20 dark:border-white/10 relative overflow-hidden">
        <div className="relative z-[1]">
          <h1 className="text-3xl font-hero font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">{subtitle}</p>

          {/* search */}
          <div className="mt-4 relative max-w-xl">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("faq.search", { defaultValue: "Cari pertanyaan…" })}
              className="w-full rounded-2xl bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-slate-300/70 dark:border-white/10 px-4 py-3 pl-10 outline-none focus:ring-4 focus:ring-sky-500/20"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70" width="18" height="18" viewBox="0 0 24 24">
              <path d="M21 21l-4.3-4.3M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* subtle blobs (dekor) */}
        <span aria-hidden className="faq-blob" style={{ inset: "auto -10% -40% auto" }} />
        <span aria-hidden className="faq-blob" style={{ inset: "-30% auto auto -10%" }} />
      </div>

      {/* list */}
      {loading ? (
        <div>{t("misc.loading", { defaultValue: "Memuat…" })}</div>
      ) : (
        <div className="grid gap-3 md:gap-4">
          <AnimatePresence initial={false} mode="popLayout">
            {(filtered.length ? filtered : faqs).map((item, i) => {
              const open = openIdx === i;
              return (
                <motion.article
                  key={i}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="faq-card"
                >
                  <button
                    className="faq-summary"
                    aria-expanded={open}
                    onClick={() => setOpenIdx(open ? null : i)}
                  >
                    <span className="faq-q">{item.q}</span>
                    <Chevron open={open} />
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="faq-a">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              );
            })}
          </AnimatePresence>

          {!filtered.length && q && (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {t("faq.noResults", { defaultValue: "Tidak ada hasil untuk pencarianmu." })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
