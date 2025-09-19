import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function Contact() {
  const { t } = useTranslation();
  return (
    <div className="container mt-4 space-y-4">
      {/* hero */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md p-4 glass">
        <h1 className="text-2xl font-bold mb-1">{t("contact.title")}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("contact.subtitle", { defaultValue: "Hubungi kami untuk pertanyaan & penyesuaian tur." })}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="card p-4"
        >
          <h2 className="font-semibold mb-2">{t("contact.info", { defaultValue: "Informasi Kontak" })}</h2>
          <ul className="space-y-2 text-slate-700 dark:text-slate-200">
            <li><strong>{t("contact.addressLabel")}:</strong> Bunga Mekar Nusa Penida, Kabupaten Klungkung, Bali</li>
            <li><strong>{t("contact.emailLabel")}:</strong> cidikatravel@gmail.com</li>
            <li><strong>{t("contact.phoneLabel")}:</strong> +62 8952 3949 667</li>
            <li><strong>{t("contact.instagramLabel")}:</strong> @cidikatravel</li>
          </ul>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {t("contact.note", { defaultValue: "Jam respons 09:00–18:00 WITA pada hari kerja." })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="card p-4"
        >
          <h2 className="font-semibold mb-2">{t("contact.formTitle")}</h2>
          <p className="text-sm text-slate-500">{t("contact.formNote")}</p>
          <form className="grid gap-2 mt-2" onSubmit={(e)=>{e.preventDefault(); alert(t("contact.sent"));}}>
            <input className="border rounded-2xl px-3 py-2 dark:bg-slate-900" placeholder={t("contact.name")} required />
            <input className="border rounded-2xl px-3 py-2 dark:bg-slate-900" placeholder={t("contact.emailwa")} required />
            <textarea className="border rounded-2xl px-3 py-2 dark:bg-slate-900" placeholder={t("contact.message")} rows="4" required />
            <button className="btn btn-primary">{t("contact.send")}</button>
          </form>
        </motion.section>
      </div>
    </div>
  );
}
