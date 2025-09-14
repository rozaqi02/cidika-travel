import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import usePackages from "../hooks/usePackages";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatMoneyFromIDR } from "../utils/currency";

const heroImages = ["/hero3.jpeg", "/hero4.jpg", "/hero1.jpg", "/hero4.jpg", "/hero5.jpg", "/hero6.jpeg"];

export default function Home() {
  const { t } = useTranslation();
  const { rows: data } = usePackages();
  const { addItem } = useCart();
  const { fx, currency, locale } = useCurrency();

  // Slider
  const [idx, setIdx] = useState(0);
  const total = heroImages.length;
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % total), 4800);
    return () => clearInterval(id);
  }, [total]);
  const go = (d) => setIdx((i) => (i + d + total) % total);

  // Parallax mouse
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width - 0.5;
    const my = (e.clientY - r.top) / r.height - 0.5;
    setMouse({ x: mx, y: my });
  };

  // Section tanpa animasi (mengurangi efek "reload")
  const Section = ({ children, className = "" }) => <section className={className}>{children}</section>;

  const [pax, setPax] = useState(2);

  return (
    <>
      {/* HERO */}
      <section onMouseMove={onMouseMove} className="relative h-[76vh] md:h-[86vh] overflow-hidden">
        {heroImages.map((src, i) => (
          <div
            key={src}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 will-change-transform ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-900/10 to-white/70 dark:to-slate-950/80" />
        <div
          className="absolute inset-0 mix-blend-overlay opacity-20"
          style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "3px 3px" }}
        />

        <motion.div
          className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl bg-sky-400/30"
          animate={{ x: mouse.x * 40, y: mouse.y * 30 }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        />
        <motion.div
          className="absolute top-24 -right-12 w-56 h-56 rounded-full blur-3xl bg-fuchsia-400/30"
          animate={{ x: mouse.x * -50, y: mouse.y * 20 }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        />
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[44rem] h-[44rem] rounded-full blur-3xl bg-amber-300/20 -z-[1]"
          animate={{ x: mouse.x * 20, y: mouse.y * -25 }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        />

        <div className="relative z-10 container h-full flex flex-col justify-center">
          <p className="tracking-[0.3em] text-xs md:text-sm text-white/80">
            {t("hero.tag", { defaultValue: "BEST OFFERS" })}
          </p>
          <h1 className="mt-2 font-extrabold text-white drop-shadow-[0_8px_24px_rgba(0,0,0,.35)] leading-[1.05] text-4xl md:text-6xl">
            {t("hero.line1")} <span className="text-sky-300">{t("hero.line2")}</span>
          </h1>
          <p className="mt-3 max-w-xl text-white/90">{t("hero.desc")}</p>
          <div className="mt-5 flex gap-3">
            <a href="#packages" className="btn btn-primary">
              {t("hero.ctaExplore")}
            </a>
            <Link to="/contact" className="btn btn-outline">
              {t("hero.ctaContact")}
            </Link>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-between container">
          <div className="flex gap-2">
            <button type="button" onClick={() => go(-1)} className="btn btn-outline backdrop-blur bg-white/40 dark:bg-slate-900/40">
              ‹
            </button>
            <button type="button" onClick={() => go(1)} className="btn btn-outline backdrop-blur bg-white/40 dark:bg-slate-900/40">
              ›
            </button>
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
      <Section className="container mt-14">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{t("home.aboutTitle")}</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{t("home.aboutBody")}</p>
            <ul className="mt-4 space-y-2 text-slate-700 dark:text-slate-300">
              <li>• {t("home.point1")}</li>
              <li>• {t("home.point2")}</li>
              <li>• {t("home.point3")}</li>
              <li>• {t("home.point4")}</li>
            </ul>
          </div>
          <img
            src="/23.jpg"
            alt=""
            className="rounded-2xl shadow-smooth object-cover w-full h-64 md:h-80"
            loading="lazy"
          />
        </div>
      </Section>

      {/* PAKET */}
      <Section id="packages" className="container mt-16">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">{t("home.popular")}</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="pax" className="text-sm text-slate-500 dark:text-slate-400">
              {t("home.calcFor")}
            </label>
            <select id="pax" value={pax} onChange={(e) => setPax(parseInt(e.target.value))} className="px-3 py-2 rounded-2xl">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {t("home.pax")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {data.map((p) => {
            const tier = (p.price_tiers || []).find((x) => x.pax === pax) || (p.price_tiers || [])[0];
            const pricePerPaxIDR = tier?.price_idr || 0;
            const spots = (p.locale?.spots || []).slice(0, 4).join(" • ");
            return (
              <article key={p.id} className="card p-4">
                <h3 className="font-semibold text-lg mb-1">{p.locale?.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{spots}...</p>
                <div className="flex items-center justify-between">
                  <p className="text-sky-600 dark:text-sky-400 font-bold">
                    {formatMoneyFromIDR(pricePerPaxIDR, currency, fx, locale)}{" "}
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ {t("home.perPax")}</span>
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => addItem({ id: p.id, title: p.locale?.title, price: pricePerPaxIDR, pax, qty: 1 })}
                  >
                    {t("home.addToCart")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      {/* CTA kontak */}
      <Section className="container mt-16 mb-20">
        <div className="card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-bold">{t("home.ctaTitle")}</h3>
            <p className="text-slate-600 dark:text-slate-300">{t("home.ctaDesc")}</p>
          </div>
          <div className="flex gap-3">
            <a href="https://wa.me/6289523949667" className="btn btn-primary" target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <Link to="/contact" className="btn btn-outline">
              {t("hero.ctaContact")}
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
