import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useTranslation } from "react-i18next";

const LANGS = ["id", "en", "ja"];

export default function Kustomisasi() {
  const { t } = useTranslation();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const page = "home";

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("page_sections")
      .select("id,page,section_key,sort_index,data,page_section_locales(*)")
      .eq("page", page)
      .order("sort_index", { ascending: true });
    if (error) { console.error(error); setSections([]); setLoading(false); return; }
    const mapped = (data || []).map(s => ({
      ...s,
      locales: LANGS.reduce((acc, l) => {
        const r = s.page_section_locales?.find(x => x.lang === l) || {};
        acc[l] = { title: r.title || "", body_md: r.body_md || "", extra: r.extra || null };
        return acc;
      }, {})
    }));
    setSections(mapped);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateLocal = (sid, lang, field, value) => {
    setSections(prev => prev.map(s => s.id === sid ? { ...s, locales: { ...s.locales, [lang]: { ...s.locales[lang], [field]: value } } } : s));
  };
  const updateDataJson = (sid, value) => {
    setSections(prev => prev.map(s => s.id === sid ? { ...s, data: value } : s));
  };

  const save = async () => {
    setSaving(true);
    try {
      for (const s of sections) {
        const { error: e1 } = await supabase.from("page_sections")
          .update({ data: s.data, sort_index: s.sort_index })
          .eq("id", s.id);
        if (e1) throw e1;

        for (const lang of LANGS) {
          const payload = {
            section_id: s.id, lang,
            title: s.locales[lang].title || null,
            body_md: s.locales[lang].body_md || null,
            extra: s.locales[lang].extra || null
          };
          const { error: e2 } = await supabase.from("page_section_locales").upsert(payload, { onConflict: "section_id,lang" });
          if (e2) throw e2;
        }
      }
      alert(t("admin.customize.saved"));
    } catch (e) {
      console.error(e);
      alert(e.message || t("admin.customize.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mt-6">{t("misc.loading")}</div>;

  return (
    <div className="container mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("admin.customize.title")}</h1>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? t("admin.customize.saving") : t("admin.customize.saveAll")}
        </button>
      </div>

      <div className="space-y-6">
        {sections.map(s => (
          <div key={s.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">
                {t("admin.customize.section")} <span className="uppercase">{s.section_key}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm">{t("admin.customize.sort")}</label>
                <input
                  type="number"
                  className="w-20 border rounded-xl px-2 py-1 dark:bg-slate-900"
                  value={s.sort_index}
                  onChange={e => setSections(prev => prev.map(x => x.id === s.id ? { ...x, sort_index: parseInt(e.target.value) || 0 } : x))}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {/* Data JSON */}
              <div>
                <label className="text-sm">{t("admin.customize.dataJsonLabel")}</label>
                <textarea
                  rows="10"
                  className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900 font-mono text-xs"
                  value={JSON.stringify(s.data || {}, null, 2)}
                  onChange={(e) => {
                    try { updateDataJson(s.id, JSON.parse(e.target.value || "{}")); }
                    catch { /* ignore preview */ }
                  }}
                />
              </div>

              {/* Locales */}
              <div className="space-y-4">
                {LANGS.map(lang => (
                  <div key={lang} className="border rounded-xl p-3 border-slate-200 dark:border-slate-800">
                    <div className="font-medium mb-2 uppercase">{lang}</div>
                    <label className="text-sm">{t("admin.customize.titleLabel")}</label>
                    <input
                      className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900 mb-2"
                      value={s.locales[lang].title}
                      onChange={e => updateLocal(s.id, lang, "title", e.target.value)}
                    />
                    <label className="text-sm">{t("admin.customize.bodyLabel")}</label>
                    <textarea
                      rows="6"
                      className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
                      value={s.locales[lang].body_md}
                      onChange={e => updateLocal(s.id, lang, "body_md", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
