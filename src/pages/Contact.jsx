// src/pages/Contact.jsx
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import usePageSections from "../hooks/usePageSections";
import { Mail, Phone, MapPin, Instagram, MessageCircle } from "lucide-react";

export default function Contact() {
  const { t } = useTranslation();
  const { sections, loading } = usePageSections("contact");
  const S = useMemo(
    () => Object.fromEntries((sections || []).map((s) => [s.section_key, s])),
    [sections]
  );

  const info = S.contact_info?.data || {};
  const hrs = S.contact_info?.locale?.extra?.hours || [];
  const waNumber = (info.wa || info.phone || "+6289523949667").replace(/[^\d+]/g, "");
  const mapSrc =
    S.map?.data?.map_embed_src ||
    info.map_embed_src ||
    "https://www.google.com/maps?q=Bunga+Mekar,+Nusa+Penida&output=embed";

  // form state
  const [form, setForm] = useState({ name: "", contact: "", message: "" });

  // build WA text
  const buildWAText = () => {
    const lines = [
      t("checkout.wa.header", { defaultValue: "Halo Admin CIDIKA, saya ingin bertanya." }),
      "",
      `Nama: ${form.name}`,
      `Kontak: ${form.contact}`,
      "",
      form.message,
      "",
      t("checkout.wa.footer", { defaultValue: "Mohon infonya ya 🙏" })
    ];
    return encodeURIComponent(lines.join("\n"));
  };

  const submitToWA = (e) => {
    e.preventDefault();
    const text = buildWAText();
    window.location.href = `https://wa.me/${waNumber.replace("+", "")}?text=${text}`;
  };

  return (
    <div className="container mt-4 space-y-4">
      {/* Hero */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md p-5 glass">
        <h1 className="text-2xl font-bold mb-1">
          {S.hero_contact?.locale?.title || t("contact.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {S.hero_contact?.locale?.body_md ||
            t("contact.subtitle", {
              defaultValue: "Hubungi kami untuk pertanyaan & penyesuaian tur."
            })}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Info cards */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="lg:col-span-1 space-y-4"
        >
          <div className="card p-4">
            <h2 className="font-semibold mb-2">
              {S.contact_info?.locale?.title || t("contact.info", { defaultValue: "Informasi Kontak" })}
            </h2>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {info.address && (
                <li className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 text-sky-600 dark:text-sky-400" />
                  <span>{info.address}</span>
                </li>
              )}
              {info.email && (
                <li className="flex items-start gap-2">
                  <Mail size={16} className="mt-0.5 text-sky-600 dark:text-sky-400" />
                  <a href={`mailto:${info.email}`} className="hover:underline">{info.email}</a>
                </li>
              )}
              {info.phone && (
                <li className="flex items-start gap-2">
                  <Phone size={16} className="mt-0.5 text-sky-600 dark:text-sky-400" />
                  <a href={`tel:${info.phone}`} className="hover:underline">{info.phone}</a>
                </li>
              )}
              {info.instagram && (
                <li className="flex items-start gap-2">
                  <Instagram size={16} className="mt-0.5 text-sky-600 dark:text-sky-400" />
                  <a
                    href={`https://instagram.com/${info.instagram.replace("@", "")}`}
                    target="_blank" rel="noreferrer"
                    className="hover:underline"
                  >
                    {info.instagram}
                  </a>
                </li>
              )}
            </ul>

            {(S.contact_info?.locale?.body_md || hrs.length) && (
              <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                {S.contact_info?.locale?.body_md}
                {hrs.length > 0 && (
                  <ul className="mt-1 list-disc pl-5">
                    {hrs.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* WhatsApp CTA card */}
          <div className="card p-4 bg-gradient-to-br from-sky-50 to-white dark:from-slate-900 dark:to-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-100 dark:bg-slate-800">
                <MessageCircle />
              </div>
              <div>
                <div className="font-medium">WhatsApp</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{waNumber}</div>
              </div>
              <a
                className="ml-auto btn btn-primary"
                href={`https://wa.me/${waNumber.replace("+", "")}`}
                target="_blank" rel="noreferrer"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </motion.section>

        {/* Middle: Quick Form -> WhatsApp */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="lg:col-span-1 card p-4"
        >
          <h2 className="font-semibold mb-1">
            {S.quick_form?.locale?.title || t("contact.formTitle")}
          </h2>
          <p className="text-sm text-slate-500">
            {S.quick_form?.locale?.body_md || t("contact.formNote")}
          </p>

          <form className="grid gap-2 mt-3" onSubmit={submitToWA}>
            <input
              className="border rounded-2xl px-3 py-2 dark:bg-slate-900"
              placeholder={t("contact.name")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="border rounded-2xl px-3 py-2 dark:bg-slate-900"
              placeholder={t("contact.emailwa")}
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              required
            />
            <textarea
              className="border rounded-2xl px-3 py-2 dark:bg-slate-900"
              placeholder={t("contact.message")}
              rows="5"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
            <button className="btn btn-primary">
              {t("footer.cta.whatsapp", { defaultValue: "Chat WhatsApp" })}
            </button>
          </form>
        </motion.section>

        {/* Right: Map */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.08 }}
          className="lg:col-span-1 card overflow-hidden"
        >
          <h2 className="font-semibold px-4 pt-4">
            {S.map?.locale?.title || t("contact.addressLabel", { defaultValue: "ADDRESS" })}
          </h2>
          <div className="p-4">
            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <iframe
                title="CIDIKA Travel Location"
                src={mapSrc}
                width="100%" height="100%" loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 0 }}
                allowFullScreen
              />
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
