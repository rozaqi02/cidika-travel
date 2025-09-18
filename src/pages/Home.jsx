import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import usePackages from "../hooks/usePackages";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";

/* Gambar hero: fokus foto (6 buah) */
const heroImages = ["/hero1.jpg","/hero2.jpg","/hero3.jpeg","/hero4.jpg","/hero5.jpg","/hero6.jpeg"];

/* Preload agar crossfade mulus */
function usePreload(images){
  useEffect(() => {
    images.forEach(src => { const img=new Image(); img.src=src; });
  }, [images]);
}

/* Ambil gambar paket dari beberapa kemungkinan field (termasuk default_image dari DB) */
function getPkgImage(p) {
  const raw =
    p?.default_image ||
    p?.cover_url ||
    p?.thumbnail ||
    p?.thumb_url ||
    p?.image_url ||
    (Array.isArray(p?.images) && p.images[0]) ||
    (p?.data?.images && p.data.images[0]) ||
    "";
  if (!raw) return "/23.jpg";
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export default function Home() {
  const { t } = useTranslation();
  const { rows: data } = usePackages();
  const { fx, currency, locale } = useCurrency();

  usePreload(heroImages);

  // Slider index & anti-flicker
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  useEffect(() => {
    timerRef.current = setInterval(() => setIdx(i => (i+1) % heroImages.length), 5000);
    return () => clearInterval(timerRef.current);
  }, []);
  const go = (d) => setIdx(i => (i + d + heroImages.length) % heroImages.length);

  // Mouse parallax (efek ringan)
  const [mx,my] = useMouseParallax();

  // DEFAULT PAX = 1
  const [pax, setPax] = useState(1);

  return (
    <>
      {/* HERO */}
      <section className="relative h-[76vh] md:h-[86vh] overflow-hidden grain">
        {heroImages.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover hero-img transition-opacity duration-700 ${i===idx?'opacity-100 kenburns':'opacity-0'}`}
            decoding="async"
            loading={i===0?'eager':'lazy'}
            fetchpriority={i===0?'high':'auto'}
          />
        ))}

        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-900/10 to-white/70 dark:to-slate-950/80" />

        {/* orbs parallax */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl bg-sky-400/30"
             style={{ transform:`translate(${mx*40}px, ${my*30}px)` }} />
        <div className="absolute top-24 -right-16 w-72 h-72 rounded-full blur-3xl bg-fuchsia-400/30"
             style={{ transform:`translate(${-mx*50}px, ${my*22}px)` }} />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[48rem] h-[48rem] rounded-full blur-3xl bg-amber-300/20 -z-[1]"
             style={{ transform:`translate(${mx*18}px, ${-my*20}px)` }} />

        {/* copy */}
        <div className="relative z-10 container h-full flex flex-col justify-center">
          <p className="tracking-[0.3em] text-xs md:text-sm text-white/80">
            {t("hero.tag", { defaultValue:"BEST OFFERS" })}
          </p>
          <h1 className="mt-2 font-extrabold text-white drop-shadow-[0_8px_24px_rgba(0,0,0,.35)] leading-[1.05] text-4xl md:text-6xl">
            {t("hero.line1")} <span className="text-sky-300">{t("hero.line2")}</span>
          </h1>
          <p className="mt-3 max-w-xl text-white/90">{t("hero.desc")}</p>
          <div className="mt-5 flex gap-3">
            <a href="#packages" className="btn btn-primary glass">{t("hero.ctaExplore")}</a>
            <Link to="/contact" className="btn btn-outline glass">{t("hero.ctaContact")}</Link>
          </div>
        </div>

        {/* controls */}
        <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-between container">
          <div className="flex gap-2">
            <button type="button" onClick={() => go(-1)} className="btn btn-outline glass">‹</button>
            <button type="button" onClick={() => go(1)} className="btn btn-outline glass">›</button>
          </div>
          <div className="flex gap-1.5">
            {heroImages.map((_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setIdx(i)}
                className={`h-2.5 w-2.5 rounded-full ring-1 ring-white/60 transition ${i === idx ? "bg-white" : "bg-white/30"}`}
                aria-label={`slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="container mt-14">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="hover-lift">
            <h2 className="text-2xl md:text-3xl font-bold">{t("home.aboutTitle")}</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{t("home.aboutBody")}</p>
            <ul className="mt-4 space-y-2 text-slate-700 dark:text-slate-300">
              <li>• {t("home.point1")}</li>
              <li>• {t("home.point2")}</li>
              <li>• {t("home.point3")}</li>
              <li>• {t("home.point4")}</li>
            </ul>
          </div>
          <img src="/23.jpg" alt="" className="rounded-2xl shadow-smooth object-cover w-full h-64 md:h-80 hover-lift" loading="lazy" />
        </div>
      </section>

      {/* PAKET */}
      <section id="packages" className="container mt-16">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">{t("home.popular")}</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="pax" className="text-sm text-slate-500 dark:text-slate-400">{t("home.calcFor")}</label>
            <select id="pax" value={pax} onChange={(e)=>setPax(parseInt(e.target.value))} className="px-3 py-2 rounded-2xl">
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {t("home.pax")}</option>)}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {data.map((p) => {
            const tier = (p.price_tiers || []).find((x) => x.pax === pax) || (p.price_tiers || [])[0];
            const pricePerPaxIDR = tier?.price_idr || 0;
            const spots = (p.locale?.spots || []).slice(0, 4).join(" • ");
            const cover = getPkgImage(p);

            return (
              <article key={p.id} className="card bg-transparent relative overflow-hidden p-0 group hover-lift">
                {/* BACKGROUND IMAGE */}
                <img
                  src={cover}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                {/* OVERLAY */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-white/15 dark:from-slate-950/70 dark:via-slate-950/35 dark:to-slate-950/10" />
                </div>

                {/* CONTENT */}
                <div className="relative p-4">
                  <h3 className="font-semibold text-lg mb-1">{p.locale?.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 truncate">{spots}...</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sky-700 dark:text-sky-300 font-bold">
                      {formatMoneyFromIDR(pricePerPaxIDR, currency, fx, locale)}{" "}
                      <span className="text-sm font-normal text-slate-600 dark:text-slate-400">/ {t("home.perPax")}</span>
                    </p>
                    {/* Ganti tombol → See Detail ke halaman Explore */}
                    <Link
                      to={`/explore?pkg=${p.id}`}
                      state={{ openId: p.id, pax }}
                      className="btn glass px-4 py-2"
                    >
                      {t("explore.seeDetail", { defaultValue: "See Detail" })}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* CTA kontak */}
      <section className="container mt-16 mb-20">
        <div className="card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-5 hover-lift">
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-bold">{t("home.ctaTitle")}</h3>
            <p className="text-slate-600 dark:text-slate-300">{t("home.ctaDesc")}</p>
          </div>
          <div className="flex gap-3">
            <a href="https://wa.me/6289523949667" className="btn btn-primary glass" target="_blank" rel="noreferrer">WhatsApp</a>
            <Link to="/contact" className="btn btn-outline glass">{t("hero.ctaContact")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function useMouseParallax(){
  const [m, setM] = useState({x:0,y:0});
  useEffect(()=>{
    const onMove = (e)=>{
      const { innerWidth:w, innerHeight:h } = window;
      const x = ((e.clientX ?? w/2) / w - .5) * 2;
      const y = ((e.clientY ?? h/2) / h - .5) * 2;
      setM({x, y});
    };
    window.addEventListener('mousemove', onMove, { passive:true });
    return () => window.removeEventListener('mousemove', onMove);
  },[]);
  return [m.x*20, m.y*14];
}