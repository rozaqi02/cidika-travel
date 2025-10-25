import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Calendar, Users, BadgeCheck,
  MessageCircle, Star, ChevronRight,
  Search, Phone, Send,
} from "lucide-react";
import usePackages from "../hooks/usePackages";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";
import usePageSections from "../hooks/usePageSections";
import { supabase } from "../lib/supabaseClient";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const FALLBACK_HERO_IMAGES = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg", "/hero4.jpg", "/hero5.jpg", "/hero6.jpg"];

function usePreload(images) {
  useEffect(() => {
    images?.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!m) return;
    setReduced(!!m.matches);
    const c = () => setReduced(!!m.matches);
    m.addEventListener?.("change", c);
    return () => m.removeEventListener?.("change", c);
  }, []);
  return reduced;
}

function normalizeUrl(raw) {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function getPkgImage(p) {
  const raw = p?.default_image || p?.cover_url || p?.thumbnail || p?.thumb_url || p?.image_url ||
    (Array.isArray(p?.images) && p.images[0]) || (p?.data?.images && p.data.images[0]) || "";
  const url = normalizeUrl(raw);
  return url || "/23.jpg";
}

const reveal = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };

function SpotlightOverlay({ className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      el.style.setProperty("--spot-x", `${x}px`);
      el.style.setProperty("--spot-y", `${y}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background: "radial-gradient(600px circle at var(--spot-x,50%) var(--spot-y,50%), rgba(56,189,248,.3), transparent 50%)",
        mixBlendMode: "screen",
      }}
    />
  );
}

function ShimmerButton({ as: Comp = "a", className = "", children, ...props }) {
  return (
    <Comp {...props} className={`relative overflow-hidden group btn btn-outline glass ${className}`}>
      <span className="relative z-10">{children}</span>
      <motion.span
        aria-hidden
        initial={{ x: "-120%" }}
        animate={{ x: "120%" }}
        transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
        className="absolute inset-y-0 -left-1 w-40 rotate-12 opacity-40"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,.7), transparent)" }}
      />
    </Comp>
  );
}

function Marquee({ speed = 24, className = "", children }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="flex gap-2 will-change-transform"
        initial={{ x: 0 }}
        animate={{ x: "-50%" }}
        transition={{ repeat: Infinity, ease: "linear", duration: speed }}
      >
        <div className="flex gap-2">{children}</div>
        <div className="flex gap-2" aria-hidden>{children}</div>
      </motion.div>
    </div>
  );
}

function Hero({ images = [], subtitle, title, desc, chips = [], onSearch, ctaContactLabel }) {
  const reduced = usePrefersReducedMotion();
  const [idx, setIdx] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  usePreload(images);
  useEffect(() => {
    setIsLoaded(true);
    if (reduced || images.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % images.length), 5200);
    return () => clearInterval(id);
  }, [reduced, images.length]);

  const textContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const lineVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section className="relative h-[80vh] md:h-[90vh] overflow-hidden rounded-2xl shadow-lg">
      <AnimatePresence>
        {images.map((raw, i) => {
          const src = normalizeUrl(raw);
          return (
            <motion.img
              key={src || i}
              src={src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.05 }}
              transition={{ opacity: { duration: 1.2 }, scale: { duration: 1.2 } }}
              loading={i === 0 ? "eager" : "lazy"}
              fetchpriority={i === 0 ? "high" : "auto"}
            />
          );
        })}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/20 to-white/80 dark:to-gray-900/85" />
      <SpotlightOverlay />

      <motion.div
        className="relative z-10 container h-full flex flex-col justify-center items-center text-center px-6"
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        variants={textContainerVariants}
      >
        {subtitle && (
          <motion.p variants={lineVariants} className="tracking-widest text-sm md:text-base text-white/90 mb-4 font-medium">
            {subtitle}
          </motion.p>
        )}
        {title && (
          <motion.h1
            variants={lineVariants}
            className="text-4xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-lg"
            style={{ fontFamily: 'var(--font-hero, "Cinzel", "EB Garamond", ui-serif, Georgia, serif)' }}
          >
            {title}
          </motion.h1>
        )}
        {desc && (
          <motion.p variants={lineVariants} className="mt-4 max-w-3xl text-base md:text-lg text-white/90 leading-relaxed">
            {desc}
          </motion.p>
        )}
        {ctaContactLabel && (
          <motion.div variants={lineVariants} className="mt-8">
            <ShimmerButton as="a" href="#popular" className="!px-10 !py-3 text-lg font-semibold">
              {ctaContactLabel}
            </ShimmerButton>
          </motion.div>
        )}
        {!!chips?.length && (
          <motion.div variants={stagger} className="mt-10 w-full max-w-4xl">
            <Marquee speed={20}>
              {chips.map((c, i) => (
                <motion.button
                  key={i}
                  onClick={() => onSearch?.(c.q)}
                  className="btn glass !py-2 !px-4 text-sm flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Search size={14} className="mr-1" />
                  <span>{c.label}</span>
                </motion.button>
              ))}
            </Marquee>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}

function FeatureCard({ iconName, title, text }) {
  const Icon = { "badge-check": BadgeCheck, "users": Users, "calendar": Calendar, "map-pin": MapPin }[iconName] || BadgeCheck;
  return (
    <div className="card p-5 bg-white dark:bg-gray-900 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200/60 dark:border-gray-700/60">
      <div className="flex items-start gap-3">
        <div className="shrink-0 p-2 rounded-lg bg-sky-100 dark:bg-sky-900/50">
          <Icon className="text-sky-600 dark:text-sky-400" size={20} />
        </div>
        <div>
          <div className="font-semibold text-lg text-gray-900 dark:text-white">{title}</div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{text}</p>
        </div>
      </div>
    </div>
  );
}

function WhyUs({ title, subtitle, items = [] }) {
  return (
    <section className="container mt-20">
      {(title || subtitle) && (
        <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}>
          {title && <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h2>}
          {subtitle && <p className="text-gray-600 dark:text-gray-300 mt-2">{subtitle}</p>}
        </motion.div>
      )}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {items.map((it, i) => (
          <motion.div key={i} variants={reveal}>
            <FeatureCard iconName={it.icon || "badge-check"} title={it.title} text={it.text} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function Stats({ trips = 0, photos = 0, rating = 4.9 }) {
  const { t } = useTranslation();
  const [start, setStart] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach(e => e.isIntersecting && setStart(true)),
      { threshold: 0.4 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  const tv = useCountUp({ to: trips, duration: 1200, start });
  const pv = useCountUp({ to: photos, duration: 1400, start });
  const rv = useCountUp({ to: Math.round(rating * 10), duration: 900, start });
  return (
    <section ref={ref} className="container mt-20">
      <div className="card p-6 md:p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-4xl font-extrabold text-gray-900 dark:text-white">{tv.toLocaleString()}+</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t("home.stats.travelers", { defaultValue: "Traveler puas" })}</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-gray-900 dark:text-white">{pv.toLocaleString()}+</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t("home.stats.media", { defaultValue: "Foto & video" })}</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-center justify-center">
              {(rv / 10).toFixed(1)} <Star size={20} className="ml-1 text-amber-500" />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t("home.stats.rating", { defaultValue: "Rating" })}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PopularCard({ pkg, price, pax, currency, fx, locale, audience }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const cover = getPkgImage(pkg);
  const title = pkg?.locale?.title || pkg.slug || "Open Trip";
  const spots = (pkg?.locale?.spots || []).slice(0, 4).join(" • ");
  const priceLabel = formatMoneyFromIDR(price, currency, fx, locale);
  return (
    <div className="card bg-white dark:bg-gray-900 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200/60 dark:border-gray-700/60">
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-xl">
        <img
          src={cover}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-900/70 to-transparent" />
        <div className="absolute left-4 bottom-4 right-4 text-white">
          <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
          <p className="text-sm opacity-90 line-clamp-1">{spots}</p>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sky-600 dark:text-sky-400 font-extrabold text-xl">
            {priceLabel} <span className="text-sm font-normal text-gray-600 dark:text-gray-400">/ {t("home.perPax", { defaultValue: "pax" })}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Calendar size={16} /> {t("home.flexible", { defaultValue: "Flexible" })}
          </div>
        </div>
        <div className="mt-3">
  <button
    className="btn btn-primary glass w-full !py-2.5"
    onClick={() => navigate(`/packages/${pkg.id}`, { state: { pax, audience } })}
  >
    {t("home.viewDetails", { defaultValue: "Lihat Detail Paket" })} <ChevronRight size={16} className="ml-1" />
  </button>
</div>

      </div>
    </div>
  );
}

function PopularPackages({ heading, subheading, data, currency, fx, locale }) {
  const { t } = useTranslation();
  const pax = 6; // dikunci ke 6 pax
  const [audience, setAudience] = useState("domestic");
  const [popularPackages, setPopularPackages] = useState([]);

  useEffect(() => {
  // Target tetap 6 pax sesuai requirement
  const TARGET_PAX = 6;

  // Hitung harga untuk 6 pax per-audience.
  // Jika tidak ada tier pax=6, fallback: ambil harga per-orang termurah lalu kali 6.
  const priceFor6Pax = (pkg) => {
    const tiers = Array.isArray(pkg.price_tiers)
      ? pkg.price_tiers.filter(t => String(t.audience || "domestic") === audience)
      : [];

    const exact = tiers.find(t => Number(t.pax) === TARGET_PAX);
    if (exact) return Number(exact.price_idr);

    const perPersonList = tiers
      .map(t => Number(t.price_idr) / Number(t.pax))
      .filter(n => Number.isFinite(n) && n > 0);

    if (!perPersonList.length) return Infinity;

    const minPerPerson = Math.min(...perPersonList);
    return Math.round(minPerPerson * TARGET_PAX);
  };

  const cheapest = (data || [])
    .map(p => ({ p, price: priceFor6Pax(p) }))
    .filter(x => Number.isFinite(x.price))
    .sort((a, b) => a.price - b.price)
    .slice(0, 3);

  setPopularPackages(cheapest);
}, [data, audience]); // ⬅️ tidak tergantung 'pax' lagi

  return (
    <section id="popular" className="container mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{heading || t("home.popular", { defaultValue: "Paket Populer" })}</h2>
          {subheading && <p className="text-gray-600 dark:text-gray-300 mt-2">{subheading}</p>}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-2">
            {["domestic", "foreign"].map((k) => (
              <button
                key={k}
                onClick={() => setAudience(k)}
                className={`btn ${audience === k ? "btn-primary" : "btn-outline"} !py-1.5 !px-3 text-sm`}
              >
                {k === "domestic" ? t("explore.domestic", { defaultValue: "Domestik" }) : "Foreign"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
  <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
    {t("home.calcFor", { defaultValue: "Harga untuk" })}
  </span>
  <span className="px-3 py-2 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/60 dark:bg-gray-900/60 text-sm">
    6 {t("home.pax", { defaultValue: "pax" })}
  </span>
</div>

        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {popularPackages.length ? (
          popularPackages.map(({ p, price }) => (
            <PopularCard key={p.id} pkg={p} price={price} pax={pax} currency={currency} fx={fx} locale={locale} audience={audience} />
          ))
        ) : (
          <p className="text-gray-600 dark:text-gray-300 col-span-3 text-center">{t("home.noPackages", { defaultValue: "No popular packages available." })}</p>
        )}
      </div>
      <div className="mt-8 text-right">
        <Link to="/explore" className="inline-flex items-center gap-2 text-sky-600 dark:text-sky-400 hover:underline text-lg">
          {t("home.viewAllPackages", { defaultValue: "Lihat semua paket" })} <ChevronRight size={18} />
        </Link>
      </div>
    </section>
  );
}

function TestimonialCard({ item, lang }) {
  const getStars = (n) => {
    const s = Math.max(1, Math.min(5, Number(n || 5)));
    return Array.from({ length: s }, (_, i) => <Star key={i} size={16} className="text-amber-500 fill-amber-500" />);
  };
  return (
    <div className="card p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        {getStars(item.stars)}
      </div>
      <p className="text-gray-700 dark:text-gray-200 flex-grow mb-4 text-sm leading-relaxed">{item.text}</p>
      {lang !== item.lang && (
        <a
          href={`https://translate.google.com/?sl=${item.lang}&tl=${lang}&text=${encodeURIComponent(item.text)}&op=translate`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-sky-600 dark:text-sky-400 hover:underline mb-2"
        >
          Translate to {lang.toUpperCase()}
        </a>
      )}
      <footer className="text-sm text-gray-500 dark:text-gray-400 mt-auto">
        — {item.name}{item.city ? `, ${item.city}` : ""}
      </footer>
    </div>
  );
}

