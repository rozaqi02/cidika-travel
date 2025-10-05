// src/pages/Destinasi.jsx
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import usePageSections from "../hooks/usePageSections";

export default function Destinasi() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { sections, loading } = usePageSections("destinations");

  const S = useMemo(
    () => Object.fromEntries((sections || []).map((s) => [s.section_key, s])),
    [sections]
  );

  // Ambil cards dari DB jika ada (section_key "cards": extra.items / data.items).
  // Default: 1 kartu Nusa Penida.
  const cards = useMemo(() => {
    const fromDB =
      S.cards?.locale?.extra?.items ||
      S.cards?.data?.items ||
      [];
    if (Array.isArray(fromDB) && fromDB.length) return fromDB;

    return [
      {
        key: "nusa-penida",
        title: t("dest.penidaTitle", { defaultValue: "Nusa Penida" }),
        image:
          "/23.jpg", // fallback (pakai gambar default yang sudah ada di repo)
        desc: t("dest.penidaDesc", {
          defaultValue: "Pulau dengan pantai dan tebing ikonik di Bali Tenggara.",
        }),
      },
    ];
  }, [S, t]);

  if (loading) return <div className="container mt-6">{t("misc.loading")}</div>;

  return (
    <div className="container mt-6 space-y-4">
      <h1 className="text-2xl font-bold">{t("dest.title", { defaultValue: "Destinasi" })}</h1>

      {/* Kartu destinasi */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <button
            key={c.key || i}
            onClick={() => nav(`/explore?dest=${encodeURIComponent(c.key || "nusa-penida")}`)}
            className="card p-0 overflow-hidden text-left hover-lift focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-800">
              {c.image ? (
                <img src={c.image} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : null}
            </div>
            <div className="p-3">
              <h3 className="font-semibold">{c.title}</h3>
              {c.desc && (
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                  {c.desc}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Section text yg sudah ada (intro, dll) tetap ditampilkan */}
      {sections.length > 0 && (
        <div className="space-y-4">
          {sections.map((s) => (
            <article key={s.id} className="card p-4">
              {s.locale?.title && <h3 className="font-semibold text-lg mb-1">{s.locale.title}</h3>}
              {s.locale?.body_md && (
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                  {s.locale.body_md}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
