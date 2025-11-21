// src/pages/Home.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  MapPin, Calendar, Users, BadgeCheck,
  MessageCircle, Star, ChevronRight,
  Search, Phone, Send, Quote, ArrowRight
} from "lucide-react";
import BlurText from "../components/BlurText";
import usePackages from "../hooks/usePackages";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";
import usePageSections from "../hooks/usePageSections";
import { supabase } from "../lib/supabaseClient";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const FALLBACK_HERO_IMAGES = ["/hero2.jpg", "/hero1.jpg", "/hero3.jpg", "/hero4.jpg", "/hero5.jpg", "/hero6.jpg"];

/* ===============================
   ANIMATION VARIANTS
================================= */
const bouncyUp = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 200, 
      damping: 15,    
      mass: 1
    } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

/* ===============================
   HELPERS
================================= */
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

function SpotlightOverlay({ className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frameId;
    const onMove = (e) => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
        el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);
  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background: "radial-gradient(600px circle at var(--spot-x,50%) var(--spot-y,50%), rgba(255,255,255,0.15), transparent 60%)",
        mixBlendMode: "overlay",
      }}
    />
  );
}

function ShimmerButton({ as: Comp = "a", className = "", children, ...props }) {
  return (
    <Comp 
      {...props} 
      className={`relative overflow-hidden group btn glass border-white/20 ${className}`} 
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <motion.div
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
      />
    </Comp>
  );
}

function Marquee({ speed = 35, children }) {
  return (
    <div className="relative overflow-hidden w-full mask-linear-fade">
      <motion.div
        className="flex gap-3 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: speed }}
      >
        <div className="flex gap-3">{children}</div>
        <div className="flex gap-3">{children}</div>
      </motion.div>
    </div>
  );
}

/* ===============================
   COMPONENTS & SECTIONS
================================= */

