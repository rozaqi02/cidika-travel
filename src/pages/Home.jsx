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

/* ================== Konstanta gambar lokal (bukan dari DB) ================== */
const HERO_IMAGES_LOCAL = [
  "/hero1.jpg",
  "/hero2.jpg",
  "/hero3.jpg",
  "/hero4.jpg",
  "/hero5.jpg",
  "/hero6.jpg",
];

/* ================== Utils kecil ================== */
function usePreload(images){ useEffect(()=>{ images?.forEach(src=>{ const img=new Image(); img.src=src; }); },[images]); }
function usePrefersReducedMotion(){
  const [reduced, setReduced] = useState(false);
  useEffect(()=>{ const m = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if(!m) return; setReduced(!!m.matches); const c=()=>setReduced(!!m.matches);
    m.addEventListener?.("change", c); return ()=>m.removeEventListener?.("change", c);
  },[]);
  return reduced;
}
function getPkgImage(p){
  const raw = p?.default_image || p?.cover_url || p?.thumbnail || p?.thumb_url || p?.image_url ||
    (Array.isArray(p?.images)&&p.images[0]) || (p?.data?.images && p.data.images[0]) || "";
  if(!raw) return "/23.jpg";
  if(/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith("/") ? raw : `/${raw}`;
}
const reveal = { hidden:{opacity:0,y:14}, show:{opacity:1,y:0,transition:{duration:.55,ease:"easeOut"}} };
const stagger = { hidden:{}, show:{ transition:{ staggerChildren:.08, delayChildren:.05 } } };

/* ================== HERO (gambar lokal + teks i18n) ================== */
function Hero({ images=[], title, subtitle, desc, chips=[], onSearch, ctaPopularLabel, ctaContactLabel }) {
  const reduced = usePrefersReducedMotion();
  const [idx, setIdx] = useState(0);
  usePreload(images);
  useEffect(()=>{ if(reduced||images.length<=1) return;
    const id=setInterval(()=>setIdx(i=>(i+1)%images.length), 5200);
    return ()=>clearInterval(id);
  },[reduced, images.length]);

  return (
    <section className="relative h-[78vh] md:h-[88vh] overflow-hidden grain">
      {/* bg slideshow (lokal) */}
      {images.map((src,i)=>(
        <img key={src} src={src} alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ${i===idx?"opacity-100 kenburns":"opacity-0"}`}
          loading={i===0?"eager":"lazy"} fetchpriority={i===0?"high":"auto"} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/20 to-white/75 dark:to-slate-950/85" />
      {/* copy */}
      <div className="relative z-10 container h-full flex flex-col justify-center">
        {subtitle && (
          <motion.p variants={reveal} initial="hidden" animate="show" className="tracking-[0.28em] text-xs md:text-sm text-white/80">
            {subtitle}
          </motion.p>
        )}
        {title && (
          <motion.h1 variants={reveal} initial="hidden" animate="show"
            className="mt-2 font-extrabold text-white leading-[1.05] text-4xl md:text-6xl drop-shadow-[0_8px_24px_rgba(0,0,0,.35)]">
            {title}
          </motion.h1>
        )}
        {desc && (
          <motion.p variants={reveal} initial="hidden" animate="show" className="mt-3 max-w-xl text-white/90">
            {desc}
          </motion.p>
        )}
        {/* chips */}
        {chips?.length>0 && (
          <motion.div variants={stagger} initial="hidden" animate="show" className="mt-6 flex flex-wrap items-center gap-2">
            {chips.map((c,i)=>(
              <motion.button key={i} variants={reveal} onClick={()=>onSearch?.(c.q)} className="btn glass !py-2 !px-3 text-sm">
                <Search size={14} className="mr-1.5" /> {c.label}
              </motion.button>
            ))}
          </motion.div>
        )}
        <motion.div variants={reveal} initial="hidden" animate="show" className="mt-5 flex gap-3">
          <a href="#popular" className="btn btn-primary glass">{ctaPopularLabel}</a>
          <Link to="/contact" className="btn btn-outline glass">{ctaContactLabel}</Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ================== WHY US / FEATURES ================== */
function FeatureCard({ iconName, title, text }) {
  const Icon = { "badge-check":BadgeCheck, "users":Users, "calendar":Calendar, "map-pin":MapPin }[iconName] || BadgeCheck;
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3 relative">
        <div className="shrink-0 p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
          <Icon className="text-sky-500" size={18}/>
        </div>
        <div>
          <div className="font-semibold">{title}</div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{text}</p>
        </div>
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
          <motion.div key={i} variants={reveal}>
            <FeatureCard iconName={it.icon || "badge-check"} title={it.title} text={it.text}/>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* ================== STATS ================== */
function useCountUp({ from=0, to=100, duration=1200, start=false }){
  const [v,setV]=useState(from); const r=useRef();
  useEffect(()=>{ if(!start) return; const t0=performance.now();
    const step=(t)=>{ const p=Math.min(1,(t-t0)/duration); setV(Math.round(from+(to-from)*p)); if(p<1) r.current=requestAnimationFrame(step); };
    r.current=requestAnimationFrame(step); return ()=>cancelAnimationFrame(r.current);
  },[from,to,duration,start]);
  return v;
}
function Stats({ trips=0, photos=0, rating=4.9 }) {
  const { t } = useTranslation();
  const [start,setStart]=useState(false); const ref=useRef(null);
  useEffect(()=>{ const io=new IntersectionObserver((es)=>es.forEach(e=>e.isIntersecting&&setStart(true)),{threshold:.4});
    if(ref.current) io.observe(ref.current); return ()=>io.disconnect();
  },[]);
  const tv=useCountUp({ to:trips,  duration:1200, start });
  const pv=useCountUp({ to:photos, duration:1400, start });
  const rv=useCountUp({ to:Math.round(rating*10), duration:900, start }); // 49 → 4.9
  return (
    <section ref={ref} className="container mt-14">
      <div className="card p-5 md:p-7">
        <div className="grid sm:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-extrabold">{tv.toLocaleString()}+</div>
            <div className="text-sm text-slate-500">{t("home.stats.travelers", { defaultValue: "Traveler puas" })}</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold">{pv.toLocaleString()}+</div>
            <div className="text-sm text-slate-500">{t("home.stats.media", { defaultValue: "Foto & video" })}</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold flex items-center justify-center">
              {(rv/10).toFixed(1)} <Star size={18} className="ml-1 text-amber-500"/>
            </div>
            <div className="text-sm text-slate-500">{t("home.stats.rating", { defaultValue: "Rating" })}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================== Popular (paket dari DB paket) ================== */
function PopularCard({ pkg, price, pax, currency, fx, locale }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const cover = getPkgImage(pkg);
  const title = pkg?.locale?.title || pkg.slug || "Open Trip";
  const spots = (pkg?.locale?.spots || []).slice(0,4).join(" • ");
  const priceLabel = formatMoneyFromIDR(price, currency, fx, locale);
  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-smooth overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-[1.04]" loading="lazy"/>
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/65 to-transparent" />
        <div className="absolute left-3 bottom-3 right-3 text-white drop-shadow">
          <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
          <p className="text-[13px] opacity-90 line-clamp-1">{spots}</p>
        </div>
      </div>
      <div className="p-4">
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
          <a
            href={`https://wa.me/6289523949667?text=Halo%20Admin,%20saya%20minat%20paket%20${encodeURIComponent(title)}%20untuk%20${pax}%20${t("home.pax", { defaultValue: "pax" })}`}
            target="_blank" rel="noreferrer" className="btn btn-primary glass"
          >
            {t("home.orderViaWA", { defaultValue: "Pesan via WA" })} <ArrowRight size={16} className="ml-1"/>
          </a>
        </div>
      </div>
    </div>
  );
}
function PopularPackages({ heading, subheading, data, currency, fx, locale }) {
  const { t } = useTranslation();
  const [pax,setPax]=useState(1);
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
          <motion.div key={p.id} variants={reveal}>
            <PopularCard pkg={p} price={price} pax={pax} currency={currency} fx={fx} locale={locale}/>
          </motion.div>
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

/* ================== How it works ================== */
function StepCard({ iconName, title, text }) {
  const Icon = { "search":Search, "message":MessageCircle, "calendar":Calendar, "badge-check":BadgeCheck }[iconName] || BadgeCheck;
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"><Icon size={18}/></div>
      <div><div className="font-semibold">{title}</div><p className="text-sm text-slate-600 dark:text-slate-300">{text}</p></div>
    </div>
  );
}
function HowItWorks({ title, subtitle, steps=[] }) {
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
        {steps.map((s,i)=>(
          <motion.div key={i} variants={reveal}><StepCard iconName={s.icon} title={s.title} text={s.text}/></motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* ================== Testimonials ================== */
function Testimonials({ title, items=[] }) {
  if(!items.length) return null;
  return (
    <section className="container mt-16">
      {title && <motion.h2 variants={reveal} initial="hidden" whileInView="show" viewport={{ once:true }} className="text-2xl md:text-3xl font-bold">{title}</motion.h2>}
      <div className="mt-4 overflow-x-auto snap-x">
        <div className="flex gap-4 min-w-max">
          {items.map((tItem,i)=>( // hindari shadowing 't'
            <motion.blockquote key={i} variants={reveal} initial="hidden" whileInView="show"
              viewport={{ once:true, amount:.3 }} className="snap-start w-[320px] card p-4">
              <div className="flex items-center gap-2 text-amber-500 mb-1">{[...Array(5)].map((_,s)=><Star key={s} size={16}/>)}</div>
              <p className="text-slate-700 dark:text-slate-200">{tItem.text}</p>
              <footer className="mt-3 text-sm text-slate-500">— {tItem.name}{tItem.city?`, ${tItem.city}`:""}</footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================== CTA besar ================== */
function BigCTA({ title, desc, whatsapp="+6289523949667" }) {
  const { t } = useTranslation();
  return (
    <section className="container mt-16 mb-20">
      <div className="card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-5 hover-lift">
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
    </section>
  );
}

/* ================== Sticky CTA ================== */
function StickyHelpCTA() {
  const { t } = useTranslation();
  const [show,setShow]=useState(false);
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

/* ================== HOME (bind semua section) ================== */
export default function Home(){
  const { rows:packages=[] } = usePackages();
  const { fx, currency, locale } = useCurrency();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Tetap ambil teks dari DB bila ada (locale mengikuti i18n), namun gambar hero dipaksa lokal
  const { sections } = usePageSections("home");
  const S = useMemo(()=>Object.fromEntries((sections||[]).map(s=>[s.section_key,s])),[sections]);

  const onQuickSearch = (q)=> navigate(`/explore?tag=${encodeURIComponent(q)}`);

  // Gambar hero: HANYA lokal
  const heroImages = HERO_IMAGES_LOCAL;

  // Chips: dari DB jika ada, jika tidak dari i18n list, jika tidak ada pakai default
  const heroChips =
    (Array.isArray(S.hero?.data?.chips) && S.hero.data.chips) ||
    t("hero.chips", { returnObjects: true, defaultValue: [] }) ||
    [{ label: t("home.quickChips.oneDay", { defaultValue: "One Day Trip" }), q: "one-day" }];

  return (
    <>
      <Hero
        images={heroImages}
        subtitle={S.hero?.locale?.title || t("hero.tag", { defaultValue: "BEST OFFERS" })}
        title={
          S.hero?.locale?.body_md?.split("\n")[0] ||
          `${t("hero.line1", { defaultValue: "Jelajahi Nusa Penida bersama" })} ${t("hero.line2", { defaultValue: "CIDIKA TRAVEL&TOUR" })}`
        }
        desc={S.hero?.locale?.extra?.desc || t("hero.desc", { defaultValue: "Agen perjalanan terpercaya untuk tour, snorkeling, dan lainnya." })}
        chips={heroChips}
        onSearch={onQuickSearch}
        ctaPopularLabel={t("home.ctaPopular", { defaultValue: "Lihat Paket Populer" })}
        ctaContactLabel={t("hero.ctaContact", { defaultValue: "Hubungi Kami" })}
      />

      <WhyUs
        title={S.whyus?.locale?.title || t("home.whyTitle", { defaultValue: "Kenapa pilih kami?" })}
        subtitle={S.whyus?.locale?.body_md || t("home.whySubtitle", { defaultValue: "Keunggulan yang bikin trip kamu lebih tenang." })}
        items={S.whyus?.data?.items || [
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
        steps={S.how?.data?.steps || [
          { icon:"search",       title:t("home.how.0.title", { defaultValue:"Pilih Paket" }),  text:t("home.how.0.text", { defaultValue:"Bandingkan & sesuaikan pax." }) },
          { icon:"message",      title:t("home.how.1.title", { defaultValue:"Chat Admin" }),  text:t("home.how.1.text", { defaultValue:"Klik WhatsApp, kami balas cepat." }) },
          { icon:"calendar",     title:t("home.how.2.title", { defaultValue:"Atur Jadwal" }), text:t("home.how.2.text", { defaultValue:"Tentukan tanggal & meeting point." }) },
          { icon:"badge-check",  title:t("home.how.3.title", { defaultValue:"Berangkat!" }),  text:t("home.how.3.text", { defaultValue:"Nikmati trip." }) },
        ]}
      />

      <Testimonials
        title={S.testimonials?.locale?.title || t("home.testimonialsTitle", { defaultValue: "Kata Mereka" })}
        items={S.testimonials?.data?.items || []}
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
