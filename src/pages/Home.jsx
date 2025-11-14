import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Calendar, Users, BadgeCheck,
  MessageCircle, Star, ChevronRight,
  Search, Phone, Send, Quote,
} from "lucide-react";
import BlurText from "../components/BlurText"; // Tambah import ini
import usePackages from "../hooks/usePackages";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";
import usePageSections from "../hooks/usePageSections";
import { supabase } from "../lib/supabaseClient";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const FALLBACK_HERO_IMAGES = ["/hero2.jpg", "/hero1.jpg", "/hero3.jpg", "/hero4.jpg", "/hero5.jpg", "/hero6.jpg"];

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
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }; // Lambatkan stagger

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
        background: "radial-gradient(600px circle at var(--spot-x,50%) var(--spot-y,50%), rgba(56,189,248,.2), transparent 50%)", // Soft-er
        mixBlendMode: "screen",
      }}
    />
  );
}

function ShimmerButton({ as: Comp = "a", className = "", children, ...props }) {
  return (
    <Comp {...props} className={`relative overflow-hidden group btn btn-outline glass ${className}`} aria-label="Klik untuk aksi">
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

function Marquee({ speed = 25, className = "", children }) { // Speed lebih lambat
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
  const parallaxRef = useRef(null); // Tambah ref untuk parallax

  usePreload(images);
  useEffect(() => {
    setIsLoaded(true);
    if (reduced || images.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % images.length), 5200);
    return () => clearInterval(id);
  }, [reduced, images.length]);

  // Tambah efek parallax
  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        const scrolled = window.pageYOffset;
        parallaxRef.current.style.transform = `translateY(${scrolled * 0.5}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <motion.section // Ubah ke motion.section dan tambah fade in
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="relative h-[70vh] md:h-[90vh] overflow-hidden rounded-2xl shadow-lg parallax-container"
    >
      <div ref={parallaxRef} className="parallax-bg"> {/* Tambah div parallax-bg */}
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
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/20 to-white/80 dark:to-gray-900/85" />
      <SpotlightOverlay />

      <motion.div
        className="relative z-10 container h-full flex flex-col justify-center items-center text-center px-4 md:px-6"
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        variants={textContainerVariants}
      >
        {subtitle && (
          <motion.p variants={lineVariants} className="tracking-widest text-xs md:text-sm text-white/90 mb-3 font-medium uppercase"> {/* Tambah uppercase */}
            {subtitle}
          </motion.p>
        )}
        {title && (
          <BlurText // Ganti motion.h1 dengan BlurText
            text={title}
            delay={150}
            animateBy="words"
            direction="top"
            className="
              font-hero font-extrabold text-white leading-tight drop-shadow-lg
              text-[clamp(28px,6vw,56px)] tracking-tight mb-4
              [&_*]:text-[1em] [&_*]:font-inherit [&_*]:leading-inherit [&_*]:tracking-inherit
            "
            style={{ fontFamily: 'var(--font-hero, "Cinzel", "EB Garamond", ui-serif, Georgia, serif)' }}
          />
        )}
        {desc && (
          <motion.p variants={lineVariants} className="mt-3 max-w-3xl text-sm md:text-base text-white/90 leading-relaxed">
            {desc}
          </motion.p>
        )}
        {ctaContactLabel && (
          <motion.div variants={lineVariants} className="mt-6">
            <ShimmerButton as="a" href="#popular" className="!px-8 !py-2.5 text-base font-semibold btn-primary glow-hover"> {/* Ubah ke primary + glow-hover */}
              {ctaContactLabel}
            </ShimmerButton>
          </motion.div>
        )}
        {!!chips?.length && (
          <motion.div variants={stagger} className="mt-8 w-full max-w-4xl">
            <Marquee speed={20}> {/* Ubah speed ke 20 */}
              {chips.map((c, i) => (
                <motion.button
                  key={i}
                  onClick={() => onSearch?.(c.q)}
                  className="btn glass !py-1.5 !px-3 text-xs flex items-center gap-1.5 badge-glow" // Tambah badge-glow
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  aria-label={`Cari ${c.label}`}
                >
                  <Search size={12} className="mr-1" />
                  <span>{c.label}</span>
                </motion.button>
              ))}
            </Marquee>
          </motion.div>
        )}
      </motion.div>
    </motion.section>
  );
}

function FeatureCard({ iconName, title, text }) {
  const Icon = { "badge-check": BadgeCheck, "users": Users, "calendar": Calendar, "map-pin": MapPin }[iconName] || BadgeCheck;
  return (
    <motion.div
      className="card p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/60 dark:border-gray-700/60 overflow-hidden" // Tambah overflow-hidden
      whileHover={{ y: -4 }} // Lift effect
    >
      <div className="flex items-start gap-2.5"> {/* Gap lebih kecil */}
        <motion.div className="shrink-0 p-2 rounded-lg bg-sky-100 dark:bg-sky-900/50" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <Icon className="text-sky-600 dark:text-sky-400" size={18} /> {/* Kecilkan icon */}
        </motion.div>
        <div>
          <div className="font-semibold text-base md:text-lg text-gray-900 dark:text-white leading-tight"> {/* Kecilkan */}
            {title}
          </div>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed"> {/* Kecilkan */}
            {text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function WhyUs({ title, subtitle, items = [] }) {
  return (
    <section className="container mt-16 md:mt-20"> {/* Kurangi mt */}
      {(title || subtitle) && (
        <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}>
          {title && <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2"> {/* Kecilkan */}
            {title}
          </h2>}
          {subtitle && <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base"> {/* Kecilkan */}
            {subtitle}
          </p>}
        </motion.div>
      )}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" // Gap lebih rapat di mobile
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

  const statsData = [
    { num: tv.toLocaleString() + "+", label: t("home.stats.travelers", { defaultValue: "Traveler puas" }), icon: Users },
    { num: pv.toLocaleString() + "+", label: t("home.stats.media", { defaultValue: "Foto & video" }), icon: Star },
    { num: (rv / 10).toFixed(1), label: t("home.stats.rating", { defaultValue: "Rating" }), icon: BadgeCheck },
  ];

  return (
    <section ref={ref} className="container mt-16 md:mt-20">
      <div className="card p-5 md:p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden relative"> {/* Tambah grain */}
        <div className="grain" /> {/* Efek grain subtle */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 text-center">
          {statsData.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={start ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-center gap-2">
                <stat.icon className="stat-icon text-sky-500" size={20} /> {/* Icon baru */}
                <div className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white"> {/* Kecilkan */}
                  {stat.num}
                </div>
              </div>
              <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400"> {/* Kecilkan */}
                {stat.label}
              </div>
            </motion.div>
          ))}
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
    <motion.div
      className="card bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/60 dark:border-gray-700/60 overflow-hidden relative"
      whileHover={{ scale: 1.02 }} // Soft scale
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl">
        <img
          src={cover}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-sky-500 text-white px-2 py-1 rounded-full text-xs font-semibold">Populer</span> {/* Badge baru */}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-900/70 to-transparent" /> {/* Tinggi lebih besar */}
        <div className="absolute left-3 bottom-3 right-3 text-white">
          <h3 className="font-semibold text-base leading-tight line-clamp-1"> {/* Kecilkan */}
            {title}
          </h3>
          <p className="text-xs opacity-90 line-clamp-1"> {/* Kecilkan */}
            {spots}
          </p>
        </div>
      </div>
      <div className="p-4"> {/* Kurangi p */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sky-600 dark:text-sky-400 font-extrabold text-lg"> {/* Kecilkan */}
            {priceLabel} <span className="text-xs font-normal text-gray-600 dark:text-gray-400">/ {t("home.perPax", { defaultValue: "pax" })}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"> {/* Kecilkan */}
            <Calendar size={14} /> {t("home.flexible", { defaultValue: "Flexible" })}
          </div>
        </div>
        <div className="mt-2">
          <button
            className="btn btn-primary glass w-full !py-2 text-sm" // Kecilkan py
            onClick={() => navigate(`/packages/${pkg.id}`, { state: { pax, audience } })}
            aria-label={`Lihat detail ${title}`}
          >
            {t("home.viewDetails", { defaultValue: "Lihat Detail Paket" })} <ChevronRight size={14} className="ml-1" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function PopularPackages({ heading, subheading, data, currency, fx, locale }) {
  const { t } = useTranslation();
  const pax = 6;
  const [audience, setAudience] = useState("domestic");
  const [popularPackages, setPopularPackages] = useState([]);

  useEffect(() => {
    const TARGET_PAX = 6;
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
  }, [data, audience]);

  return (
    <section id="popular" className="container mt-16 md:mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 md:mb-8 gap-3 md:gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"> {/* Kecilkan */}
            {heading || t("home.popular", { defaultValue: "Paket Populer" })}
          </h2>
          {subheading && <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm md:text-base"> {/* Kecilkan */}
            {subheading}
          </p>}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3">
          <div className="flex gap-1 md:gap-2">
            {["domestic", "foreign"].map((k) => (
              <button
                key={k}
                onClick={() => setAudience(k)}
                className={`btn ${audience === k ? "btn-primary" : "btn-outline"} !py-1 !px-2.5 text-xs`} // Kecilkan
                aria-label={`Pilih ${k === "domestic" ? t("explore.domestic", { defaultValue: "Domestik" }) : "Foreign"}`}
              >
                {k === "domestic" ? t("explore.domestic", { defaultValue: "Domestik" }) : "Foreign"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap"> {/* Kecilkan */}
              {t("home.calcFor", { defaultValue: "Harga untuk" })}
            </span>
            <span className="px-2 py-1.5 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/60 dark:bg-gray-900/60 text-xs"> {/* Kecilkan */}
              6 {t("home.pax", { defaultValue: "pax" })}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"> {/* Gap lebih rapat */}
        {popularPackages.length ? (
          popularPackages.map(({ p, price }) => (
            <PopularCard key={p.id} pkg={p} price={price} pax={pax} currency={currency} fx={fx} locale={locale} audience={audience} />
          ))
        ) : (
          <p className="text-gray-600 dark:text-gray-300 col-span-full text-center text-sm"> {/* Kecilkan */}
            {t("home.noPackages", { defaultValue: "No popular packages available." })}
          </p>
        )}
      </div>
      <div className="mt-6 md:mt-8 text-right">
        <Link to="/explore" className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400 hover:underline text-sm md:text-base"> {/* Kecilkan */}
          {t("home.viewAllPackages", { defaultValue: "Lihat semua paket" })} <ChevronRight size={16} />
        </Link>
      </div>
    </section>
  );
}

function TestimonialCard({ item, lang, currentIndex, total, isActive }) { // Tambah props currentIndex & total
  const getStars = (n) => {
    const s = Math.max(1, Math.min(5, Number(n || 5)));
    return Array.from({ length: 5 }, (_, i) => ( // Ubah ke 5 stars tetap, filled berdasarkan rating
      <Star key={i} size={14} className={i < s ? "text-amber-500 fill-amber-500" : "text-gray-300 dark:text-gray-600"} />
    ));
  };
  return (
    <motion.div
      className="card p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 flex flex-col h-full relative overflow-hidden card-glow" // Tambah glass, glow
      animate={isActive ? { opacity: 1, scale: 1.02 } : { opacity: 0.9, scale: 1 }} // Tambah subtle scale
      transition={{ duration: 0.4 }}
    >
      {/* Counter di pojok */}
      <div className="absolute top-3 right-3 text-xs text-gray-400 opacity-60 z-10">{currentIndex + 1} / {total}</div>
      
      {/* Quote icon di atas */}
      <div className="flex justify-center mb-3 opacity-20">
        <Quote size={32} className="text-sky-400" />
      </div>
      
      <div className="flex items-center gap-1.5 mb-3">
        {getStars(item.stars)}
      </div>
      
      <p className="text-gray-700 dark:text-gray-200 flex-grow mb-3 text-xs md:text-sm leading-relaxed italic font-light"> {/* Tambah italic */}
        "{item.text}" {/* Wrap di quotes untuk nuansa testimonial */}
      </p>
      
      {lang !== item.lang && (
        <a
          href={`https://translate.google.com/?sl=${item.lang}&tl=${lang}&text=${encodeURIComponent(item.text)}&op=translate`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-sky-600 dark:text-sky-400 hover:underline mb-2 inline-flex items-center gap-1"
        >
          📖 Translate to {lang.toUpperCase()}
        </a>
      )}
      
      {/* Footer dengan avatar */}
      <footer className="text-xs text-gray-500 dark:text-gray-400 mt-auto flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="avatar-initial flex-shrink-0"> {/* Avatar inisial */}
          <span className="text-sm font-medium text-white">{item.name.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          {item.name}{item.city ? `, ${item.city}` : ""}
        </div>
      </footer>
    </motion.div>
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
  const [errors, setErrors] = useState({}); // Validation baru

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) {
      setErrors({ name: !name.trim(), text: !text.trim() });
      alert("Mohon isi nama dan testimoni.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ name, city, text, stars, lang: t("i18n.language", { defaultValue: "id" }) });
      setName(""); setCity(""); setText(""); setStars(5); setErrors({});
      alert(t("home.testimonialSubmitted", { defaultValue: "Testimonial submitted successfully! Thank you for your feedback." }));
    } catch (error) {
      alert(t("home.testimonialError", { defaultValue: "Error submitting testimonial. Please try again." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl p-5 sm:p-6 md:p-8 bg-gradient-to-br from-sky-50 to-white/50 dark:from-slate-900 dark:to-slate-800/50 shadow-lg border border-slate-200/60 dark:border-slate-700/60">
      <div className="text-center mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white"> {/* Kecilkan */}
          {t("home.submitTestimonial", { defaultValue: "Share Your Experience" })}
        </h3>
        <p className="mt-1 text-xs md:text-sm text-gray-600 dark:text-gray-300"> {/* Kecilkan */}
          How was your trip with us? We'd love to hear your feedback!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"> {/* Kecilkan */}
              {t("home.name", { defaultValue: "Name" })}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: false }); }}
              required
              className={`w-full px-3 py-1.5 md:py-2 rounded-xl border ${errors.name ? 'border-red-500' : 'border-slate-300/70 dark:border-slate-700'} bg-white/60 dark:bg-slate-950/60 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition text-sm`} // Tambah error state
              placeholder={t("home.namePlaceholder", { defaultValue: "Your name" })}
              aria-invalid={!!errors.name}
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"> {/* Kecilkan */}
              {t("home.city", { defaultValue: "City" })}
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-1.5 md:py-2 rounded-xl border-slate-300/70 dark:border-slate-700 bg-white/60 dark:bg-slate-950/60 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition text-sm"
              placeholder={t("home.cityPlaceholder", { defaultValue: "Your city (optional)" })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"> {/* Kecilkan */}
            {t("home.rating", { defaultValue: "Rating" })}
          </label>
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
                  whileHover={{ scale: 1.1 }} // Soft-er
                  whileTap={{ scale: 0.95 }}
                  className="p-1 cursor-pointer"
                >
                  <Star size={20} className={`transition-colors ${color}`} /> {/* Kecilkan */}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"> {/* Kecilkan */}
            {t("home.testimonial", { defaultValue: "Testimonial" })}
          </label>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); if (errors.text) setErrors({ ...errors, text: false }); }}
            required
            className={`w-full px-3 py-1.5 md:py-2 rounded-xl border ${errors.text ? 'border-red-500' : 'border-slate-300/70 dark:border-slate-700'} bg-white/60 dark:bg-slate-950/60 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition text-sm`} // Error state
            rows={3} // Kurangi rows
            placeholder={t("home.testimonialPlaceholder", { defaultValue: "Share your amazing experience..." })}
            aria-invalid={!!errors.text}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary glass w-full !py-2.5 !text-sm !font-semibold flex items-center justify-center gap-1.5 transition-all hover:shadow-lg" // Kecilkan
        >
          {isSubmitting ? t("home.submitting", { defaultValue: "Submitting..." }) : t("home.submit", { defaultValue: "Submit My Review" })}
          <Send size={14} /> {/* Kecilkan */}
        </button>
      </form>
    </div>
  );
}

