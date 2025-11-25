// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Phone, Mail, MapPin, ArrowRight, Facebook, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 relative overflow-hidden isolate">
      {/* Background glows — diperkecil & digeser ke bawah agar tidak kena tepi atas */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* biru kiri */}
        <div className="absolute top-32 -left-24 h-[22rem] w-[22rem] rounded-full bg-sky-400/15 blur-[110px]" />
        {/* ungu kanan */}
        <div className="absolute top-[26rem] -right-28 h-[24rem] w-[24rem] rounded-full bg-fuchsia-400/15 blur-[120px]" />
      </div>

      {/* CTA Band */}
      <div className="container relative mt-10 md:mt-12">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-7 md:px-10 md:py-8 shadow-smooth">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex-1">
              <p className="uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 text-xs mb-1">
                {t("footer.cta.kicker")}
              </p>
              <h3 className="text-2xl md:text-3xl font-extrabold leading-tight text-slate-900 dark:text-slate-100">
                {t("footer.cta.title")}
              </h3>
            </div>
            <div className="flex gap-3">
              <a
                href="https://wa.me/62895630193926"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 text-white px-4 py-2 font-semibold hover:bg-sky-700 transition"
              >
                {t("footer.cta.whatsapp")} <ArrowRight size={18} />
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {t("footer.cta.contact")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mt-10 border-t border-slate-200 dark:border-slate-800">
        {/* Grid diubah jadi 3 kolom (md:grid-cols-3) karena newsletter dihapus */}
        <div className="container py-12 md:py-14 grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <img src="/biru.png" alt="CIDIKA TRAVEL&TOUR" className="h-10 w-auto dark:invert-0" />
            </div>
            <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              {t("footer.brand.tagline")}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://instagram.com/cidikatravel"
                aria-label="Instagram"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://facebook.com/"
                aria-label="Facebook"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://youtube.com/"
                aria-label="YouTube"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">{t("footer.links.title")}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link className="hover:underline hover:opacity-90" to="/explore">{t("footer.links.packages")}</Link>
              </li>
              <li>
                <Link className="hover:underline hover:opacity-90" to="/destinasi">{t("footer.links.destinations")}</Link>
              </li>
              <li>
                <Link className="hover:underline hover:opacity-90" to="/faq">{t("footer.links.faq")}</Link>
              </li>
              <li>
                <Link className="hover:underline hover:opacity-90" to="/contact">{t("footer.links.contact")}</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">{t("footer.contact.title")}</h4>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin size={18} className="mt-0.5 text-sky-600 dark:text-sky-400" />
                <span>{t("footer.contact.addressText")}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={18} className="text-sky-600 dark:text-sky-400" />
                <a className="hover:underline" href="mailto:cidikatravel@gmail.com">cidikatravel@gmail.com</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={18} className="text-sky-600 dark:text-sky-400" />
                <a className="hover:underline" href="https://wa.me/62895630193926" target="_blank" rel="noreferrer">
                  +62895630193926 (WA)
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="container py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-slate-600 dark:text-slate-300">
            &copy; {year} <span className="font-semibold">CIDIKA TRAVEL&amp;TOUR</span>. {t("footer.bottom.rights")}
          </p>
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
            <Link to="/terms" className="hover:underline">{t("footer.bottom.terms")}</Link>
            <Link to="/privacy" className="hover:underline">{t("footer.bottom.privacy")}</Link>
            <a
              href="https://instagram.com/cidikatravel"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-2 group"
            >
              <span className="opacity-80 group-hover:opacity-100">{t("footer.bottom.follow")}</span>
              <Instagram size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}