function TestimonialForm({ onSubmit }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [text, setText] = useState("");
  const [stars, setStars] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !text) {
      alert("Please fill in your name and testimonial.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ name, city, text, stars, lang: t("i18n.language", { defaultValue: "id" }) });
      setName("");
      setCity("");
      setText("");
      setStars(5);
      alert(t("home.testimonialSubmitted", { defaultValue: "Testimonial submitted successfully! Thank you for your feedback." }));
    } catch (error) {
      alert(t("home.testimonialError", { defaultValue: "Error submitting testimonial. Please try again." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-sky-50 to-white/50 dark:from-slate-900 dark:to-slate-800/50 shadow-lg border border-slate-200/60 dark:border-slate-700/60">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("home.submitTestimonial", { defaultValue: "Share Your Experience" })}
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          How was your trip with us? We'd love to hear your feedback!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("home.name", { defaultValue: "Name" })}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-xl border-slate-300/70 dark:border-slate-700 bg-white/60 dark:bg-slate-950/60 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
              placeholder={t("home.namePlaceholder", { defaultValue: "Your name" })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("home.city", { defaultValue: "City" })}</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border-slate-300/70 dark:border-slate-700 bg-white/60 dark:bg-slate-950/60 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
              placeholder={t("home.cityPlaceholder", { defaultValue: "Your city (optional)" })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("home.rating", { defaultValue: "Rating" })}</label>
          <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
            {Array.from({ length: 5 }).map((_, i) => {
              const ratingValue = i + 1;
              const color = ratingValue <= (hoverRating || stars) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600";
              return (
                <motion.button
                  type="button"
                  key={ratingValue}
                  onClick={() => setStars(ratingValue)}
                  onMouseEnter={() => setHoverRating(ratingValue)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 cursor-pointer"
                >
                  <Star size={24} className={`transition-colors ${color}`} />
                </motion.button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("home.testimonial", { defaultValue: "Testimonial" })}</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-xl border-slate-300/70 dark:border-slate-700 bg-white/60 dark:bg-slate-950/60 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
            rows={4}
            placeholder={t("home.testimonialPlaceholder", { defaultValue: "Share your amazing experience..." })}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary glass w-full !py-3 !text-base !font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg"
        >
          {isSubmitting ? t("home.submitting", { defaultValue: "Submitting..." }) : t("home.submit", { defaultValue: "Submit My Review" })}
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

function Testimonials({ title, allItems = [] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.slice(0, 2);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => setCurrentIndex(i => (i - 1 + allItems.length) % allItems.length);
  const handleNext = () => setCurrentIndex(i => (i + 1) % allItems.length);

  const handleTestimonialSubmit = async (testimonial) => {
    const { error } = await supabase
      .from("testimonials")
      .insert([{ ...testimonial, is_approved: false }]);
    if (error) throw error;
  };

  if (!allItems.length) return null;

  return (
    <section className="container mt-20">
      {title && (
        <motion.h2
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-8"
        >
          {title}
        </motion.h2>
      )}
      
      {/* Wrapper untuk Slider Testimoni */}
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
          >
            <TestimonialCard item={allItems[currentIndex]} lang={lang} />
          </motion.div>
          <div className="flex justify-between mt-4">
            <button onClick={handlePrev} className="btn btn-outline glass !px-3 !py-1.5">
              <ChevronRight size={16} className="rotate-180" />
            </button>
            <button onClick={handleNext} className="btn btn-outline glass !px-3 !py-1.5">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Wrapper untuk Form Testimoni */}
      <div className="max-w-3xl mx-auto mt-12">
        <TestimonialForm onSubmit={handleTestimonialSubmit} />
      </div>
    </section>
  );
}


function HowItWorks({ title, subtitle, steps = [] }) {
  const { t } = useTranslation();
  const fallback = [
    { icon: "search", title: t("home.whyItems.0.title", { defaultValue: "Pilih Paket" }), text: t("home.whyItems.0.text", { defaultValue: "Bandingkan & sesuaikan pax." }) },
    { icon: "message", title: t("home.whyItems.1.title", { defaultValue: "Chat Admin" }), text: t("home.whyItems.1.text", { defaultValue: "Klik WhatsApp, kami balas cepat." }) },
    { icon: "calendar", title: t("home.whyItems.2.title", { defaultValue: "Atur Jadwal" }), text: t("home.whyItems.2.text", { defaultValue: "Tentukan tanggal & meeting point." }) },
    { icon: "badge-check", title: t("home.whyItems.3.title", { defaultValue: "Berangkat!" }), text: t("home.whyItems.3.text", { defaultValue: "Nikmati trip." }) },
  ];
  const list = steps.length ? steps : fallback;
  return (
    <section className="container mt-20">
      {(title || subtitle) && (
        <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}>
          {title && <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h2>}
          {subtitle && <p className="text-gray-600 dark:text-gray-300 mt-2">{subtitle}</p>}
        </motion.div>
      )}
      <div className="mt-8 card p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
        <ol className="relative border-l-2 border-sky-200 dark:border-sky-800 space-y-6">
          {list.map((s, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="relative pl-8"
            >
              <span className="absolute left-[1px] top-1.5 w-4 h-4 rounded-full bg-sky-500 ring-4 ring-white dark:ring-gray-900 -translate-x-1/2" />
              <div className="font-semibold text-lg text-gray-900 dark:text-white">{s.title}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{s.text}</div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function BigCTA({ title, desc, whatsapp = "+6289523949667" }) {
  const { t } = useTranslation();
  return (
    <section className="container mt-20 mb-24">
      <div className="relative card p-6 md:p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-sky-100/50 to-indigo-100/50 dark:from-sky-900/50 dark:to-indigo-900/50" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            {title && <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h3>}
            {desc && <p className="text-gray-600 dark:text-gray-300 mt-2">{desc}</p>}
          </div>
          <div className="flex gap-4">
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              className="btn btn-primary glass py-2.5 px-6"
              target="_blank"
              rel="noreferrer"
            >
              <Phone size={16} className="mr-1" /> WhatsApp
            </a>
            <Link to="/explore" className="btn btn-outline glass py-2.5 px-6">
              {t("home.viewAllPackages", { defaultValue: "Lihat Semua Paket" })}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function StickyHelpCTA() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow((window.scrollY || 0) > 520);
    window.addEventListener("scroll", on, { passive: true });
    on();
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="fixed bottom-4 inset-x-0 z-30"
        >
          <div className="container">
            <a
              href="https://wa.me/6289523949667"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto btn btn-primary glass flex items-center gap-2 shadow-lg rounded-xl px-6 py-2.5"
            >
              <MessageCircle size={16} /> {t("home.helpCTA", { defaultValue: "Butuh bantuan? Chat WhatsApp" })}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function useCountUp({ from = 0, to = 100, duration = 1200, start = false }) {
  const [v, setV] = useState(from);
  const r = useRef();
  useEffect(() => {
    if (!start) return;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setV(Math.round(from + (to - from) * p));
      if (p < 1) r.current = requestAnimationFrame(step);
    };
    r.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(r.current);
  }, [from, to, duration, start]);
  return v;
}

export default function Home() {
  const { rows: packages = [] } = usePackages();
  const { fx, currency, locale } = useCurrency();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { sections } = usePageSections("home");
  const S = useMemo(() => Object.fromEntries((sections || []).map(s => [s.section_key, s])), [sections]);

  const onQuickSearch = (q) => navigate(`/explore?tag=${encodeURIComponent(q)}`);

  const heroImages = Array.isArray(S.hero?.data?.images) && S.hero.data.images.length
    ? S.hero.data.images
    : FALLBACK_HERO_IMAGES;
  const heroTitle = S.hero?.locale?.body_md || "";
  const heroDesc = S.hero?.locale?.extra?.desc || "";
  const heroSub = S.hero?.locale?.title || "";
  const heroCTA = S.hero?.locale?.extra?.cta_contact_label || "";
  const heroChips = Array.isArray(S.hero?.data?.chips) ? S.hero.data.chips : [];

  const [allTestimonials, setAllTestimonials] = useState([]);
  useEffect(() => {
    const fetchAllTestimonials = async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_approved", true);

      if (error) {
        console.error("Error fetching testimonials:", error);
        return;
      }

      setAllTestimonials(data);
    };

    fetchAllTestimonials();
  }, []);

  return (
    <>
      <Hero
        images={heroImages}
        subtitle={heroSub}
        title={heroTitle}
        desc={heroDesc}
        chips={heroChips}
        onSearch={onQuickSearch}
        ctaContactLabel={heroCTA}
      />
      <WhyUs
        title={S.whyus?.locale?.title || t("home.whyTitle", { defaultValue: "Kenapa pilih kami?" })}
        subtitle={S.whyus?.locale?.body_md || t("home.whySubtitle", { defaultValue: "Keunggulan yang bikin trip kamu lebih tenang." })}
        items={S.whyus?.locale?.extra?.items || [
          { icon: "badge-check", title: t("home.whyItems.0.title", { defaultValue: "Operator Resmi & Berpengalaman" }), text: t("home.whyItems.0.text", { defaultValue: "Tim lokal paham spot & timing terbaik." }) },
          { icon: "users", title: t("home.whyItems.1.title", { defaultValue: "Cocok untuk Semua" }), text: t("home.whyItems.1.text", { defaultValue: "Solo, couple, family, rombongan kantor." }) },
          { icon: "calendar", title: t("home.whyItems.2.title", { defaultValue: "Jadwal Fleksibel" }), text: t("home.whyItems.2.text", { defaultValue: "Private charter / open trip." }) },
          { icon: "map-pin", title: t("home.whyItems.3.title", { defaultValue: "Itinerary Optimal" }), text: t("home.whyItems.3.text", { defaultValue: "Efisien, tetap dapat momen terbaik." }) },
        ]}
      />
      <Stats
        trips={Number(S.stats?.data?.trips) || 400}
        photos={Number(S.stats?.data?.photos) || 1300}
        rating={Number(S.stats?.data?.rating) || 4.9}
      />
      <PopularPackages
        heading={S.popular?.locale?.title || t("home.popular", { defaultValue: "Paket Populer" })}
        subheading={S.popular?.locale?.body_md || t("home.popularSub", { defaultValue: "Pilihan terbaik wisatawan." })}
        data={packages}
        currency={currency}
        fx={fx}
        locale={locale}
      />
      <HowItWorks
        title={S.how?.locale?.title || t("home.howTitle", { defaultValue: "Cara Kerja" })}
        subtitle={S.how?.locale?.body_md || t("home.howSubtitle", { defaultValue: "Simple dan cepat tanpa login." })}
        steps={S.how?.locale?.extra?.steps || []}
      />
      <Testimonials
        title={S.testimonials?.locale?.title || t("home.testimonialsTitle", { defaultValue: "Kata Mereka" })}
        allItems={allTestimonials}
      />
      <BigCTA
        title={S.cta?.locale?.title || t("home.ctaTitle", { defaultValue: "Siap Berpetualang di Nusa Penida?" })}
        desc={S.cta?.locale?.body_md || t("home.ctaDesc", { defaultValue: "Hubungi kami via WhatsApp/Instagram/Email. Tim akan bantu atur itinerary terbaik sesuai waktu & budget." })}
        whatsapp={S.cta?.data?.whatsapp || "+6289523949667"}
      />
      <StickyHelpCTA />
    </>
  );
}