function Testimonials({ title, allItems = [] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.slice(0, 2);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoInterval = useRef(null); // Tambah ref untuk auto-slide
  const [isHovered, setIsHovered] = useState(false); // Pause on hover

  const handlePrev = () => setCurrentIndex(i => (i - 1 + allItems.length) % allItems.length);
  const handleNext = () => setCurrentIndex(i => (i + 1) % allItems.length);

  // Auto-advance logic
  useEffect(() => {
    if (allItems.length <= 1) return;
    autoInterval.current = setInterval(() => {
      if (!isHovered) handleNext(); // Pause jika hover
    }, 5000); // 5 detik
    return () => clearInterval(autoInterval.current);
  }, [allItems.length, isHovered]);

  const handleTestimonialSubmit = async (testimonial) => {
    const { error } = await supabase
      .from("testimonials")
      .insert([{ ...testimonial, is_approved: false }]);
    if (error) throw error;
  };

  if (!allItems.length) return null;

  return (
    <section className="container mt-16 md:mt-20 section-gradient"> {/* Tambah gradient subtle */}
      {title && (
        <motion.h2
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 md:mb-8 text-center" // Tambah center
        >
          {title}
        </motion.h2>
      )}
      
      <div className="max-w-2xl md:max-w-3xl mx-auto relative"> {/* Tambah relative untuk hover */}
        <div 
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence mode="wait">
            <TestimonialCard 
              key={currentIndex} 
              item={allItems[currentIndex]} 
              lang={lang} 
              currentIndex={currentIndex} 
              total={allItems.length}
              isActive={true} 
            />
          </AnimatePresence>
          
          {/* Dots improved */}
          <div className="flex justify-center mt-4 testimonial-dots"> {/* Tambah class */}
            {allItems.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`dot ${i === currentIndex ? 'dot-active' : ''}`}
                whileHover={{ scale: 1.2 }} // Hover scale
                aria-label={`Pilih testimoni ${i + 1}`}
              />
            ))}
          </div>
          
          {/* Buttons di bawah, lebih compact */}
          <div className="flex justify-center gap-3 mt-4"> {/* Center buttons */}
            <button onClick={handlePrev} className="btn btn-outline glass !p-2 rounded-full" aria-label="Sebelumnya">
              <ChevronRight size={14} className="rotate-180" />
            </button>
            <button onClick={handleNext} className="btn btn-outline glass !p-2 rounded-full" aria-label="Selanjutnya">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl md:max-w-3xl mx-auto mt-8 md:mt-12">
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
    <section className="container mt-16 md:mt-20">
      {(title || subtitle) && (
        <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true }}>
          {title && <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2"> {/* Kecilkan */}
            {title}
          </h2>}
          {subtitle && <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm md:text-base"> {/* Kecilkan */}
            {subtitle}
          </p>}
        </motion.div>
      )}
      <div className="mt-6 md:mt-8 card p-5 md:p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
        <ol className="relative border-l-2 border-sky-200 dark:border-sky-800 space-y-5 md:space-y-6"> {/* Spacing lebih besar */}
          {list.map((s, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.15 }} // Delay lebih panjang
              className="relative pl-6 md:pl-8"
              whileHover={{ x: 5 }} // Hover reveal
            >
              <span className="absolute left-[1px] top-2 md:top-2.5 w-3.5 md:w-4 h-3.5 md:h-4 rounded-full bg-sky-500 ring-4 ring-white dark:ring-gray-900 -translate-x-1/2 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{i + 1}</span> {/* Numbered steps */}
              </span>
              <div className="ml-1 md:ml-2">
                <div className="font-semibold text-base md:text-lg text-gray-900 dark:text-white"> {/* Kecilkan */}
                  {s.title}
                </div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1"> {/* Kecilkan */}
                  {s.text}
                </div>
              </div>
              {i < list.length - 1 && <div className="timeline-connector" style={{ top: '2.5rem', height: 'calc(100% + 1rem)' }} />} {/* Connector */}
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function BigCTA({ title, desc, whatsapp = "+62895630193926" }) {
  const { t } = useTranslation();
  return (
    <section className="container mt-16 md:mt-20 mb-16 md:mb-24">
      <div className="relative card p-5 md:p-6 md:p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-sky-100/60 to-indigo-100/60 dark:from-sky-900/60 dark:to-indigo-900/60" /> {/* Vibrant gradient */}
        <motion.div
          className="absolute top-4 right-4 opacity-20" // Floating icon
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Phone size={32} className="text-sky-400" />
        </motion.div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <div className="flex-1">
            {title && <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white"> {/* Kecilkan */}
              {title}
            </h3>}
            {desc && <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm md:text-base"> {/* Kecilkan */}
              {desc}
            </p>}
          </div>
          <div className="flex gap-3 md:gap-4 flex-shrink-0">
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              className="btn btn-primary glass py-2 px-5 md:py-2.5 md:px-6 relative overflow-hidden" // Ripple ready
              target="_blank"
              rel="noreferrer"
              aria-label="Chat WhatsApp"
            >
              <Phone size={16} className="mr-1.5" /> WhatsApp
            </a>
            <Link to="/explore" className="btn btn-outline glass py-2 px-5 md:py-2.5 md:px-6" aria-label="Lihat Semua Paket">
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
    const on = () => setShow((window.scrollY || 0) > 400); // Kurangi threshold
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
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-30"
        >
          <a
            href="https://wa.me/62895630193926"
            target="_blank"
            rel="noreferrer"
            className="w-full md:w-auto btn btn-primary glass flex items-center gap-2 shadow-lg rounded-xl px-5 py-2.5 text-sm" // Kecilkan
            aria-label="Butuh bantuan? Chat WhatsApp"
          >
            <MessageCircle size={16} /> {t("home.helpCTA", { defaultValue: "Butuh bantuan? Chat WhatsApp" })}
          </a>
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
        whatsapp={S.cta?.data?.whatsapp || "+62895630193926"}
      />
      <StickyHelpCTA />
    </>
  );
}