// src/pages/Home.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Calendar, Users, BadgeCheck,
  MessageCircle, Star, ChevronRight, ArrowRight,
  Search, Phone,
} from "lucide-react";
import usePackages from "../hooks/usePackages";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";
import usePageSections from "../hooks/usePageSections";
import { supabase } from "../lib/supabaseClient";

/* ================== Fallback assets (jika DB kosong) ================== */
const FALLBACK_HERO_IMAGES = ["/hero1.jpg","/hero2.jpg","/hero3.jpg","/hero4.jpg","/hero5.jpg","/hero6.jpg"];

function usePreload(images){ useEffect(()=>{ images?.forEach(src=>{ const img=new Image(); img.src=src; }); },[images]); }
function usePrefersReducedMotion(){
  const [reduced, setReduced] = useState(false);
  useEffect(()=>{ const m = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if(!m) return; setReduced(!!m.matches); const c=()=>setReduced(!!m.matches);
    m.addEventListener?.("change", c); return ()=>m.removeEventListener?.("change", c);
  },[]);
  return reduced;
}
function normalizeUrl(raw){
  if(!raw) return "";
  if(/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith("/") ? raw : `/${raw}`;
}
function getPkgImage(p){
  const raw = p?.default_image || p?.cover_url || p?.thumbnail || p?.thumb_url || p?.image_url ||
    (Array.isArray(p?.images)&&p.images[0]) || (p?.data?.images && p.data.images[0]) || "";
  const url = normalizeUrl(raw);
  return url || "/23.jpg";
}
const reveal = { hidden:{opacity:0,y:14}, show:{opacity:1,y:0,transition:{duration:.55,ease:"easeOut"}} };
const stagger = { hidden:{}, show:{ transition:{ staggerChildren:.08, delayChildren:.05 } } };

/** SpotlightOverlay — glow mengikuti pointer */
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
        background:
          "radial-gradient(600px circle at var(--spot-x,50%) var(--spot-y,50%), rgba(56,189,248,.25), transparent 45%)",
        mixBlendMode: "screen",
      }}
    />
  );
}
function ShimmerButton({ as:Comp="a", className="", children, ...props }){
  return (
    <Comp {...props} className={`relative overflow-hidden group btn btn-outline glass ${className}`}>
      <span className="relative z-10">{children}</span>
      <motion.span
        aria-hidden initial={{ x: "-120%" }} animate={{ x: "120%" }}
        transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
        className="absolute inset-y-0 -left-1 w-40 rotate-12 opacity-40"
        style={{ background:"linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent)" }}
      />
    </Comp>
  );
}
function Marquee({ speed = 24, className = "", children }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div className="flex gap-2 will-change-transform"
        initial={{ x: 0 }} animate={{ x: "-50%" }}
        transition={{ repeat: Infinity, ease: "linear", duration: speed }}>
        <div className="flex gap-2">{children}</div>
        <div className="flex gap-2" aria-hidden>{children}</div>
      </motion.div>
    </div>
  );
}
function TiltCard({ children, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const on = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const py = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      el.style.transform = `rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateZ(0)`;
    };
    const off = () => { el.style.transform = "rotateX(0deg) rotateY(0deg)"; };
    el.addEventListener("mousemove", on); el.addEventListener("mouseleave", off);
    return () => { el.removeEventListener("mousemove", on); el.removeEventListener("mouseleave", off); };
  }, []);
  return <div ref={ref} className={`transition-transform duration-200 [transform-style:preserve-3d] ${className}`}>{children}</div>;
}
function HoverBorderGradient({ children, className = "" }) {
  return (
    <div className={`relative rounded-2xl p-[1px] bg-gradient-to-r from-sky-400/40 via-indigo-400/40 to-sky-400/40 hover:from-sky-400 hover:via-indigo-400 hover:to-sky-400 transition-colors ${className}`}>
      <div className="rounded-[15px] bg-white/90 dark:bg-slate-900/90">{children}</div>
    </div>
  );
}
function Timeline({ steps=[] }) {
  return (
    <ol className="relative border-l border-slate-200 dark:border-slate-700 pl-5">
      {steps.map((s,i)=>(
        <li key={i} className="mb-6 last:mb-0">
          <span className="absolute -left-[11px] mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-[11px] font-bold">{i+1}</span>
          <div className="font-semibold">{s.title}</div>
          <div className="text-sm text-slate-600 dark:text-slate-300">{s.text}</div>
        </li>
      ))}
    </ol>
  );
}
function AuroraBeams({ className="" }){
  return (
    <div className={`absolute inset-0 -z-10 overflow-hidden rounded-2xl ${className}`}>
      <motion.div className="absolute -inset-[30%] opacity-60 blur-2xl"
        initial={{ backgroundPosition: "0% 50%" }} animate={{ backgroundPosition: "100% 50%" }}
        transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
        style={{
          backgroundImage:
            "radial-gradient(40% 30% at 20% 20%, rgba(56,189,248,.20), transparent 60%), radial-gradient(40% 30% at 80% 30%, rgba(99,102,241,.22), transparent 60%), radial-gradient(50% 40% at 40% 80%, rgba(14,165,233,.18), transparent 60%)",
          backgroundSize: "200% 200%",
        }}
      />
    </div>
  );
}

