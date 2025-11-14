// src/pages/Destinasi.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageCircle, ChevronRight } from "lucide-react";
import BlurText from "../components/BlurText"; // Tambah import ini
import usePageSections from "../hooks/usePageSections";
import usePackages from "../hooks/usePackages";

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

// Simple ShimmerButton component (inline definition)
const ShimmerButton = ({ children, className = "", ...props }) => (
  <motion.button
    className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:from-sky-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-all duration-200 ${className}`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    {...props}
  >
    {children}
  </motion.button>
);

export default function Destinasi() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { sections, loading: sectionsLoading } = usePageSections("destinations");
  const { packages, loading: packagesLoading } = usePackages();
  const S = useMemo(() => Object.fromEntries((sections || []).map((s) => [s.section_key, s])), [sections]);

  const [searchQuery, setSearchQuery] = useState("");

  // Filter content sections (exclude hero, cards, and intro/popular destinations)
  const contentSections = useMemo(() => 
    (sections || []).filter(s => !['hero', 'cards', 'intro'].includes(s.section_key)),
    [sections]
  );

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return contentSections;
    const q = searchQuery.toLowerCase();
    return contentSections.filter((s) => {
      const locale = s.locale;
      return (locale?.title?.toLowerCase().includes(q) || locale?.body_md?.toLowerCase().includes(q));
    });
  }, [contentSections, searchQuery]);

  // Ambil cards dari DB jika ada (section_key "cards": extra.items / data.items).
  // Default: 1 kartu Nusa Penida.
  const cards = useMemo(() => {
    const fromDB =
      S.cards?.locale?.extra?.items ||
      S.cards?.data?.items ||
      [];
    if (Array.isArray(fromDB) && fromDB.length) return fromDB;

    return [
      {
        key: "nusa-penida",
        title: t("dest.penidaTitle", { defaultValue: "Nusa Penida" }),
        image: "/23.jpg", // fallback (pakai gambar default yang sudah ada di repo)
        desc: t("dest.penidaDesc", {
          defaultValue: "Pulau dengan pantai dan tebing ikonik di Bali Tenggara.",
        }),
      },
    ];
  }, [S, t]);

  // Filter cards berdasarkan search query
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;
    const q = searchQuery.toLowerCase();
    return cards.filter((c) => 
      c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
    );
  }, [cards, searchQuery]);

  // Prepare packages as cards
  const packageCards = useMemo(() => {
    if (packagesLoading) return [];
    return (packages || []).map((pkg) => ({
      key: pkg.slug,
      title: pkg.locale?.title || pkg.title || `Package ${pkg.id}`,
      image: pkg.default_image || "/23.jpg",
      desc: pkg.locale?.summary || t("explore.title", { defaultValue: "Explore this package" }),
      spots: pkg.locale?.spots || [],
      itinerary: pkg.locale?.itinerary || [],
      include: pkg.locale?.include || [],
    }));
  }, [packages, packagesLoading, t]);

  // Filter packages based on search query
  const filteredPackages = useMemo(() => {
    if (!searchQuery.trim()) return packageCards;
    const q = searchQuery.toLowerCase();
    return packageCards.filter((c) => 
      c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
    );
  }, [packageCards, searchQuery]);

  // Sticky CTA visibility
  const [showCTA, setShowCTA] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowCTA(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const title = S.hero?.locale?.title || t("dest.title", { defaultValue: "Destinations" });
  const subtitle = S.hero?.locale?.body_md || t("dest.heroDesc", { defaultValue: "Explore the beauty of Southeast Bali islands" });
  const heroImage = S.hero?.data?.images?.[0] || "/23.jpg";

  const loading = sectionsLoading || packagesLoading;

  if (loading) {
    return (
      <div className="container mt-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          {t("misc.loading", { defaultValue: "Loading..." })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative h-[60vh] md:h-[70vh] overflow-hidden"
      >
        <img
          src={heroImage}
          alt="Destinations"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/30 to-white/80 dark:to-gray-900/85" />
        <SpotlightOverlay />
        <div className="relative z-10 container h-full flex flex-col justify-center items-center text-center px-6">
          <BlurText
            text={title}
            delay={150}
            animateBy="words"
            direction="top"
            className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-hero, "Cinzel", "EB Garamond", ui-serif, Georgia, serif)' }}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("dest.search", { defaultValue: "Search destinations..." })}
              className="w-full rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 px-12 py-3 text-gray-900 dark:text-white focus:ring-4 focus:ring-sky-500/30 outline-none transition-all"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Destination Cards Section */}
      <section className="container my-12 px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8 font-hero"
        >
          {t("dest.title", { defaultValue: "Destinations" })}
        </motion.h2>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            layout
            className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {filteredCards.length ? (
              filteredCards.map((c, i) => (
                <motion.button
                  key={c.key || i}
                  layout
                  onClick={() => nav(`/explore?dest=${encodeURIComponent(c.key || "nusa-penida")}`)}
                  className="card p-0 overflow-hidden text-left hover-lift focus:outline-none focus:ring-2 focus:ring-sky-400 rounded-2xl group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                    {c.image ? (
                      <motion.img
                        src={c.image}
                        alt={c.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-xl mb-2 text-gray-900 dark:text-white">
                      {c.title}
                    </h3>
                    {c.desc && (
                      <p className="text-base text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                        {c.desc}
                      </p>
                    )}
                    <div className="text-right">
                      <ShimmerButton className="!px-4 !py-2 text-sm">
                        {t("explore.seeDetail", { defaultValue: "Explore" })}
                        <ChevronRight size={16} className="ml-1" />
                      </ShimmerButton>
                    </div>
                  </div>
                </motion.button>
              ))
            ) : (
              <motion.p
                className="col-span-full text-center text-lg text-gray-600 dark:text-gray-300 py-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {t("dest.empty", { defaultValue: "No destinations match your search." })}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Packages Section */}
      {packageCards.length > 0 && (
        <section className="container my-12 px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8 font-hero"
          >
            {t("home.popular", { defaultValue: "Popular Packages" })}
          </motion.h2>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {filteredPackages.length ? (
                filteredPackages.map((c, i) => (
                  <motion.button
                    key={c.key || i}
                    onClick={() => nav(`/explore?pkg=${encodeURIComponent(c.key)}`)}
                    className="card p-0 overflow-hidden text-left hover-lift focus:outline-none focus:ring-2 focus:ring-sky-400 rounded-2xl group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                  >
                    <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                      {c.image ? (
                        <motion.img
                          src={c.image}
                          alt={c.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-xl mb-2 text-gray-900 dark:text-white">
                        {c.title}
                      </h3>
                      {c.desc && (
                        <p className="text-base text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                          {c.desc}
                        </p>
                      )}
                      <div className="text-right">
                        <ShimmerButton className="!px-4 !py-2 text-sm">
                          {t("explore.seeDetail", { defaultValue: "Explore" })}
                          <ChevronRight size={16} className="ml-1" />
                        </ShimmerButton>
                      </div>
                    </div>
                  </motion.button>
                ))
              ) : (
                <motion.p
                  className="col-span-full text-center text-lg text-gray-600 dark:text-gray-300 py-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {t("dest.empty", { defaultValue: "No packages match your search." })}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      )}

      {/* Content Sections (excluding popular destinations) */}
      {filteredSections.length > 0 && (
        <section className="container my-12 px-6">
          <div className="grid gap-4 max-w-4xl mx-auto">
            <AnimatePresence initial={false} mode="popLayout">
              {filteredSections.map((s, i) => (
                <motion.article
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.05 }}
                  className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    {s.locale?.title && (
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 font-hero">
                        {s.locale.title}
                      </h3>
                    )}
                    {s.locale?.body_md && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {s.locale.body_md}
                      </p>
                    )}
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
            {!filteredSections.length && searchQuery && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6 col-span-full">
                {t("dest.empty", { defaultValue: "No content matches your search." })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Sticky WhatsApp CTA */}
      <AnimatePresence>
        {showCTA && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <a
              href="https://wa.me/62895630193926"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-sky-600 text-white rounded-full px-6 py-3 shadow-lg hover:bg-sky-700 transition-colors"
            >
              <MessageCircle size={20} />
              {t("home.helpCTA", { defaultValue: "Need help? Chat WhatsApp" })}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}