function Hero({ images = [], subtitle, title, desc, chips = [], onSearch, ctaContactLabel }) {
  const reduced = usePrefersReducedMotion();
  const [idx, setIdx] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 300]); 

  usePreload(images);
  useEffect(() => {
    setIsLoaded(true);
    if (reduced || images.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % images.length), 5000);
    return () => clearInterval(id);
  }, [reduced, images.length]);

  return (
    <section className="relative h-[75vh] md:h-[80vh] overflow-hidden shadow-xl bg-slate-900 rounded-[2rem] mt-2 mx-2 md:mx-0">
      <motion.div style={{ y }} className="absolute inset-0 z-0 will-change-transform">
        <AnimatePresence mode="popLayout">
          {images.map((raw, i) => {
            const src = normalizeUrl(raw);
            return (
              <motion.img
                key={src || i}
                src={src}
                alt="Hero"
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                loading={i === 0 ? "eager" : "lazy"}
              />
            );
          })}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/20 to-slate-950" />
        <div className="absolute inset-0 bg-black/20" />
        <SpotlightOverlay />
      </motion.div>

      <motion.div
        className="relative z-10 container h-full flex flex-col justify-center items-center text-center px-4"
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        variants={staggerContainer}
      >
        {subtitle && (
          <motion.div variants={bouncyUp} className="mb-4">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-[10px] md:text-xs font-bold tracking-[0.2em] text-sky-300 uppercase shadow-lg">
              {subtitle}
            </span>
          </motion.div>
        )}
        
        {title && (
          <div className="mb-4 max-w-4xl w-full mx-auto flex flex-col items-center justify-center text-center">
             <BlurText
                text={title}
                delay={40}
                animateBy="words"
                direction="top"
                className="font-hero font-extrabold text-white leading-[1.1] drop-shadow-2xl text-[clamp(28px,6vw,50px)] tracking-tight text-center mx-auto w-full flex flex-wrap justify-center gap-x-2.5 gap-y-0"
             />
          </div>
        )}

        {desc && (
          <motion.p 
            variants={bouncyUp} 
            className="max-w-xl mx-auto text-sm md:text-base text-slate-100 leading-relaxed mb-8 drop-shadow-md font-light text-center opacity-90"
          >
            {desc}
          </motion.p>
        )}

        {ctaContactLabel && (
          <motion.div 
            variants={bouncyUp} 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <ShimmerButton 
              as="a" 
              href="#popular" 
              className="!bg-sky-600 hover:!bg-sky-500 text-white !border-none !px-6 !py-3 !rounded-full shadow-lg shadow-sky-900/50 text-sm md:text-base font-bold tracking-wide"
            >
              {ctaContactLabel} <ChevronRight size={18} />
            </ShimmerButton>
          </motion.div>
        )}

        {!!chips?.length && (
          <motion.div 
            variants={bouncyUp} 
            className="absolute bottom-6 w-full max-w-lg mx-auto left-0 right-0 px-4"
          >
            <p className="text-[10px] text-white/60 mb-2 uppercase tracking-widest font-semibold text-center">Pencarian Populer</p>
            <Marquee speed={40}>
              {chips.map((c, i) => (
                <button
                  key={i}
                  onClick={() => onSearch?.(c.q)}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-[10px] md:text-xs text-white transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md"
                >
                  <Search size={10} className="text-sky-300" /> {c.label}
                </button>
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
    <motion.div
      variants={bouncyUp}
      className="group p-6 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 dark:border-slate-800 h-full relative overflow-hidden"
      whileHover={{ y: -5 }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-500/10 to-transparent rounded-bl-full transition-transform group-hover:scale-150 origin-top-right" />
      
      <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center mb-4 group-hover:bg-sky-500 group-hover:text-white transition-colors duration-500 shadow-sm group-hover:shadow-lg group-hover:shadow-sky-500/30">
        <Icon className="text-sky-600 dark:text-sky-400 group-hover:text-white transition-colors duration-500" size={24} />
      </div>
      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {text}
      </p>
    </motion.div>
  );
}

function WhyUs({ title, subtitle, items = [] }) {
  return (
    <section className="container mt-16 relative z-10">
      <motion.div 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, margin: "-50px", amount: 0.2 }}
        variants={staggerContainer}
      >
        <div className="text-center mb-10 max-w-3xl mx-auto px-4">
          {title && <motion.h2 variants={bouncyUp} className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{title}</motion.h2>}
          {subtitle && <motion.p variants={bouncyUp} className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">{subtitle}</motion.p>}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 px-4 md:px-0">
          {items.map((it, i) => (
            <FeatureCard key={i} iconName={it.icon || "badge-check"} title={it.title} text={it.text} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function Stats({ trips = 0, photos = 0, rating = 4.9 }) {
  const { t } = useTranslation();
  const [start, setStart] = useState(false);
  
  const tv = useCountUp({ to: trips, duration: 2500, start });
  const pv = useCountUp({ to: photos, duration: 2500, start });
  const rv = useCountUp({ to: Math.round(rating * 10), duration: 2000, start });

  return (
    <section className="container mt-16 md:mt-20 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        onViewportEnter={() => setStart(true)}
        // UPDATED VISUALS & THEME ADAPTABILITY
        className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl transition-all duration-500"
      >
        {/* Soft Background Blobs (Adaptive) */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-sky-400/20 dark:bg-sky-600/20 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen transition-colors duration-500" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen transition-colors duration-500" />

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 p-8 md:p-12 transition-colors duration-500">
          {[
            { num: tv.toLocaleString() + "+", label: t("home.stats.travelers", { defaultValue: "Happy Travelers" }), icon: Users, color: "text-sky-500" },
            { num: pv.toLocaleString() + "+", label: t("home.stats.media", { defaultValue: "Photos & Videos" }), icon: Star, color: "text-amber-400" },
            { num: (rv / 10).toFixed(1), label: t("home.stats.rating", { defaultValue: "Average Rating" }), icon: BadgeCheck, color: "text-emerald-500" },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={start ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              className="flex flex-col items-center justify-center px-4 py-4 sm:py-0"
            >
              <div className={`mb-4 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 ${stat.color} transition-colors duration-500`}>
                 <stat.icon size={32} strokeWidth={2} />
              </div>
              <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-1 transition-colors duration-500 tabular-nums">
                {stat.num}
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors duration-500">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
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
      variants={bouncyUp}
      className="group bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-md hover:shadow-xl hover:shadow-sky-900/5 transition-all duration-500 border border-slate-100 dark:border-slate-800 overflow-hidden h-full flex flex-col"
      whileHover={{ y: -8 }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={cover}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 backdrop-blur-md text-slate-900 px-3 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1">
            <Star size={12} className="fill-amber-400 text-amber-400"/> Popular
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-60" />
        <div className="absolute left-4 bottom-4 right-4 text-white">
          <h3 className="font-bold text-lg leading-tight mb-1 text-shadow-lg drop-shadow-md line-clamp-2">{title}</h3>
          <div className="flex items-center text-[10px] text-slate-200 font-medium bg-black/20 w-fit px-2 py-0.5 rounded-lg backdrop-blur-sm">
             <MapPin size={10} className="mr-1 text-sky-400"/> <span className="line-clamp-1">{spots}</span>
          </div>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 font-bold uppercase tracking-wide">{t("home.flexible")}</p>
            <div className="text-sky-600 dark:text-sky-400 font-extrabold text-lg tracking-tight">
              {priceLabel}
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
            / {t("home.perPax")}
          </div>
        </div>
        
        <div className="mt-auto">
          <button
            className="w-full btn bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all duration-300 rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md group-hover:shadow-lg active:scale-95"
            onClick={() => navigate(`/packages/${pkg.id}`, { state: { pax, audience } })}
          >
            {t("home.viewDetails")} <ArrowRight size={14} />
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
    <section id="popular" className="container mt-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }} 
        variants={staggerContainer}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-4 md:px-0">
          <div className="text-center md:text-left">
            <motion.h2 variants={bouncyUp} className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              {heading || t("home.popular")}
            </motion.h2>
            {subheading && <motion.p variants={bouncyUp} className="text-slate-600 dark:text-slate-400 mt-2 text-sm md:text-base max-w-lg">{subheading}</motion.p>}
          </div>
          
          <motion.div variants={bouncyUp} className="flex flex-col sm:flex-row items-center gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1.5 rounded-xl shadow-sm self-center md:self-auto">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {["domestic", "foreign"].map((k) => (
                <button
                  key={k}
                  onClick={() => setAudience(k)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm ${
                    audience === k 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-transparent shadow-none"
                  }`}
                >
                  {k === "domestic" ? t("explore.domestic", { defaultValue: "Domestic" }) : "Foreign"}
                </button>
              ))}
            </div>
            <div className="text-[10px] font-bold text-slate-400 px-2">
              {t("home.calcFor")} <strong className="text-slate-600 dark:text-slate-200">6 {t("home.pax")}</strong>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 px-4 md:px-0">
          {popularPackages.length ? (
            popularPackages.map(({ p, price }) => (
              <PopularCard key={p.id} pkg={p} price={price} pax={pax} currency={currency} fx={fx} locale={locale} audience={audience} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border border-dashed border-slate-300 dark:border-slate-700">
              <p className="text-slate-500 font-medium text-sm">
                {t("home.noPackages", { defaultValue: "No popular packages available." })}
              </p>
            </div>
          )}
        </div>

        <motion.div variants={bouncyUp} className="mt-10 text-center">
          <Link to="/explore" className="btn btn-outline rounded-full px-8 py-3 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm hover:shadow-md">
            {t("home.viewAllPackages")} <ChevronRight size={14} className="ml-1" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

function TestimonialCard({ item, lang, currentIndex, total, isActive }) {
  const getStars = (n) => {
    const s = Math.max(1, Math.min(5, Number(n || 5)));
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={14} className={i < s ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700"} />
    ));
  };
  return (
    <motion.div
      className="card p-5 md:p-8 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-lg border border-slate-100 dark:border-slate-800 relative h-full flex flex-col w-full"
      animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0.8, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute top-4 right-4 opacity-10">
        <Quote size={32} className="text-sky-600" />
      </div>
      
      <div className="flex items-center gap-1 mb-4">
        {getStars(item.stars)}
      </div>
      
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
        <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-4 font-medium italic">
          "{item.text}"
        </p>
      </div>
      
      {lang !== item.lang && (
        <a
          href={`https://translate.google.com/?sl=${item.lang}&tl=${lang}&text=${encodeURIComponent(item.text)}&op=translate`}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] font-bold text-sky-600 hover:underline mb-4 block uppercase tracking-wider"
        >
          Translate to {lang.toUpperCase()}
        </a>
      )}
      
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
          {item.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{item.name}</div>
          {item.city && <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide truncate">{item.city}</div>}
        </div>
        <div className="ml-auto text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md whitespace-nowrap">
          {currentIndex + 1} / {total}
        </div>
      </div>
    </motion.div>
  );
}

function TestimonialForm({ onSubmit }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [text, setText] = useState("");
  const [stars, setStars] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return alert("Mohon isi nama dan testimoni.");
    setIsSubmitting(true);
    try {
      await onSubmit({ name, city, text, stars, lang: t("i18n.language", { defaultValue: "id" }) });
      setName(""); setCity(""); setText(""); setStars(5);
      alert(t("home.testimonialSubmitted"));
    } catch (error) {
      alert("Error submitting testimonial.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-[1.5rem] p-5 md:p-8 border border-slate-200 dark:border-slate-700 shadow-lg relative overflow-hidden w-full">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-indigo-500" />
      <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-1 text-center mt-1">
        {t("home.submitTestimonial", { defaultValue: "Share Your Experience" })}
      </h3>
      <p className="text-center text-slate-500 text-xs mb-5">Help us improve by leaving a review!</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs md:text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all"
            placeholder={t("home.namePlaceholder", { defaultValue: "Your Name" })}
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs md:text-sm focus:ring-2 focus:ring-sky-500 outline-none transition-all"
            placeholder={t("home.cityPlaceholder", { defaultValue: "City (Optional)" })}
          />
        </div>
        
        <div className="flex justify-center gap-2 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setStars(star)}
              className={`p-1 transition-transform hover:scale-110 active:scale-95 ${star <= stars ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
            >
              <Star size={22} fill={star <= stars ? "currentColor" : "none"} />
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs md:text-sm focus:ring-2 focus:ring-sky-500 outline-none resize-none"
          rows={3}
          placeholder={t("home.testimonialPlaceholder", { defaultValue: "Tell us about your trip..." })}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn btn-primary py-3 rounded-xl font-bold shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 hover:shadow-sky-500/40 transition-all text-xs md:text-sm active:scale-[0.98]"
        >
          {isSubmitting ? "Sending..." : <> {t("home.submit", { defaultValue: "Send Review" })} <Send size={16}/></>}
        </button>
      </form>
    </div>
  );
}

function Testimonials({ title, allItems = [] }) {
  const { i18n } = useTranslation();
  const lang = i18n.language.slice(0, 2);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % allItems.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + allItems.length) % allItems.length);

  useEffect(() => {
    if (allItems.length <= 1 || isHovered) return;
    const interval = setInterval(handleNext, 6000);
    return () => clearInterval(interval);
  }, [allItems.length, isHovered]);

  const handleTestimonialSubmit = async (testimonial) => {
    const { error } = await supabase.from("testimonials").insert([{ ...testimonial, is_approved: false }]);
    if (error) throw error;
  };

  if (!allItems.length) return null;

  return (
    <section className="container mt-20 md:mt-24">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }} 
        variants={staggerContainer}
      >
        {title && (
          <motion.h2 variants={bouncyUp} className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white text-center mb-8 md:mb-12 px-4">
            {title}
          </motion.h2>
        )}

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start px-4 md:px-0">
          <div 
            className="relative w-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Height reduced */}
            <div className="relative h-[450px] sm:h-[350px] md:h-[320px] w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute inset-0 w-full"
                >
                  <TestimonialCard 
                    item={allItems[currentIndex]} 
                    lang={lang} 
                    currentIndex={currentIndex} 
                    total={allItems.length}
                    isActive={true}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <button onClick={handlePrev} className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-all shadow-sm active:scale-95">
                <ChevronRight className="rotate-180" size={18} />
              </button>
              <div className="flex gap-1.5 items-center">
                {allItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? "w-6 bg-sky-500" : "w-1.5 bg-slate-300 dark:bg-slate-700"}`}
                  />
                ))}
              </div>
              <button onClick={handleNext} className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-all shadow-sm active:scale-95">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="w-full">
            <TestimonialForm onSubmit={handleTestimonialSubmit} />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function HowItWorks({ title, subtitle, steps = [] }) {
  const { t } = useTranslation();
  const fallback = [
    { icon: "search", title: t("home.whyItems.0.title"), text: t("home.whyItems.0.text") },
    { icon: "message", title: t("home.whyItems.1.title"), text: t("home.whyItems.1.text") },
    { icon: "calendar", title: t("home.whyItems.2.title"), text: t("home.whyItems.2.text") },
    { icon: "badge-check", title: t("home.whyItems.3.title"), text: t("home.whyItems.3.text") },
  ];
  const list = steps.length ? steps : fallback;

  return (
    <section className="container mt-20 md:mt-24 mb-16">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }} 
        variants={staggerContainer}
      >
        <div className="text-center mb-10">
          {title && <motion.h2 variants={bouncyUp} className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{title}</motion.h2>}
          {subtitle && <motion.p variants={bouncyUp} className="text-slate-600 dark:text-slate-400 text-sm md:text-base">{subtitle}</motion.p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative px-4 md:px-0">
          <div className="hidden lg:block absolute top-8 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent -z-10" />

          {list.map((s, i) => (
            <motion.div
              key={i}
              variants={bouncyUp}
              whileHover={{ y: -5 }}
              className="group flex flex-col items-center text-center bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 relative h-full"
            >
              <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-slate-800 flex items-center justify-center mb-4 shadow-inner group-hover:bg-sky-500 group-hover:text-white transition-colors duration-300 relative z-10">
                <span className="text-xl font-bold">{i + 1}</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{s.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function StickyHelpCTA() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow((window.scrollY || 0) > 400);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <a
            href="https://wa.me/62895630193926"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-full shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all font-bold group text-sm"
          >
            <MessageCircle size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="hidden md:inline">{t("home.helpCTA", { defaultValue: "Help" })}</span>
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
  const { t } = useTranslation();
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
      const { data, error } = await supabase.from("testimonials").select("*").eq("is_approved", true);
      if (!error) setAllTestimonials(data);
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
        title={S.whyus?.locale?.title || t("home.whyTitle")}
        subtitle={S.whyus?.locale?.body_md || t("home.whySubtitle")}
        items={S.whyus?.locale?.extra?.items || [
          { icon: "badge-check", title: t("home.whyItems.0.title"), text: t("home.whyItems.0.text") },
          { icon: "users", title: t("home.whyItems.1.title"), text: t("home.whyItems.1.text") },
          { icon: "calendar", title: t("home.whyItems.2.title"), text: t("home.whyItems.2.text") },
          { icon: "map-pin", title: t("home.whyItems.3.title"), text: t("home.whyItems.3.text") },
        ]}
      />
      <Stats
        trips={Number(S.stats?.data?.trips) || 400}
        photos={Number(S.stats?.data?.photos) || 1300}
        rating={Number(S.stats?.data?.rating) || 4.9}
      />
      <PopularPackages
        heading={S.popular?.locale?.title || t("home.popular")}
        subheading={S.popular?.locale?.body_md || t("home.popularSub")}
        data={packages}
        currency={currency}
        fx={fx}
        locale={locale}
      />
      <HowItWorks
        title={S.how?.locale?.title || t("home.howTitle")}
        subtitle={S.how?.locale?.body_md || t("home.howSubtitle")}
        steps={S.how?.locale?.extra?.steps || []}
      />
      <Testimonials
        title={S.testimonials?.locale?.title || t("home.testimonialsTitle")}
        allItems={allTestimonials}
      />
      <StickyHelpCTA />
    </>
  );
}