import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import BlurText from "../components/BlurText"; // Tambah import ini
import usePageSections from "../hooks/usePageSections";
import { Mail, Phone, MapPin, Instagram, MessageCircle } from "lucide-react";
import { useEffect, useRef } from "react";  // Untuk SpotlightOverlay

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

export default function Contact() {
  const { t } = useTranslation();
  const { sections, loading } = usePageSections("contact");
  const S = useMemo(
    () => Object.fromEntries((sections || []).map((s) => [s.section_key, s])),
    [sections]
  );

  const info = S.contact_info?.data || {};
  const hrs = S.contact_info?.locale?.extra?.hours || [];
  const waNumber = (info.wa || info.phone || "+62895630193926").replace(/[^\d+]/g, "");
  const mapSrc =
    S.map?.data?.map_embed_src ||
    info.map_embed_src ||
    "https://www.google.com/maps?q=Bunga+Mekar,+Nusa+Penida&output=embed";

  // Form state with validation
  const [form, setForm] = useState({ name: "", contact: "", message: "" });
  const [errors, setErrors] = useState({ name: "", contact: "", message: "" });

  // Validation function
  const validateForm = () => {
    const newErrors = { name: "", contact: "", message: "" };
    let isValid = true;

    if (!form.name.trim()) {
      newErrors.name = t("contact.error.name", { defaultValue: "Name is required" });
      isValid = false;
    }
    if (!form.contact.trim()) {
      newErrors.contact = t("contact.error.contact", { defaultValue: "Contact is required" });
      isValid = false;
    }
    if (!form.message.trim()) {
      newErrors.message = t("contact.error.message", { defaultValue: "Message is required" });
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Build WhatsApp text
  const buildWAText = () => {
    const lines = [
      t("checkout.wa.header", { defaultValue: "Halo Admin CIDIKA, saya ingin bertanya." }),
      "",
      `Nama: ${form.name}`,
      `Kontak: ${form.contact}`,
      "",
      form.message,
      "",
      t("checkout.wa.footer", { defaultValue: "Mohon infonya ya 🙏" }),
    ];
    return encodeURIComponent(lines.join("\n"));
  };

  // Handle form submission
  const submitToWA = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const text = buildWAText();
      window.location.href = `https://wa.me/${waNumber.replace("+", "")}?text=${text}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative h-[60vh] overflow-hidden"
      >
        <img
          src={S.hero_contact?.data?.images?.[0] || "https://sftqstwvvtflwyfrvqdt.supabase.co/storage/v1/object/public/assets/pages/contact/hero.jpg"}
          alt="Contact Hero"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/30 to-white/80 dark:to-gray-900/85" />
        <SpotlightOverlay />
        <div className="relative z-10 container h-full flex flex-col justify-center items-center text-center px-6">
          <BlurText
            text={S.hero_contact?.locale?.title || t("contact.title", { defaultValue: "Hubungi Kami" })}
            delay={150}
            animateBy="words"
            direction="top"
            className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-hero, "Cinzel", "EB Garamond", ui-serif, Georgia, serif)' }}
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-4 max-w-2xl text-lg text-white/90"
          >
            {S.hero_contact?.locale?.body_md ||
              t("contact.subtitle", {
                defaultValue: "Kami siap membantu Anda merencanakan petualangan terbaik di Nusa Penida.",
              })}
          </motion.p>
          <motion.a
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            href={`https://wa.me/${waNumber.replace("+", "")}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-white hover:bg-sky-700 transition-colors"
          >
            <MessageCircle size={20} />
            {t("footer.cta.whatsapp", { defaultValue: "Chat WhatsApp" })}
          </motion.a>
        </div>
      </motion.section>

      {/* Main Content */}
      <div className="container py-12 px-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {S.contact_info?.locale?.title || t("contact.info", { defaultValue: "Informasi Kontak" })}
            </h2>
            <ul className="space-y-4 text-gray-700 dark:text-gray-200">
              {info.address && (
                <li className="flex items-start gap-3">
                  <MapPin size={20} className="text-sky-500" />
                  <span>{info.address}</span>
                </li>
              )}
              {info.email && (
                <li className="flex items-start gap-3">
                  <Mail size={20} className="text-sky-500" />
                  <a href={`mailto:${info.email}`} className="hover:text-sky-600 transition-colors">
                    {info.email}
                  </a>
                </li>
              )}
              {info.phone && (
                <li className="flex items-start gap-3">
                  <Phone size={20} className="text-sky-500" />
                  <a href={`tel:${info.phone}`} className="hover:text-sky-600 transition-colors">
                    {info.phone}
                  </a>
                </li>
              )}
              {info.instagram && (
                <li className="flex items-start gap-3">
                  <Instagram size={20} className="text-sky-500" />
                  <a
                    href={`https://instagram.com/${info.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-sky-600 transition-colors"
                  >
                    {info.instagram}
                  </a>
                </li>
              )}
            </ul>
            {(S.contact_info?.locale?.body_md || hrs.length) && (
              <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                {S.contact_info?.locale?.body_md}
                {hrs.length > 0 && (
                  <ul className="mt-2 list-disc pl-5">
                    {hrs.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </motion.section>

          {/* Contact Form */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              {S.quick_form?.locale?.title || t("contact.formTitle", { defaultValue: "Kirim Pesan" })}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {S.quick_form?.locale?.body_md ||
                t("contact.formNote", {
                  defaultValue: "Isi formulir ini untuk menghubungi kami via WhatsApp.",
                })}
            </p>
            <form className="space-y-4" onSubmit={submitToWA}>
              <div>
                <input
                  className={`w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 focus:ring-2 focus:ring-sky-500 outline-none transition-all ${
                    errors.name ? "border-red-500" : ""
                  }`}
                  placeholder={t("contact.name", { defaultValue: "Nama Anda" })}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  aria-label={t("contact.name", { defaultValue: "Nama Anda" })}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <input
                  className={`w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 focus:ring-2 focus:ring-sky-500 outline-none transition-all ${
                    errors.contact ? "border-red-500" : ""
                  }`}
                  placeholder={t("contact.emailwa", { defaultValue: "Email atau Nomor WhatsApp" })}
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  required
                  aria-label={t("contact.emailwa", { defaultValue: "Email atau Nomor WhatsApp" })}
                />
                {errors.contact && (
                  <p className="text-red-500 text-xs mt-1">{errors.contact}</p>
                )}
              </div>
              <div>
                <textarea
                  className={`w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 focus:ring-2 focus:ring-sky-500 outline-none transition-all ${
                    errors.message ? "border-red-500" : ""
                  }`}
                  placeholder={t("contact.message", { defaultValue: "Pesan Anda" })}
                  rows="5"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  aria-label={t("contact.message", { defaultValue: "Pesan Anda" })}
                />
                {errors.message && (
                  <p className="text-red-500 text-xs mt-1">{errors.message}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-sky-600 text-white py-3 hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                {t("footer.cta.whatsapp", { defaultValue: "Kirim via WhatsApp" })}
              </button>
            </form>
          </motion.section>

          {/* Map Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
          >
            <h2 className="text-xl font-semibold px-6 pt-6 text-gray-900 dark:text-white">
              {S.map?.locale?.title || t("contact.addressLabel", { defaultValue: "Lokasi Kami" })}
            </h2>
            <div className="p-6">
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <iframe
                  title="CIDIKA Travel Location"
                  src={mapSrc}
                  width="100%"
                  height="100%"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{ border: 0 }}
                  allowFullScreen
                  aria-label="Location map"
                />
              </div>
              <a
                href="https://www.google.com/maps?q=Bunga+Mekar,+Nusa+Penida"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Buka di Google Maps
              </a>
            </div>
          </motion.section>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <motion.a
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        href={`https://wa.me/${waNumber.replace("+", "")}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 rounded-full bg-sky-600 p-4 text-white shadow-lg hover:bg-sky-700 transition-all"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={24} />
      </motion.a>
    </div>
  );
}