/* ================== HERO BARU: Lebih Profesional, Unik & React-Centric ================== */
function Hero({ images=[], subtitle, title, desc, chips=[], onSearch, ctaContactLabel }) {
  const reduced = usePrefersReducedMotion();
  const [idx, setIdx] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const par = useRef(null);
  const textRef = useRef(null);

  usePreload(images);
  useEffect(()=>{ if(reduced||images.length<=1) return;
    const id=setInterval(()=>setIdx(i=>(i+1)%images.length), 5200);
    return ()=>clearInterval(id);
  },[reduced, images.length]);

  // Enhanced parallax dengan React state untuk mouse tracking
  useEffect(()=>{
    const handleMouseMove = (e) => {
      if (!par.current) return;
      const r = par.current.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      setMousePos({ x: x * 20, y: y * 20 }); // Scale untuk efek lebih halus
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  },[]);

  // Floating particles untuk unik & modern (React-managed)
  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    opacity: Math.random() * 0.5 + 0.2,
    delay: Math.random() * 20,
  })), []);

  const particleVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (i) => ({
      opacity: [0.2, 0.8, 0.2],
      scale: [1, 1.2, 1],
      x: [0, Math.sin(i) * 10, 0],
      y: [0, Math.cos(i) * 10, 0],
      transition: {
        duration: 4 + Math.random() * 4,
        repeat: Infinity,
        delay: i * 0.1 + Math.random() * 2,
        ease: "easeInOut",
      },
    }),
  };

  // Staggered text reveal untuk profesional animasi
  const textContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const lineVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section ref={par} className="relative h-[78vh] md:h-[88vh] overflow-hidden grain">
      {images.map((raw,i)=> {
        const src = normalizeUrl(raw);
        return (
          <motion.img 
            key={src||i} 
            src={src} 
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ${i===idx?"opacity-100 kenburns":"opacity-0"}`}
            style={{ 
              transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0) scale(1.02)` // Parallax dengan state
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: i === idx ? 1 : 0 }}
            transition={{ duration: 1.2 }}
            loading={i===0?"eager":"lazy"} 
            fetchpriority={i===0?"high":"auto"} 
          />
        );
      })}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/20 to-white/75 dark:to-slate-950/85" />
      <SpotlightOverlay />

      {/* Floating Particles untuk efek unik */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {particles.map((particle, i) => (
            <motion.div
              key={particle.id}
              className="absolute bg-white/20 rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
              }}
              variants={particleVariants}
              initial="hidden"
              animate="visible"
              custom={i}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="relative z-10 container h-full flex flex-col justify-center items-center text-center px-4">
        {/* Subtitle dengan shimmer effect */}
        {subtitle && (
          <motion.p 
            variants={lineVariants}
            initial="hidden" 
            animate="visible"
            className="tracking-[0.28em] text-xs md:text-sm text-white/80 mb-4 relative overflow-hidden"
          >
            <span className="relative z-10">{subtitle}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full animate-shimmer" />
          </motion.p>
        )}

        {/* Title dengan split text animation */}
        {title && (
          <motion.div 
            ref={textRef}
            variants={textContainerVariants}
            initial="hidden" 
            animate="visible"
            className="mt-2 font-extrabold text-white leading-[1.05] text-4xl md:text-6xl drop-shadow-[0_8px_24px_rgba(0,0,0,.35)]"
            style={{ fontFamily:'var(--font-hero, "Cinzel", "EB Garamond", ui-serif, Georgia, serif)', letterSpacing:".01em" }}
          >
            {title.split(' ').map((word, i) => (
              <motion.span
                key={i}
                variants={lineVariants}
                custom={i}
                className="inline-block"
                style={{ display: 'inline-block' }}
              >
                {word}&nbsp;
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Desc dengan fade-in staggered lines */}
        {desc && (
          <motion.div 
            variants={textContainerVariants}
            initial="hidden" 
            animate="visible"
            className="mt-4 max-w-2xl mx-auto text-[15px] md:text-base leading-relaxed text-white/90"
          >
            {desc.split('\n').map((line, i) => (
              <motion.p 
                key={i}
                variants={lineVariants}
                className="mb-2"
              >
                {line}
              </motion.p>
            ))}
          </motion.div>
        )}

        {/* CTA dengan enhanced hover */}
        {ctaContactLabel && (
          <motion.div 
            variants={lineVariants}
            initial="hidden" 
            animate="visible"
            className="mt-6 flex justify-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <ShimmerButton as={Link} to="/contact" className="!px-8 !py-3 text-lg">
              {ctaContactLabel}
            </ShimmerButton>
          </motion.div>
        )}

        {/* Chips marquee dengan enhanced animation */}
        {!!chips?.length && (
          <motion.div 
            variants={stagger} 
            initial="hidden" 
            animate="visible"
            className="mt-8 w-full"
          >
            <Marquee speed={20} className="max-w-4xl mx-auto">
              {chips.map((c,i)=>(
                <motion.button 
                  key={i} 
                  onClick={()=>onSearch?.(c.q)} 
                  className="btn glass !py-3 !px-4 text-sm flex items-center gap-2 group"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Search size={14} className="mr-1.5" /> 
                  <span>{c.label}</span>
                  <motion.div 
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-400/20 to-indigo-400/20 -z-10"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>
              ))}
            </Marquee>
          </motion.div>
        )}
      </div>
    </section>
  );
}

/* ================== (SECTIONS LAINNYA) ================== */

function FeatureCard({ iconName, title, text }) {
  const Icon = { "badge-check":BadgeCheck, "users":Users, "calendar":Calendar, "map-pin":MapPin }[iconName] || BadgeCheck;
  return (
    <div className="card p-4 hover-lift">
      <div className="flex items-start gap-3 relative">
        <div className="shrink-0 p-2 rounded-xl bg-slate-100 dark:bg-slate-800"><Icon className="text-sky-500" size={18}/></div>
        <div><div className="font-semibold">{title}</div><p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{text}</p></div>
      </div>
    </div>
  );
}
function WhyUs({ title, subtitle, items=[] }) {
  return (
    <section className="container mt-16">
      {(title||subtitle) && (
        <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once:true }}>
          {title && <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>}
          {subtitle && <p className="text-slate-600 dark:text-slate-300 mt-1">{subtitle}</p>}
        </motion.div>
      )}
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once:true, amount:.3 }}
        className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((it,i)=>(
          <motion.div key={i} variants={reveal}><FeatureCard iconName={it.icon || "badge-check"} title={it.title} text={it.text}/></motion.div>
        ))}
      </motion.div>
    </section>
  );
}
function useCountUp({ from=0, to=100, duration=1200, start=false }){
  const [v,setV]=useState(from); const r=useRef();
  useEffect(()=>{ if(!start) return; const t0=performance.now();
    const step=(t)=>{ const p=Math.min(1,(t-t0)/duration); setV(Math.round(from+(to-from)*p)); if(p<1) r.current=requestAnimationFrame(step); };
    r.current=requestAnimationFrame(step); return ()=>cancelAnimationFrame(r.current);
  },[from,to,duration,start]); return v;
}
function Stats({ trips=0, photos=0, rating=4.9 }) {
  const { t } = useTranslation(); const [start,setStart]=useState(false); const ref=useRef(null);
  useEffect(()=>{ const io=new IntersectionObserver((es)=>es.forEach(e=>e.isIntersecting&&setStart(true)),{threshold:.4});
    if(ref.current) io.observe(ref.current); return ()=>io.disconnect(); },[]);
  const tv=useCountUp({ to:trips,  duration:1200, start });
  const pv=useCountUp({ to:photos, duration:1400, start });
  const rv=useCountUp({ to:Math.round(rating*10), duration:900, start });
  return (
    <section ref={ref} className="container mt-14">
      <div className="card p-5 md:p-7">
        <div className="grid sm:grid-cols-3 gap-4 text-center">
          <div><div className="text-3xl font-extrabold">{tv.toLocaleString()}+</div><div className="text-sm text-slate-500">{t("home.stats.travelers", { defaultValue: "Traveler puas" })}</div></div>
          <div><div className="text-3xl font-extrabold">{pv.toLocaleString()}+</div><div className="text-sm text-slate-500">{t("home.stats.media", { defaultValue: "Foto & video" })}</div></div>
          <div><div className="text-3xl font-extrabold flex items-center justify-center">{(rv/10).toFixed(1)} <Star size={18} className="ml-1 text-amber-500"/></div><div className="text-sm text-slate-500">{t("home.stats.rating", { defaultValue: "Rating" })}</div></div>
        </div>
      </div>
    </section>
  );
}
function PopularCard({ pkg, price, pax, currency, fx, locale }) {
  const navigate = useNavigate(); const { t } = useTranslation();
  const cover = getPkgImage(pkg); const title = pkg?.locale?.title || pkg.slug || "Open Trip";
  const spots = (pkg?.locale?.spots || []).slice(0,4).join(" • ");
  const priceLabel = formatMoneyFromIDR(price, currency, fx, locale);
  return (
    <TiltCard>
      <HoverBorderGradient>
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
          <div className="relative aspect-[16/10] overflow-hidden">
            <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-[1.06]" loading="lazy"/>
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute left-3 bottom-3 right-3 text-white drop-shadow">
              <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
              <p className="text-[13px] opacity-90 line-clamp-1">{spots}</p>
            </div>
          </div>
          <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="text-sky-700 dark:text-sky-300 font-extrabold">
                {priceLabel} <span className="text-sm font-normal text-slate-600 dark:text-slate-400">/ {t("home.perPax", { defaultValue: "pax" })}</span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={14}/> {t("home.flexible", { defaultValue: "Flexible" })}</div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn glass" onClick={()=>navigate(`/explore?pkg=${pkg.id}`, { state:{ openId:pkg.id, pax } })}>
                {t("home.viewDetails", { defaultValue: "Lihat Detail" })} <ChevronRight size={16} className="ml-1"/>
              </button>
              <a href={`https://wa.me/6289523949667?text=Halo%20Admin,%20saya%20minat%20paket%20${encodeURIComponent(title)}%20untuk%20${pax}%20${t("home.pax", { defaultValue: "pax" })}`}
                 target="_blank" rel="noreferrer" className="btn btn-primary glass">
                {t("home.orderViaWA", { defaultValue: "Pesan via WA" })} <ArrowRight size={16} className="ml-1"/>
              </a>
            </div>
          </div>
        </div>
      </HoverBorderGradient>
    </TiltCard>
  );
}
function PopularPackages({ heading, subheading, data, currency, fx, locale }) {
  const { t } = useTranslation(); const [pax,setPax]=useState(1);
  const items = useMemo(()=>{
    const priced=(data||[]).map(p=>{
      const tTier=(p.price_tiers||[]).find(x=>x.pax===pax)||(p.price_tiers||[])[0];
      return { p, price:tTier?.price_idr||0 };
    });
    return priced.sort((a,b)=>a.price-b.price).slice(0,6);
  },[data,pax]);
  return (
    <section id="popular" className="container mt-16">
      <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{once:true}}>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{heading || t("home.popular", { defaultValue: "Paket Populer" })}</h2>
            {subheading && <p className="text-slate-600 dark:text-slate-300 mt-1">{subheading}</p>}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="pax" className="text-sm text-slate-500">{t("home.calcFor", { defaultValue: "Hitung harga untuk" })}</label>
            <select id="pax" value={pax} onChange={(e)=>setPax(parseInt(e.target.value))} className="px-3 py-2 rounded-2xl">
              {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} {t("home.pax", { defaultValue: "pax" })}</option>)}
            </select>
          </div>
        </div>
      </motion.div>
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once:true, amount:.2 }}
        className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(({p,price})=>(
          <motion.div key={p.id} variants={reveal}><PopularCard pkg={p} price={price} pax={pax} currency={currency} fx={fx} locale={locale}/></motion.div>
        ))}
      </motion.div>
      <div className="mt-5 text-right">
        <Link to="/explore" className="inline-flex items-center gap-2 text-sky-600 dark:text-sky-300 hover:underline">
          {t("home.viewAllPackages", { defaultValue: "Lihat semua paket" })} <ChevronRight size={16}/>
        </Link>
      </div>
    </section>
  );
}
function HowItWorks({ title, subtitle, steps=[] }) {
  const fallback = [
    { icon:"search",       title:"Pilih Paket",  text:"Bandingkan & sesuaikan pax." },
    { icon:"message",      title:"Chat Admin",  text:"Klik WhatsApp, kami balas cepat." },
    { icon:"calendar",     title:"Atur Jadwal", text:"Tentukan tanggal & meeting point." },
    { icon:"badge-check",  title:"Berangkat!",  text:"Nikmati trip." },
  ];
  const list = steps.length ? steps : fallback;
  return (
    <section className="container mt-16">
      {(title||subtitle) && (
        <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once:true }}>
          {title && <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>}
          {subtitle && <p className="text-slate-600 dark:text-slate-300 mt-1">{subtitle}</p>}
        </motion.div>
      )}
      <div className="mt-6 card p-5"><Timeline steps={list}/></div>
    </section>
  );
}
function Testimonials({ title, allItems=[] }) {
  const { i18n } = useTranslation();
  const lang = i18n.language.slice(0,2);
  if(!allItems.length) return null;
  const getStars = (n)=> {
    const s = Math.max(1, Math.min(5, Number(n||5)));
    return Array.from({length:s}, (_,i)=><Star key={i} size={16} className="text-amber-500" />);
  };
  return (
    <section className="container mt-16">
      {title && <motion.h2 variants={reveal} initial="hidden" whileInView="show" viewport={{ once:true }} className="text-2xl md:text-3xl font-bold mb-6 text-center">{title}</motion.h2>}
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once:true, amount: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allItems.map((tItem,i)=>(
          <motion.div key={i} variants={reveal}>
            <div className="card p-6 hover-lift shadow-smooth flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                {getStars(tItem.stars)}
              </div>
              <p className="text-slate-700 dark:text-slate-200 flex-grow mb-4">{tItem.text}</p>
              {lang !== tItem.lang && (
                <a href={`https://translate.google.com/?sl=${tItem.lang}&tl=${lang}&text=${encodeURIComponent(tItem.text)}&op=translate`} target="_blank" rel="noreferrer" className="text-xs text-sky-600 hover:underline mb-2 block">
                  Translate to {lang.toUpperCase()}
                </a>
              )}
              <footer className="text-sm text-slate-500 mt-auto">— {tItem.name}{tItem.city ? `, ${tItem.city}` : ""}</footer>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
function BigCTA({ title, desc, whatsapp="+6289523949667" }) {
  const { t } = useTranslation();
  return (
    <section className="container mt-16 mb-20">
      <div className="relative card p-6 md:p-8 overflow-hidden">
        <AuroraBeams />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="flex-1">
            {title && <h3 className="text-xl md:text-2xl font-bold">{title}</h3>}
            {desc && <p className="text-slate-600 dark:text-slate-300">{desc}</p>}
          </div>
          <div className="flex gap-3">
            <a href={`https://wa.me/${whatsapp.replace(/\D/g,"")}`} className="btn btn-primary glass" target="_blank" rel="noreferrer">
              <Phone size={16} className="mr-1" /> WhatsApp
            </a>
            <Link to="/explore" className="btn btn-outline glass">
              {t("home.viewAllPackages", { defaultValue: "Lihat Semua Paket" })}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
function StickyHelpCTA() {
  const { t } = useTranslation(); const [show,setShow]=useState(false);
  useEffect(()=>{ const on=()=>setShow((window.scrollY||0)>520); window.addEventListener("scroll",on,{passive:true}); on(); return ()=>window.removeEventListener("scroll",on); },[]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{y:40,opacity:0}} animate={{y:0,opacity:1}} exit={{y:40,opacity:0}}
          transition={{type:"spring",stiffness:320,damping:26}} className="fixed bottom-4 inset-x-0 z-30">
          <div className="container">
            <a href="https://wa.me/6289523949667" target="_blank" rel="noreferrer" className="w-full sm:w-auto btn btn-primary glass flex items-center gap-2 shadow-smooth">
              <MessageCircle size={16}/> {t("home.helpCTA", { defaultValue: "Butuh bantuan? Chat WhatsApp" })}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Home(){
  const { rows:packages=[] } = usePackages();
  const { fx, currency, locale } = useCurrency();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { sections } = usePageSections("home");
  const S = useMemo(()=>Object.fromEntries((sections||[]).map(s=>[s.section_key,s])),[sections]);

  const onQuickSearch = (q)=> navigate(`/explore?tag=${encodeURIComponent(q)}`);

  // Ambil gambar HERO dari DB, fallback lokal
  const heroImages = Array.isArray(S.hero?.data?.images) && S.hero.data.images.length
    ? S.hero.data.images
    : FALLBACK_HERO_IMAGES;

  const heroTitle = S.hero?.locale?.body_md || "";
  const heroDesc  = S.hero?.locale?.extra?.desc || "";
  const heroSub   = S.hero?.locale?.title || "";
  const heroCTA   = S.hero?.locale?.extra?.cta_contact_label || "";
  const heroChips = Array.isArray(S.hero?.data?.chips) ? S.hero.data.chips : [];

  // Fetch semua testimonials dari semua bahasa
  const [allTestimonials, setAllTestimonials] = useState([]);
  useEffect(() => {
    const fetchAllTestimonials = async () => {
      const testimonialsSectionId = S.testimonials?.id;
      if (!testimonialsSectionId) return;

      const { data, error } = await supabase
        .from("page_section_locales")
        .select("lang, extra")
        .eq("section_id", testimonialsSectionId);

      if (error) {
        console.error("Error fetching testimonials:", error);
        return;
      }

      const combinedItems = data.flatMap(({ lang, extra }) => 
        (extra?.items || []).map(item => ({ ...item, lang }))
      );

      setAllTestimonials(combinedItems);
    };

    fetchAllTestimonials();
  }, [S.testimonials?.id]);

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
          { icon:"badge-check", title:t("home.whyItems.0.title", { defaultValue:"Operator Resmi & Berpengalaman" }), text:t("home.whyItems.0.text", { defaultValue:"Tim lokal paham spot & timing terbaik." }) },
          { icon:"users",       title:t("home.whyItems.1.title", { defaultValue:"Cocok untuk Semua" }),             text:t("home.whyItems.1.text", { defaultValue:"Solo, couple, family, rombongan kantor." }) },
          { icon:"calendar",    title:t("home.whyItems.2.title", { defaultValue:"Jadwal Fleksibel" }),              text:t("home.whyItems.2.text", { defaultValue:"Private charter / open trip." }) },
          { icon:"map-pin",     title:t("home.whyItems.3.title", { defaultValue:"Itinerary Optimal" }),             text:t("home.whyItems.3.text", { defaultValue:"Efisien, tetap dapat momen terbaik." }) },
        ]}
      />

      <Stats
        trips={Number(S.stats?.data?.trips)||1200}
        photos={Number(S.stats?.data?.photos)||4800}
        rating={Number(S.stats?.data?.rating)||4.9}
      />

      <PopularPackages
        heading={S.popular?.locale?.title || t("home.popular", { defaultValue: "Paket Populer" })}
        subheading={S.popular?.locale?.body_md || t("home.popularSub", { defaultValue: "Pilihan terbaik wisatawan." })}
        data={packages} currency={currency} fx={fx} locale={locale}
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