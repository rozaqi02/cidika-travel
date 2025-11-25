// src/pages/Destinasi.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // Hapus useScroll/useTransform jika tidak dipakai lagi
import { Search, MapPin, ArrowRight } from "lucide-react";
import BlurText from "../components/BlurText";
import usePageSections from "../hooks/usePageSections";

/* --- HELPER COMPONENTS (SpotlightOverlay dari FAQ) --- */
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

function DestinationCard({ item, index, onExplore }) {
  const isEven = index % 2 === 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} gap-8 lg:gap-16 items-center mb-24`}
    >
      {/* Image Side */}
      <div className="w-full lg:w-1/2 group">
        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-[5/4]">
           <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/0 transition-colors duration-500 z-10" />
           <img 
             src={item.image} 
             alt={item.title} 
             className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000 ease-out"
             loading="lazy"
           />
           {/* Floating Badge */}
           <div className="absolute top-6 left-6 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold text-slate-900 dark:text-white shadow-lg flex items-center gap-2">
              <MapPin size={16} className="text-sky-500" />
              {item.title}
           </div>
        </div>
      </div>

      {/* Text Side */}
      <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
         <h2 className="text-4xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {item.title}
         </h2>
         <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {item.desc}
         </p>
         
         <div className="pt-4 flex justify-center lg:justify-start">
            <button 
              onClick={() => onExplore(item.key)}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-base shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <span>Explore {item.title}</span>
              <span className="bg-white/20 dark:bg-slate-900/10 p-1 rounded-full">
                 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
         </div>
      </div>
    </motion.div>
  );
}

export default function Destinasi() {
  const { t } = useTranslation();
  const nav = useNavigate();
  
  // Fetch data section dari DB
  const { sections, loading } = usePageSections("destinations");
  const S = useMemo(() => Object.fromEntries((sections || []).map((s) => [s.section_key, s])), [sections]);

  const [searchQuery, setSearchQuery] = useState("");

  // 1. DATA MANIS
  const destinations = useMemo(() => {
    const list = [];

    // A. Nusa Penida (Hardcoded / Wajib Ada)
    list.push({
      key: "nusa-penida",
      title: t("dest.penidaTitle", { defaultValue: "Nusa Penida" }),
      desc: t("dest.penidaDesc", { defaultValue: "Pulau dengan pantai dan tebing ikonik di Bali Tenggara, terkenal dengan Kelingking Beach." }),
      image: "/23.jpg",
    });

    // B. Banyuwangi & Lainnya
    const dynamicSections = (sections || []).filter(s => !['hero', 'intro', 'cards'].includes(s.section_key));
    
    dynamicSections.forEach(s => {
       const img = s.data?.images?.[0] || "https://images.unsplash.com/photo-1505993597083-3bd19fb75e57?auto=format&fit=crop&w=800&q=80";
       
       list.push({
          key: s.section_key,
          title: s.locale?.title || s.section_key,
          desc: s.locale?.body_md || "",
          image: img
       });
    });

    return list;
  }, [t, sections]);

  // 2. Filter Logic
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return destinations;
    const q = searchQuery.toLowerCase();
    return destinations.filter(d => 
       d.title.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q)
    );
  }, [destinations, searchQuery]);

  // Hero Data
  const heroTitle = S.hero?.locale?.title || t("dest.title", { defaultValue: "Destinations" });
  const heroSub = S.hero?.locale?.body_md || "Discover the hidden gems of Indonesia";
  const heroBg = S.hero?.data?.images?.[0] || "/23.jpg";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      
      {/* === HERO SECTION (Updated to Match FAQ Style) === */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative h-[60vh] md:h-[70vh] overflow-hidden" // Removed rounded-b & shadow, added md:h
      >
         <img
           src={heroBg}
           alt="Hero"
           className="absolute inset-0 w-full h-full object-cover"
           loading="eager"
         />
         {/* Updated Gradient to match FAQ */}
         <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/30 to-white/80 dark:to-gray-900/85" />
         
         <SpotlightOverlay />

         <div className="relative z-10 container h-full flex flex-col justify-center items-center text-center px-6">
            <BlurText
               text={heroTitle}
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
               {heroSub}
            </motion.p>

            {/* Search Bar - Center Flow (Not Floating Absolute) */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
               className="mt-8 w-full max-w-md relative"
            >
               <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search destination..." 
                 className="w-full rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60 px-12 py-3 text-gray-900 dark:text-white focus:ring-4 focus:ring-sky-500/30 outline-none transition-all"
               />
            </motion.div>
         </div>
      </motion.section>

      {/* === DESTINATION LIST === */}
      <section className="container py-32">
         <div className="max-w-6xl mx-auto">
            {loading ? (
               <div className="text-center py-20">
                  <div className="animate-spin w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-slate-500">{t("misc.loading")}</p>
               </div>
            ) : filteredList.length > 0 ? (
               filteredList.map((item, idx) => (
                  <DestinationCard 
                     key={item.key} 
                     item={item} 
                     index={idx} 
                     onExplore={(key) => nav(`/explore?dest=${key}`)} 
                  />
               ))
            ) : (
               <div className="text-center py-20">
                  <p className="text-2xl text-slate-400 font-bold">No destinations found.</p>
                  <button onClick={() => setSearchQuery("")} className="mt-4 text-sky-500 hover:underline">Clear search</button>
               </div>
            )}
         </div>
      </section>

      {/* Removed Decorative Footer Element to maintain square/clean look */}
    </div>
  );
}