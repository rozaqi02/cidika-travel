import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, MessageCircle, Calendar, CreditCard, MapPin, HelpCircle } from "lucide-react";
import BlurText from "../components/BlurText"; // Tambah import ini
import OptimizedImage from "../components/OptimizedImage";
import { FaqListSkeleton } from "../components/Skeleton";
import usePageSections from "../hooks/usePageSections";

function Chevron({ open }) {
  return (
    <motion.div
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex items-center justify-center"
    >
      <ChevronDown size={20} className="text-sky-600 dark:text-sky-400" />
    </motion.div>
  );
}

function SpotlightOverlay({ className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
      el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background: "radial-gradient(600px circle at var(--spot-x,50%) var(--spot-y,50%), rgba(56,189,248,.25), transparent 50%)",
        mixBlendMode: "screen",
      }}
    />
  );
}

const FAQ_ICONS = [Calendar, CreditCard, MapPin, HelpCircle];

export default function FAQ() {
  const { t } = useTranslation();
  const { sections, loading } = usePageSections("faq");
  const S = useMemo(() => Object.fromEntries((sections || []).map((s) => [s.section_key, s])), [sections]);

  // Sumber data
  const itemsFromDB = S.faq_list?.locale?.extra?.items || S.faq_list?.data?.items || [];
  const itemsFromI18n = t("faq.list", { returnObjects: true }) || [];
  const faqs = itemsFromDB.length ? itemsFromDB : itemsFromI18n;

  // Search + auto-expand
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q) return faqs;
    const needle = q.toLowerCase();
    return faqs.filter(({ q: question, a }) => (question + " " + a).toLowerCase().includes(needle));
  }, [faqs, q]);

  // Track item yang terbuka
  const [openIdx, setOpenIdx] = useState(null);
  useEffect(() => {
    if (q && filtered.length) setOpenIdx(0);
    else setOpenIdx(null);
  }, [q, filtered.length]);

  // Sticky CTA visibility
  const [showCTA, setShowCTA] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowCTA(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const title = S.hero?.locale?.title || t("faq.title", { defaultValue: "FAQ" });
  const subtitle =
    S.hero?.locale?.body_md ||
    t("faq.subtitle", { defaultValue: "Pertanyaan umum seputar pemesanan & tur." });

  return (
    <div className="relative min-h-screen">
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative h-[60vh] md:h-[70vh] overflow-hidden"
      >
        <OptimizedImage
          src={S.hero?.data?.images?.[0] || "/hero2.jpg"}
          alt="Nusa Penida"
          preset="detail"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 hero-tropical-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-transparent to-slate-50/90 dark:to-slate-950/90" />
        <SpotlightOverlay />
        <div className="relative z-10 container h-full flex flex-col justify-center items-center text-center px-6">
          <BlurText
            text={title}
            delay={150}
            animateBy="words"
            direction="top"
            className="home-hero-title text-white text-[clamp(34px,8vw,72px)] text-center w-full px-2 sm:px-0 mb-4"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="mt-4 max-w-2xl text-lg text-white/90"
          >
            {subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className="mt-8 w-full max-w-md relative"
          >
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("faq.search", { defaultValue: "Cari pertanyaan…" })}
              className="w-full rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 px-12 py-3 text-gray-900 dark:text-white focus:ring-4 focus:ring-sky-500/30 outline-none transition-all"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* FAQ List */}
      <section className="container my-12 px-6">
        {loading ? (
          <FaqListSkeleton count={6} />
        ) : (
          <div className="grid gap-4 max-w-4xl mx-auto">
            <AnimatePresence initial={false} mode="popLayout">
              {(filtered.length ? filtered : faqs).map((item, i) => {
                const open = openIdx === i;
                return (
                  <motion.article
                    key={i}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <button
                      className="flex w-full items-center justify-between gap-3 p-5 text-left"
                      aria-expanded={open}
                      onClick={() => setOpenIdx(open ? null : i)}
                    >
                      <span className="flex items-start gap-3 pr-2">
                        {(() => {
                          const Icon = FAQ_ICONS[i % FAQ_ICONS.length];
                          return (
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
                              <Icon size={18} />
                            </span>
                          );
                        })()}
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {item.q}
                        </span>
                      </span>
                      <Chevron open={open} />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          key="panel"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
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
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                {t("faq.noResults", { defaultValue: "Tidak ada hasil untuk pencarianmu." })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Sticky WhatsApp CTA */}
      <AnimatePresence>
        {showCTA && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-30 hidden lg:block"
          >
            <a
              href="https://wa.me/62895630193926"
              target="_blank"
              rel="noreferrer"
              className="btn btn-wa flex items-center gap-2 rounded-full px-6 py-3 shadow-lg"
            >
              <MessageCircle size={20} />
              {t("home.helpCTA", { defaultValue: "Butuh bantuan? Chat WhatsApp" })}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
