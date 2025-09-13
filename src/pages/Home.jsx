import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import HeroSlider from "../components/HeroSlider";
import { toIDR } from "../utils/format";
import { useCart } from "../context/CartContext";
import data from "../data/packages.json";

const heroImages = [
  "/logo.png", "/logo.png", "/logo.png"
];

export default function Home() {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const [pax, setPax] = useState(2);

  return (
    <>
      <section className="container mt-6 grid md:grid-cols-2 gap-6 items-center">
        <div className="space-y-4">
          <p className="text-2xl md:text-3xl font-semibold">{t("hero.line1")}</p>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-sky-700 dark:text-sky-400">{t("hero.line2")}</h1>
          <p className="text-slate-600 dark:text-slate-300">{t("hero.desc")}</p>
          <div className="flex gap-3">
            <a href="#packages" className="btn btn-primary">{t("hero.ctaExplore")}</a>
            <a href="/contact" className="btn btn-outline">{t("hero.ctaContact")}</a>
          </div>
        </div>
        <HeroSlider images={heroImages} />
      </section>

      <section id="packages" className="container mt-16">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">Paket Populer</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="pax" className="text-sm text-slate-500">Hitung harga untuk</label>
            <select id="pax" value={pax} onChange={(e)=>setPax(parseInt(e.target.value))} className="border rounded-xl px-3 py-2 dark:bg-slate-900">
              {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} pax</option>)}
            </select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {data.map(p => {
            const tier = p.priceTiers?.find(x => parseInt(x[0])===pax) || p.priceTiers?.[0];
            const price = tier ? tier[1] : 0;
            return (
              <article key={p.id} className="card p-4">
                <h3 className="font-semibold text-lg mb-1">{p.title}</h3>
                <p className="text-sm text-slate-500 mb-2">{(p.spots||p.spots_day1||[]).slice(0,4).join(" • ")}...</p>
                <div className="flex items-center justify-between">
                  <p className="text-sky-600 font-bold">{toIDR(price)} <span className="text-sm font-normal text-slate-500">/pax</span></p>
                  <button className="btn btn-primary" onClick={()=>addItem({ id:p.id, title:p.title, price, qty:1 })}>Tambah ke Keranjang</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}