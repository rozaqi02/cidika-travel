import React from "react";
import { useTranslation } from "react-i18next";

export default function Contact() {
  const { t } = useTranslation();
  return (
    <div className="container mt-6 grid md:grid-cols-2 gap-6">
      <div className="card p-4">
        <h1 className="text-2xl font-bold mb-2">{t("contact.title")}</h1>
        <ul className="space-y-1 text-slate-700 dark:text-slate-200">
          <li><strong>{t("contact.addressLabel")}:</strong> Bunga Mekar Nusa Penida, Kabupaten Klungkung, Bali</li>
          <li><strong>{t("contact.emailLabel")}:</strong> cidikatravel@gmail.com</li>
          <li><strong>{t("contact.phoneLabel")}:</strong> +62 8952 3949 667</li>
          <li><strong>{t("contact.instagramLabel")}:</strong> @cidikatravel</li>
        </ul>
      </div>
      <div className="card p-4">
        <h2 className="font-semibold mb-2">{t("contact.formTitle")}</h2>
        <p className="text-sm text-slate-500">{t("contact.formNote")}</p>
        <form className="grid gap-2 mt-2" onSubmit={(e)=>{e.preventDefault(); alert(t("contact.sent"));}}>
          <input className="border rounded-2xl px-3 py-2 dark:bg-slate-900" placeholder={t("contact.name")} />
          <input className="border rounded-2xl px-3 py-2 dark:bg-slate-900" placeholder={t("contact.emailwa")} />
          <textarea className="border rounded-2xl px-3 py-2 dark:bg-slate-900" placeholder={t("contact.message")} rows="4" />
          <button className="btn btn-primary">{t("contact.send")}</button>
        </form>
      </div>
    </div>
  );
}
