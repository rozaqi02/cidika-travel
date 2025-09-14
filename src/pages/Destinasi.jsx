import React from "react";
import usePageSections from "../hooks/usePageSections";

export default function Destinasi() {
  const { sections, loading } = usePageSections("destinations");

  if (loading) return <div className="container mt-6">Loading...</div>;

  return (
    <div className="container mt-6 space-y-3">
      <h1 className="text-2xl font-bold">Destinasi</h1>
      {sections.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-300">Konten akan diisi dari menu Admin & Supabase.</p>
      ) : (
        <div className="space-y-4">
          {sections.map(s => (
            <article key={s.id} className="card p-4">
              {s.locale?.title && <h3 className="font-semibold text-lg mb-1">{s.locale.title}</h3>}
              {s.locale?.body_md && <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{s.locale.body_md}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
