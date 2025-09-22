// src/pages/admin/Kustomisasi.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useTranslation } from "react-i18next";
import { Trash2, Plus, ArrowUp, ArrowDown, Upload } from "lucide-react";

const LANGS = ["id", "en", "ja"];

export default function Kustomisasi() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState("home");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLang, setActiveLang] = useState(LANGS[0]);

  // Halaman yang bisa di-edit (label ikut i18n)
  const PAGES = useMemo(() => ([
    { key: "home",          label: t("nav.home") },
    { key: "explore",       label: t("nav.explore") },
    { key: "destinations",  label: t("nav.destinasi") },
    { key: "faq",           label: t("nav.faq") },
    { key: "contact",       label: t("nav.contact") },
  ]), [t, i18n.language]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("page_sections")
      .select("id,page,section_key,sort_index,data,page_section_locales(*)")
      .eq("page", page)
      .order("sort_index", { ascending: true });

    if (error) {
      console.error(error);
      setSections([]);
      setLoading(false);
      return;
    }
    const mapped = (data || []).map((s) => ({
      ...s,
      locales: LANGS.reduce((acc, l) => {
        const r = s.page_section_locales?.find((x) => x.lang === l) || {};
        acc[l] = {
          title: r.title || "",
          body_md: r.body_md || "",
          extra: r.extra || null,
        };
        return acc;
      }, {}),
      dataText: JSON.stringify(s.data || {}, null, 2), // editor string
      dataValid: true,
    }));
    setSections(mapped);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const updateLocal = (sid, lang, field, value) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sid ? { ...s, locales: { ...s.locales, [lang]: { ...s.locales[lang], [field]: value } } } : s
      )
    );
  };

  const updateDataText = (sid, text) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sid) return s;
        let valid = true;
        try { JSON.parse(text || "{}"); } catch { valid = false; }
        return { ...s, dataText: text, dataValid: valid };
      })
    );
  };

  const commitDataJSON = (s) => {
    try { return JSON.parse(s.dataText || "{}"); } catch { return s.data || {}; }
  };

  const addSection = async () => {
    const section_key = prompt("Section key (mis: hero, whyus, stats, how, popular, testimonials, cta)?");
    if (!section_key) return;
    const sort_index = (sections[sections.length - 1]?.sort_index || 0) + 10;

    const { data, error } = await supabase
      .from("page_sections")
      .insert({ page, section_key, sort_index, data: {} })
      .select()
      .single();

    if (error) { alert(error.message); return; }
    setSections((prev) => [
      ...prev,
      {
        ...data,
        locales: LANGS.reduce((acc, l) => ({ ...acc, [l]: { title: "", body_md: "", extra: null } }), {}),
        dataText: "{}",
        dataValid: true,
      },
    ]);
  };

  const deleteSection = async (id) => {
    if (!confirm("Hapus section ini?")) return;
    const { error } = await supabase.from("page_sections").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const move = (id, dir) => {
    // dir = -1 (up) / +1 (down)
    const idx = sections.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    const a = sections[idx], b = sections[target];
    setSections((prev) => {
      const copy = [...prev];
      copy[idx] = { ...b, sort_index: a.sort_index };
      copy[target] = { ...a, sort_index: b.sort_index };
      return copy;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      for (const s of sections) {
        const dataJSON = commitDataJSON(s);
        const { error: e1 } = await supabase.from("page_sections")
          .update({ data: dataJSON, sort_index: s.sort_index, section_key: s.section_key })
          .eq("id", s.id);
        if (e1) throw e1;

        for (const lang of LANGS) {
          const payload = {
            section_id: s.id, lang,
            title: s.locales[lang].title || null,
            body_md: s.locales[lang].body_md || null,
            extra: s.locales[lang].extra || null,
          };
          const { error: e2 } = await supabase.from("page_section_locales")
            .upsert(payload, { onConflict: "section_id,lang" });
          if (e2) throw e2;
        }
      }
      alert(t("admin.customize.saved"));
      await load();
    } catch (e) {
      console.error(e);
      alert(e.message || t("admin.customize.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  // upload ke storage 'assets'
  const onUpload = async (sid, file) => {
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `pages/${page}/${sid}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from("assets").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (upErr) { alert(upErr.message); return; }

    const { data: pub } = supabase.storage.from("assets").getPublicUrl(path);
    const url = pub?.publicUrl;

    // inject ke data.images[]
    setSections(prev => prev.map(s=>{
      if(s.id!==sid) return s;
      let obj; try{ obj=JSON.parse(s.dataText||"{}"); }catch{ obj={}; }
      const arr = Array.isArray(obj.images) ? obj.images.slice() : [];
      arr.push(url);
      obj.images = arr;
      return { ...s, dataText: JSON.stringify(obj, null, 2), dataValid: true };
    }));
  };

  const sorted = useMemo(()=>sections.slice().sort((a,b)=>a.sort_index-b.sort_index),[sections]);

  if (loading) return <div className="container mt-6">{t("misc.loading")}</div>;

  return (
    <div className="container mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t("admin.customize.title")}</h1>
          <select className="px-3 py-2 rounded-2xl border" value={page} onChange={(e)=>setPage(e.target.value)}>
            {PAGES.map(p=><option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline" onClick={addSection}><Plus size={16}/> {t("admin.customize.addSection")}</button>
          <button className="btn btn-primary" onClick={save} disabled={saving || sections.some(s=>!s.dataValid)}>
            {saving ? t("admin.customize.saving") : t("admin.customize.saveAll")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {LANGS.map(l=>(
          <button key={l}
            className={`btn ${activeLang===l?"btn-primary":"btn-outline"} !py-1 !px-3`}
            onClick={()=>setActiveLang(l)}>{l.toUpperCase()}</button>
        ))}
      </div>

      <div className="space-y-6">
        {sorted.map(s=>(
          <div key={s.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold uppercase">[{s.section_key}]</span>
                <input value={s.section_key} onChange={e=>setSections(prev=>prev.map(x=>x.id===s.id?{...x, section_key:e.target.value}:x))}
                  className="px-2 py-1 rounded-xl border dark:bg-slate-900" placeholder="section_key" />
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800" onClick={()=>move(s.id, -1)} title="Naik"><ArrowUp size={16}/></button>
                <button className="p-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800" onClick={()=>move(s.id, +1)} title="Turun"><ArrowDown size={16}/></button>
                <label className="text-sm">{t("admin.customize.sort")}</label>
                <input type="number" className="w-20 border rounded-xl px-2 py-1 dark:bg-slate-900" value={s.sort_index}
                  onChange={e=>setSections(prev=>prev.map(x=>x.id===s.id?{...x, sort_index:parseInt(e.target.value)||0}:x))}/>
                <button className="p-2 rounded-xl border hover:bg-red-50 dark:hover:bg-slate-800" onClick={()=>deleteSection(s.id)} title="Hapus"><Trash2 size={16}/></button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {/* Data JSON + uploader */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm">{t("admin.customize.dataJsonLabel")}</label>
                  <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                    <Upload size={14}/> Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={(e)=>onUpload(s.id, e.target.files?.[0])}/>
                  </label>
                </div>
                <textarea rows="14"
                  className={`w-full border rounded-xl px-3 py-2 dark:bg-slate-900 font-mono text-xs ${s.dataValid?'':'border-red-500'}`}
                  value={s.dataText}
                  onChange={(e)=>updateDataText(s.id, e.target.value)}
                />
                {!s.dataValid && <div className="text-xs text-red-600 mt-1">JSON tidak valid</div>}
              </div>

              {/* Locales: tab simple */}
              <div className="space-y-2">
                <div className="font-medium uppercase">{activeLang}</div>
                <label className="text-sm">{t("admin.customize.titleLabel")}</label>
                <input className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900 mb-2"
                  value={s.locales[activeLang].title}
                  onChange={(e)=>updateLocal(s.id, activeLang, "title", e.target.value)}
                />
                <label className="text-sm">{t("admin.customize.bodyLabel")}</label>
                <textarea rows="8" className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
                  value={s.locales[activeLang].body_md}
                  onChange={(e)=>updateLocal(s.id, activeLang, "body_md", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
