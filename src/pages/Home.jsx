import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  MapPin, Calendar, Users, BadgeCheck,
  MessageCircle, Star, ChevronRight, ChevronLeft,
  Search, Quote, ArrowRight, Send, Camera, Instagram
} from "lucide-react";
import BlurText from "../components/BlurText";
import OptimizedImage from "../components/OptimizedImage";
import {
  DestinationCardSkeleton,
  GalleryGridSkeleton,
  PopularCardSkeleton,
} from "../components/Skeleton";
import usePackages from "../hooks/usePackages";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";
import usePageSections from "../hooks/usePageSections";
import { supabase } from "../lib/supabaseClient";
import { getPkgImage, preloadImage } from "../utils/images";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const FALLBACK_HERO_IMAGES = ["/hero2.jpg", "/hero1.jpg", "/hero3.jpg", "/hero4.jpg", "/hero5.jpg", "/hero6.jpg"];

const bouncyUp = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 100, 
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
      staggerChildren: 0.15, 
      delayChildren: 0.1
    }
  }
};

function SpotlightOverlay({ className = "", disabled = false }) {
  const ref = useRef(null);
  useEffect(() => {
    if (disabled) return undefined;
    const el = ref.current;
    if (!el) return undefined;
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
  }, [disabled]);
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

function Marquee({ speed = 35, children, reduced = false }) {
  if (reduced) {
    return (
      <div className="relative w-full overflow-hidden mask-linear-fade">
        <div className="flex w-max gap-3">{children}</div>
      </div>
    );
  }

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

function Hero({ images = [], subtitle, title, desc, chips = [], onSearch, ctaContactLabel }) {
  const { t } = useTranslation();
  const reduced = usePrefersReducedMotion();
  const hasChips = chips?.length > 0;
  const [idx, setIdx] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, reduced ? 0 : 200]);
  const slideTransition = reduced
    ? { duration: 0.01 }
    : { duration: 1.5, ease: "easeInOut" };

  useEffect(() => {
    if (images.length <= 1) return;
    const nextIndex = (idx + 1) % images.length;
    preloadImage(images[nextIndex], { width: 1920, quality: 78 });
  }, [idx, images]);

  useEffect(() => {
    setIsLoaded(true);
    if (reduced || images.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % images.length), 6000);
    return () => clearInterval(id);
  }, [reduced, images.length]);

  const nextSlide = () => setIdx((prev) => (prev + 1) % images.length);
  const prevSlide = () => setIdx((prev) => (prev - 1 + images.length) % images.length);

  return (
    <section className="relative min-h-[100dvh] min-h-[calc(var(--vh,1vh)*100)] w-full overflow-hidden bg-slate-900 group grain">
      
      {/* --- BACKGROUND SLIDER --- */}
      <motion.div style={reduced ? undefined : { y }} className="absolute inset-0 z-0 will-change-transform">
        <AnimatePresence mode={reduced ? "sync" : "wait"}>
          <motion.div
            key={reduced ? 0 : idx}
            className="absolute inset-0"
            initial={reduced ? false : { opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, scale: 1.02 }}
            transition={slideTransition}
          >
            <OptimizedImage
              src={images[reduced ? 0 : idx]}
              alt="Hero"
              preset="hero"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              fetchpriority="high"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Overlay */}
        <div className="absolute inset-0 hero-tropical-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-900/25" />
        <SpotlightOverlay disabled={reduced} />
      </motion.div>

      {/* --- NAVIGASI PANAH MANUAL --- */}
      {images.length > 1 && !reduced && (
        <>
          <div className="absolute top-1/2 left-4 md:left-8 z-20 -translate-y-1/2 p-3 cursor-pointer text-white/50 hover:text-white transition-colors duration-300 hidden md:block rounded-full hover:bg-white/10" onClick={prevSlide}>
            <ChevronLeft size={48} strokeWidth={1} />
          </div>
          <div className="absolute top-1/2 right-4 md:right-8 z-20 -translate-y-1/2 p-3 cursor-pointer text-white/50 hover:text-white transition-colors duration-300 hidden md:block rounded-full hover:bg-white/10" onClick={nextSlide}>
            <ChevronRight size={48} strokeWidth={1} />
          </div>
        </>
      )}

      {/* --- KONTEN TENGAH --- */}
      <motion.div
        className={`relative z-10 container flex min-h-[inherit] flex-col items-center justify-center px-4 text-center ${hasChips ? "pb-40 md:pb-36" : "pb-16"}`}
        initial={reduced ? false : "hidden"}
        animate={reduced || isLoaded ? "visible" : "hidden"}
        variants={reduced ? undefined : staggerContainer}
      >
        {subtitle && (
          <motion.div variants={reduced ? undefined : bouncyUp} className="mb-6">
            <span className="text-[10px] md:text-sm text-white font-medium tracking-[0.2em] md:tracking-[0.3em] uppercase drop-shadow-md bg-white/10 px-3 py-1 md:px-4 md:py-1 rounded-full backdrop-blur-sm border border-white/10">
              {subtitle}
            </span>
          </motion.div>
        )}
        
        {title && (
          <div className="mb-6 md:mb-8 w-full max-w-5xl mx-auto flex justify-center">
             <BlurText
                text={title}
                delay={40}
                animateBy="words"
                direction="top"
                className="home-hero-title text-white text-[clamp(34px,8vw,72px)] text-center w-full px-2 sm:px-0"
             />
          </div>
        )}

        {desc && (
          <motion.p 
            variants={reduced ? undefined : bouncyUp} 
            className="max-w-xl md:max-w-2xl mx-auto text-sm md:text-lg text-slate-200 leading-relaxed mb-8 md:mb-10 drop-shadow-md font-light text-center opacity-90"
          >
            {desc}
          </motion.p>
        )}

        {ctaContactLabel && (
          <motion.div 
            variants={reduced ? undefined : bouncyUp}
            className="w-full flex justify-center"
          >
            {/* --- TOMBOL RESPONSIF (GLASS + GLOW) --- */}
            <motion.a 
              href="#popular" 
              className="
                group relative inline-flex items-center justify-center
                gap-3 md:gap-4
                px-6 py-3 md:px-10 md:py-4
                bg-white/5 backdrop-blur-md border border-white/30
                rounded-full text-white font-semibold
                tracking-[0.15em] md:tracking-[0.2em]
                text-xs md:text-sm uppercase overflow-hidden
                transition-all duration-300
              "
              whileHover={reduced ? undefined : { 
                scale: 1.05, 
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                borderColor: "rgba(255, 255, 255, 0.8)",
                boxShadow: "0 0 30px rgba(255,255,255,0.3)"
              }}
              whileTap={reduced ? undefined : { scale: 0.95 }}
            >
              {/* Text Label */}
              <span className="relative z-10 drop-shadow-sm whitespace-nowrap">{ctaContactLabel}</span>
              
              {/* Arrow Icon */}
              <motion.span
                initial={{ x: 0 }}
                whileHover={reduced ? undefined : { x: 5 }}
                className="relative z-10"
              >
                <ChevronRight size={16} className="md:w-[18px] md:h-[18px]" strokeWidth={2} />
              </motion.span>

              {/* Shine Animation Effect */}
              {!reduced && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 z-0"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
              )}
            </motion.a>
            {/* ---------------------------------------------------- */}
          </motion.div>
        )}

      </motion.div>

      {hasChips && (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={reduced || isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={reduced ? { duration: 0.01 } : { duration: 0.4, delay: 0.2 }}
          className="absolute inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-20 mx-auto w-full max-w-lg px-4 lg:bottom-8"
        >
          <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-widest text-white/60">
            {t("home.popularSearch")}
          </p>
          <Marquee speed={40} reduced={reduced}>
            {chips.map((c, i) => (
              <button
                key={c.q || c.label || i}
                type="button"
                onClick={() => onSearch?.(c.q)}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 hover:shadow-md md:text-xs"
              >
                <Search size={10} className="text-white/70" /> {c.label}
              </button>
            ))}
          </Marquee>
        </motion.div>
      )}
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

function FeaturedDestinationsSection({ items = [], loading = false }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const reduced = usePrefersReducedMotion();

  if (loading) {
    return (
      <section className="container relative z-10 mt-20 md:mt-28">
        <div className="mb-12 px-4 text-center md:px-0">
          <div className="mx-auto mb-3 h-8 w-64 rounded-lg skeleton-shimmer" />
          <div className="mx-auto h-4 w-96 max-w-full rounded-lg skeleton-shimmer" />
        </div>
        <div className="mx-auto max-w-6xl">
          <DestinationCardSkeleton />
          <DestinationCardSkeleton reverse />
        </div>
      </section>
    );
  }

  if (!items || items.length < 2) return null;

  const featuredDests = items.slice(0, 2);

  return (
    <section className="container mt-20 md:mt-28 relative z-10">
      <motion.div
        initial={reduced ? false : "hidden"}
        whileInView={reduced ? undefined : "visible"}
        viewport={{ once: true, amount: 0.1 }}
        variants={reduced ? undefined : staggerContainer}
      >
        <div className="text-center mb-12 px-4 md:px-0">
          <motion.h2 variants={reduced ? undefined : bouncyUp} className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
            {t("home.featuredTitle", { defaultValue: "Featured Destinations" })}
          </motion.h2>
          <motion.p variants={reduced ? undefined : bouncyUp} className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            {t("home.featuredDesc", {
              defaultValue: "Explore handpicked destinations for your next adventure",
            })}
          </motion.p>
        </div>

        <div className="max-w-6xl mx-auto">
          {featuredDests.map((item, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} gap-8 lg:gap-16 items-center mb-20 lg:mb-24 px-4 md:px-0`}
              >
                {/* Image Side */}
                <div className="w-full lg:w-1/2 group">
                  <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-[5/4]">
                    <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/0 transition-colors duration-500 z-10" />
                    <OptimizedImage
                      src={item.image || "/23.jpg"}
                      alt={item.title}
                      preset="card"
                      width={960}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000 ease-out"
                      loading="lazy"
                    />
                    {/* Floating Badge */}
                    <div className="absolute top-6 left-6 z-20 flex max-w-[calc(100%-3rem)] items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-slate-900 shadow-lg backdrop-blur-md dark:bg-slate-900/90 dark:text-white">
                      <MapPin size={16} className="shrink-0 text-sky-500" />
                      <span className="truncate">{item.title}</span>
                    </div>
                  </div>
                </div>

                {/* Text Side */}
                <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
                  <motion.h3 variants={bouncyUp} className="text-3xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    {item.title}
                  </motion.h3>
                  <motion.p variants={bouncyUp} className="text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.description || item.desc || ""}
                  </motion.p>

                  <motion.div variants={bouncyUp} className="pt-4 flex justify-center lg:justify-start">
                    <button
                      onClick={() => navigate(`/explore?dest=${item.key || item.id}`)}
                      className="group relative inline-flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-base shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <span>
                        {t("home.exploreDest", {
                          name: item.title,
                          defaultValue: "Explore {{name}}",
                        })}
                      </span>
                      <span className="bg-white/20 dark:bg-slate-900/10 p-1 rounded-full">
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}

function WhyUs({ title, subtitle, items = [] }) {
  return (
    <section className="container mt-20 relative z-10">
      <motion.div 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, amount: 0.1 }}
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
    <section className="container mt-20 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        onViewportEnter={() => setStart(true)}
        className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl transition-all duration-500"
      >
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-sky-400/20 dark:bg-sky-600/20 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen transition-colors duration-500" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen transition-colors duration-500" />

        <div className="relative z-10 grid grid-cols-3 gap-0 divide-x divide-slate-200 dark:divide-slate-800 p-4 sm:p-8 md:p-12 transition-colors duration-500">
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
              className="flex flex-col items-center justify-center px-2 py-3 sm:px-4 sm:py-0 text-center"
            >
              <div className={`mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 ${stat.color} transition-colors duration-500`}>
                 <stat.icon size={20} strokeWidth={2} className="sm:w-8 sm:h-8" />
              </div>
              <div className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-1 transition-colors duration-500 tabular-nums">
                {stat.num}
              </div>
              <div className="text-[9px] leading-tight sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide sm:tracking-wider transition-colors duration-500">
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
  const title = pkg?.locale?.title || pkg.slug || t("explore.openTrip");
  const spots = (pkg?.locale?.spots || []).slice(0, 4).join(" • ");
  const priceLabel = formatMoneyFromIDR(price, currency, fx, locale);

  return (
    <motion.div
      variants={bouncyUp}
      className="card-package group flex h-full flex-col overflow-hidden"
      whileHover={{ y: -8 }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <OptimizedImage
          src={cover}
          alt={title}
          preset="card"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 backdrop-blur-md text-slate-900 px-3 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1">
            <Star size={12} className="fill-amber-400 text-amber-400"/> {t("home.popularBadge", { defaultValue: "Popular" })}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-transparent opacity-80" />
        <div className="absolute left-4 bottom-4 right-4 text-white">
          <h3 className="font-bold text-lg leading-tight mb-1 text-shadow-lg drop-shadow-md line-clamp-2">{title}</h3>
          {spots ? (
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-sky-200/90">
              {spots.split(" • ").length} {t("explore.spots", { defaultValue: "spots" })}
            </p>
          ) : null}
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

function PopularPackages({ heading, subheading, data, currency, fx, locale, loading = false }) {
  const { t } = useTranslation();
  const reduced = usePrefersReducedMotion();
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
        initial={reduced ? false : "hidden"}
        whileInView={reduced ? undefined : "visible"}
        viewport={{ once: true, amount: 0.1 }}
        variants={reduced ? undefined : staggerContainer}
      >
        <div className="flex flex-col items-center justify-center mb-10 px-4 md:px-0">
          <motion.h2 variants={reduced ? undefined : bouncyUp} className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight text-center">
            {heading || t("home.popular")}
          </motion.h2>
          {subheading && <motion.p variants={reduced ? undefined : bouncyUp} className="text-slate-600 dark:text-slate-400 mt-2 text-sm md:text-base max-w-2xl text-center">{subheading}</motion.p>}
        </div>

        <div className="flex justify-center mb-8 px-4 md:px-0">
          <motion.div variants={reduced ? undefined : bouncyUp} className="flex flex-col sm:flex-row items-center gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1.5 rounded-xl shadow-sm">
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
                  {k === "domestic" ? t("explore.domestic", { defaultValue: "Domestic" }) : t("explore.foreign", { defaultValue: "Foreign" })}
                </button>
              ))}
            </div>
            <div className="text-[10px] font-bold text-slate-400 px-2">
              {t("home.calcFor")} <strong className="text-slate-600 dark:text-slate-200">6 {t("home.pax")}</strong>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 px-4 md:px-0">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <PopularCardSkeleton key={index} />)
          ) : popularPackages.length ? (
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

        <motion.div variants={reduced ? undefined : bouncyUp} className="mt-10 text-center">
          <Link to="/destinasi" className="btn btn-outline rounded-full px-8 py-3 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm hover:shadow-md">
            {t("home.viewAllPackages")} <ChevronRight size={14} className="ml-1" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

function HowItWorks({ title, subtitle, steps = [] }) {
  const { t } = useTranslation();
  const fallback = t("home.how", { returnObjects: true, defaultValue: [] });
  const fallbackList = Array.isArray(fallback) && fallback.length
    ? fallback
    : [
        { title: t("home.how.0.title", { defaultValue: "Choose a Package" }), text: t("home.how.0.text", { defaultValue: "" }) },
        { title: t("home.how.1.title", { defaultValue: "Chat Admin" }), text: t("home.how.1.text", { defaultValue: "" }) },
        { title: t("home.how.2.title", { defaultValue: "Set Schedule" }), text: t("home.how.2.text", { defaultValue: "" }) },
        { title: t("home.how.3.title", { defaultValue: "Let's Go!" }), text: t("home.how.3.text", { defaultValue: "" }) },
      ];
  const list = steps.length ? steps : fallbackList;

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

function GallerySection({ title, subtitle, packages = [], manualImages = [], loading = false }) {
  const { t } = useTranslation();
  const reduced = usePrefersReducedMotion();
  const galleryImages = useMemo(() => {
    // 1. Prioritaskan gambar manual dari Kustomisasi jika ada
    if (manualImages && manualImages.length > 0) {
      return manualImages.slice(0, 12);
    }

    // 2. Fallback: Ambil dari paket aktif
    const all = [];
    packages.forEach((p) => {
      if (p.default_image) all.push(p.default_image);
      if (Array.isArray(p.images)) all.push(...p.images);
    });
    // Acak dan ambil maksimal 12
    return all.sort(() => 0.5 - Math.random()).slice(0, 12);
  }, [packages, manualImages]);

  if (!loading && galleryImages.length === 0) return null;

  return (
    <section className="container mt-20 relative z-10">
      <motion.div
        initial={reduced ? false : "hidden"}
        whileInView={reduced ? undefined : "visible"}
        viewport={{ once: true, amount: 0.1 }}
        variants={reduced ? undefined : staggerContainer}
      >
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-5 shadow-2xl shadow-slate-900/10 dark:border-slate-700/70 dark:from-slate-900 dark:via-slate-950 dark:to-black md:p-8">
          <div className="absolute -top-16 left-12 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="absolute -bottom-20 right-8 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative z-10 mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="px-1">
              <motion.div variants={reduced ? undefined : bouncyUp} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/75">
                <Camera size={14} className="text-sky-200" />
                {t("home.galleryLabel", { defaultValue: "Trip Gallery" })}
              </motion.div>
              <motion.h2 variants={reduced ? undefined : bouncyUp} className="mt-4 text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                {title}
              </motion.h2>
              <motion.p variants={reduced ? undefined : bouncyUp} className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
                {subtitle}
              </motion.p>
            </div>

            <motion.div variants={reduced ? undefined : bouncyUp} className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-md">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  {t("home.galleryMoments", { defaultValue: "Captured Moments" })}
                </div>
                <div className="mt-2 text-3xl font-black text-white">{galleryImages.length}</div>
                <div className="mt-1 text-sm text-slate-300">
                  {t("home.galleryMomentsHint", { defaultValue: "Selected shots from our latest trips." })}
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-md">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  {t("home.galleryAction", { defaultValue: "Daily Inspiration" })}
                </div>
                <div className="mt-2 text-lg font-bold text-white">
                  {t("home.followIg", { defaultValue: "Follow on Instagram" })}
                </div>
                <a
                  href="https://instagram.com/cidikatravel"
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-900 ${reduced ? "" : "transition-all hover:-translate-y-0.5 hover:shadow-lg"}`}
                >
                  <Instagram size={15} />
                  <span>@cidikatravel</span>
                </a>
              </div>
            </motion.div>
          </div>

          {/* BENTO GRID LAYOUT (Max 12 items) */}
          {loading ? (
            <GalleryGridSkeleton />
          ) : (
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[150px] md:auto-rows-[220px]">
          {galleryImages.map((src, i) => {
            // Pola Grid Estetik
            // Item 0: Besar (2x2)
            // Item 5 & 9: Lebar (2x1)
            const isLarge = i === 0;
            const isWide = i === 5 || i === 9;
            
            return (
              <motion.div
                key={`${src}-${i}`}
                variants={reduced ? undefined : bouncyUp}
                className={`relative rounded-[1.5rem] overflow-hidden group border border-white/10 shadow-sm ${reduced ? "" : "hover:shadow-2xl transition-all duration-500"} ${
                  isLarge ? "col-span-2 row-span-2" : isWide ? "col-span-2 row-span-1" : "col-span-1 row-span-1"
                }`}
              >
                <OptimizedImage
                  src={src}
                  alt={`Gallery ${i}`}
                  preset={isLarge ? "galleryLarge" : "gallery"}
                  className={`w-full h-full object-cover ${reduced ? "" : "transition-transform duration-700 group-hover:scale-110"}`}
                  loading="lazy"
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent opacity-60 ${reduced ? "opacity-80" : "group-hover:opacity-90 transition-opacity duration-300"}`} />
                <div className="absolute top-3 left-3 rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80 backdrop-blur-md">
                  {String(i + 1).padStart(2, "0")}
                </div>
                
                {/* Ikon kamera hanya di foto pertama */}
                {i === 0 && (
                  <div className={`absolute bottom-4 left-4 right-4 ${reduced ? "opacity-100 translate-y-0" : "opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0"}`}>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-white backdrop-blur-md">
                      <Camera size={18} />
                      <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                        {t("home.galleryFeatured", { defaultValue: "Travel Highlight" })}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
          </div>
          )}
        
          {/* Tombol Mobile Instagram */}
          <div className="mt-8 text-center md:hidden">
           <a
              href="https://instagram.com/cidikatravel"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-900 shadow-lg"
            >
              <Instagram size={16} /> {t("home.followIg", { defaultValue: "Follow on Instagram" })}
            </a>
          </div>
        </div>
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
  const { t, i18n } = useTranslation();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [text, setText] = useState("");
  const [stars, setStars] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) {
      alert(
        t("home.testimonialRequired", {
          defaultValue: "Please fill in your name and testimonial.",
        })
      );
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        city,
        text,
        stars,
        lang: (i18n.resolvedLanguage || i18n.language || "id").split("-")[0],
      });
      setName(""); setCity(""); setText(""); setStars(5);
      alert(
        t("home.testimonialSubmitted", {
          defaultValue: "Thank you, your review has been submitted.",
        })
      );
    } catch (error) {
      alert(
        t("home.testimonialFailed", {
          defaultValue: "Failed to submit your review.",
        })
      );
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
      <p className="text-center text-slate-500 text-xs mb-5">
        {t("home.helpImprove", {
          defaultValue: "Help us improve by leaving a review!",
        })}
      </p>
      
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
          {isSubmitting ? t("home.sending") : <> {t("home.submit", { defaultValue: "Send Review" })} <Send size={16}/></>}
        </button>
      </form>
    </div>
  );
}

function Testimonials({ title, allItems = [] }) {
  const { i18n } = useTranslation();
  const reduced = usePrefersReducedMotion();
  const lang = (i18n.resolvedLanguage || i18n.language || "id").split("-")[0];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleNext = useCallback(() => {
    if (!allItems.length) return;
    setCurrentIndex((prev) => (prev + 1) % allItems.length);
  }, [allItems.length]);

  const handlePrev = useCallback(() => {
    if (!allItems.length) return;
    setCurrentIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
  }, [allItems.length]);

  useEffect(() => {
    if (reduced || allItems.length <= 1 || isHovered) return;
    const interval = setInterval(handleNext, 6000);
    return () => clearInterval(interval);
  }, [reduced, allItems.length, handleNext, isHovered]);

  const handleTestimonialSubmit = async (testimonial) => {
    const { error } = await supabase.from("testimonials").insert([{ ...testimonial, is_approved: false }]);
    if (error) throw error;
  };

  if (!allItems.length) return null;

  return (
    <section className="container mt-20 md:mt-24">
      <motion.div
        initial={reduced ? false : "hidden"}
        whileInView={reduced ? undefined : "visible"}
        viewport={{ once: true, amount: 0.1 }} 
        variants={reduced ? undefined : staggerContainer}
      >
        {title && (
          <motion.h2 variants={reduced ? undefined : bouncyUp} className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white text-center mb-8 md:mb-12 px-4">
            {title}
          </motion.h2>
        )}

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start px-4 md:px-0">
          <div 
            className="relative w-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="relative min-h-[280px] w-full sm:min-h-[300px] md:min-h-[320px]">
              <AnimatePresence mode={reduced ? "sync" : "wait"}>
                <motion.div
                  key={currentIndex}
                  initial={reduced ? false : { opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduced ? undefined : { opacity: 0, x: -30 }}
                  transition={reduced ? { duration: 0.01 } : { type: "spring", stiffness: 300, damping: 30 }}
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
          className="fixed bottom-6 right-6 z-30 hidden lg:block"
        >
          <a
            href="https://wa.me/62895630193926"
            target="_blank"
            rel="noreferrer"
            className="btn btn-wa flex items-center gap-2 rounded-full px-5 py-3 font-bold text-sm shadow-xl hover:scale-105"
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
  const { rows: packages = [], loading: packagesLoading } = usePackages();
  const { fx, currency, locale } = useCurrency();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { sections: homeSections, loading: homeSectionsLoading } = usePageSections("home");
  const { sections: destSections, loading: destSectionsLoading } = usePageSections("destinations");
  const contentLoading = packagesLoading || homeSectionsLoading || destSectionsLoading;
  const S = useMemo(() => Object.fromEntries((homeSections || []).map(s => [s.section_key, s])), [homeSections]);

  const onQuickSearch = (q) => navigate(`/explore?tag=${encodeURIComponent(q)}`);

  const heroImages = Array.isArray(S.hero?.data?.images) && S.hero.data.images.length
    ? S.hero.data.images
    : FALLBACK_HERO_IMAGES;
  const heroTitle = S.hero?.locale?.body_md || "";
  const heroDesc = S.hero?.locale?.extra?.desc || "";
  const heroSub = S.hero?.locale?.title || "";
  const heroCTA = S.hero?.locale?.extra?.cta_contact_label || "";
  const heroChips = Array.isArray(S.hero?.data?.chips) ? S.hero.data.chips : [];

  const galleryManualImages = Array.isArray(S.gallery?.data?.images) ? S.gallery.data.images : [];

  // Featured destinations (dari page_sections destinations page)
  const featuredDestinations = useMemo(() => {
    const dests = (destSections || [])
      .filter(s => !['intro'].includes(s.section_key))
      .map(s => ({
        id: s.id,
        key: s.section_key,
        title: s.locale?.title || s.section_key,
        description: s.locale?.body_md || "",
        image: Array.isArray(s.data?.images) && s.data.images[0] ? s.data.images[0] : "/23.jpg"
      }));
    
    // Pastikan ada minimal 2 destinasi (tambahkan Nusa Penida jika perlu)
    if (dests.length < 2) {
      dests.push({
        id: "nusa-penida-fallback",
        key: "nusa-penida",
        title: "Nusa Penida",
        description: "Pulau dengan pantai dan tebing ikonik di Bali Tenggara, terkenal dengan Kelingking Beach dan pemandangan spektakuler.",
        image: "/23.jpg"
      });
    }
    
    return dests.slice(0, 2);
  }, [destSections]);

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
      <FeaturedDestinationsSection items={featuredDestinations} loading={destSectionsLoading} />
      <PopularPackages
        heading={S.popular?.locale?.title || t("home.popular")}
        subheading={S.popular?.locale?.body_md || t("home.popularSub")}
        data={packages}
        currency={currency}
        fx={fx}
        locale={locale}
        loading={packagesLoading}
      />
      <HowItWorks
        title={S.how?.locale?.title || t("home.howTitle")}
        subtitle={S.how?.locale?.body_md || t("home.howSubtitle")}
        steps={S.how?.locale?.extra?.steps || []}
      />
      <GallerySection
        title={S.gallery?.locale?.title || t("home.galleryDefaultTitle", { defaultValue: "Our Gallery" })}
        subtitle={S.gallery?.locale?.body_md || t("home.galleryDefaultSub", { defaultValue: "Moments captured from our travelers." })}
        packages={packages}
        manualImages={galleryManualImages}
        loading={contentLoading && galleryManualImages.length === 0}
      />
      <Testimonials
        title={S.testimonials?.locale?.title || t("home.testimonialsTitle")}
        allItems={allTestimonials}
      />
      <StickyHelpCTA />
    </>
  );
}
