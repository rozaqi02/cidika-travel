import React from "react";
import { useTranslation } from "react-i18next";

export default function FAQ() {
  const { t } = useTranslation();
  const faqs = t("faq.list", { returnObjects: true }) || [];

  return (
    <div className="container mt-6">
      <h1 className="text-2xl font-bold mb-4">{t("faq.title")}</h1>
      <div className="space-y-3">
        {faqs.map((item, i) => (
          <details key={i} className="card p-4">
            <summary className="font-medium cursor-pointer">{item.q}</summary>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
