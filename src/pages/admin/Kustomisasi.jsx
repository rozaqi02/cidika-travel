// src/pages/admin/Kustomisasi.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useTranslation } from "react-i18next";
import {
  Trash2, Plus, ArrowUp, ArrowDown, Upload, GripVertical, Save, LayoutList, Languages, Search,
  Copy, RotateCcw, Images, Eye
} from "lucide-react";

/**
 * Catatan:
 * - Toolbar sticky + search + language pills
 * - Badge “JSON invalid” + indikator “• unsaved”
 * - Duplicate & revert per section
 * - Quick gallery editor bila ada data.images (add/reorder/remove)
 * - Preview ringkas data JSON
 */

const LANGS = ["id", "en", "ja"];

export default function Kustomisasi() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState("home");
  const [sections, setSections] = useState([]);
  const [original, setOriginal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLang, setActiveLang] = useState(LANGS[0]);
  const [query, setQuery] = useState("");

  // daftar halaman edit
  const PAGES = useMemo(
    () => [
      { key: "home", label: t("nav.home") },
      { key: "explore", label: t("nav.explore") },
      { key: "destinations", label: t("nav.destinasi") },
      { key: "faq", label: t("nav.faq") },
      { key: "contact", label: t("nav.contact") },
    ],
    [t, i18n.language]
  );

  const mapFromDb = (data) =>
    (data || []).map((s) => ({
      ...s,
      locales: LANGS.reduce((acc, l) => {
        const r = s.page_section_locales?.find((x) => x.lang === l) || {};
        acc[l] = { title: r.title || "", body_md: r.body_md || "", extra: r.extra || null };
        return acc;
      }, {}),
      dataText: JSON.stringify(s.data || {}, null, 2),
      dataValid: true,
      _dirty: false,
    }));

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
      setOriginal([]);
      setLoading(false);
      return;
    }
    const mapped = mapFromDb(data);
    setSections(mapped);
    setOriginal(mapped);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  /** ===============================
   *  Mutators
   *  =============================== */
  const markDirty = (sid) => setSections((prev) => prev.map((s) => (s.id === sid ? { ...s, _dirty: true } : s)));

  const updateLocal = (sid, lang, field, value) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sid
          ? { ...s, _dirty: true, locales: { ...s.locales, [lang]: { ...s.locales[lang], [field]: value } } }
          : s
      )
    );
  };

  const updateLocaleExtra = (sid, lang, nextExtra) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sid
          ? { ...s, _dirty: true, locales: { ...s.locales, [lang]: { ...s.locales[lang], extra: nextExtra } } }
          : s
      )
    );
  };

  const updateDataText = (sid, text) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sid) return s;
        let valid = true;
        try { JSON.parse(text || "{}"); } catch { valid = false; }
        return { ...s, dataText: text, dataValid: valid, _dirty: true };
      })
    );
  };

  const commitDataJSON = (s) => {
    try { return JSON.parse(s.dataText || "{}"); }
    catch { return s.data || {}; }
  };

  const addSection = async () => {
    const section_key = prompt(
      t("admin.customize.addSectionPrompt", { defaultValue: "Section key (mis: hero, whyus, stats, how, popular, testimonials, cta, faq_list)?" })
    );
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
        _dirty: true,
      },
    ]);
  };

  const duplicateSection = async (sid) => {
    const base = sections.find((s) => s.id === sid);
    if (!base) return;
    const payload = {
      page,
      section_key: `${base.section_key}_copy`,
      sort_index: (sections[sections.length - 1]?.sort_index || 0) + 10,
      data: commitDataJSON(base),
    };
    const { data, error } = await supabase.from("page_sections").insert(payload).select().single();
    if (error) { alert(error.message); return; }

    // Copy locales
    for (const lang of LANGS) {
      const pl = {
        section_id: data.id, lang,
        title: base.locales[lang]?.title || null,
        body_md: base.locales[lang]?.body_md || null,
        extra: base.locales[lang]?.extra || null,
      };
      await supabase.from("page_section_locales").upsert(pl, { onConflict: "section_id,lang" });
    }
    await load();
  };

  const revertSection = (sid) => {
    const orig = original.find((s) => s.id === sid);
    if (!orig) return;
    setSections((prev) => prev.map((s) => (s.id === sid ? { ...orig } : s)));
  };

  const deleteSection = async (id) => {
    if (!confirm(t("admin.customize.deleteConfirm", { defaultValue: "Hapus section ini?" }))) return;
    const { error } = await supabase.from("page_sections").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const move = (id, dir) => {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    const a = sections[idx];
    const b = sections[target];
    setSections((prev) => {
      const copy = [...prev];
      copy[idx] = { ...b, sort_index: a.sort_index, _dirty: true };
      copy[target] = { ...a, sort_index: b.sort_index, _dirty: true };
      return copy;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      for (const s of sections) {
        if (!s._dirty && s.dataValid) continue;

        const dataJSON = commitDataJSON(s);
        const { error: e1 } = await supabase
          .from("page_sections")
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
          const { error: e2 } = await supabase
            .from("page_section_locales")
            .upsert(payload, { onConflict: "section_id,lang" });
          if (e2) throw e2;
        }
      }
      alert(t("admin.customize.saved", { defaultValue: "Tersimpan" }));
      await load();
    } catch (e) {
      console.error(e);
      alert(e.message || t("admin.customize.saveFailed", { defaultValue: "Gagal simpan" }));
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

    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sid) return s;
        let obj;
        try { obj = JSON.parse(s.dataText || "{}"); } catch { obj = {}; }
        const arr = Array.isArray(obj.images) ? obj.images.slice() : [];
        arr.push(url);
        obj.images = arr;
        return { ...s, dataText: JSON.stringify(obj, null, 2), dataValid: true, _dirty: true };
      })
    );
  };

  const sorted = useMemo(
    () =>
      sections
        .slice()
        .sort((a, b) => a.sort_index - b.sort_index)
        .filter((s) => {
          const q = query.trim().toLowerCase();
          if (!q) return true;
          const title = (s.locales?.[activeLang]?.title || "").toLowerCase();
          return (s.section_key || "").toLowerCase().includes(q) || title.includes(q);
        }),
    [sections, query, activeLang]
  );

  /** FAQ helpers (tetap kompatibel) */
  const getFaqItems = (s, lang) => {
    const ex = s?.locales?.[lang]?.extra;
    return Array.isArray(ex?.items) ? ex.items : [];
  };
  const setFaqItems = (sid, lang, newItems) => {
    const sec = sections.find((x) => x.id === sid);
    if (!sec) return;
    const currentExtra = sec.locales?.[lang]?.extra || {};
    updateLocaleExtra(sid, lang, { ...currentExtra, items: newItems });
  };
  const addFaqItem = (sid, lang) => {
    const items = getFaqItems(sections.find((x) => x.id === sid), lang).slice();
    items.push({ q: "", a: "" });
    setFaqItems(sid, lang, items);
  };
  const updateFaqItem = (sid, lang, index, field, value) => {
    const items = getFaqItems(sections.find((x) => x.id === sid), lang).slice();
    items[index] = { ...items[index], [field]: value };
    setFaqItems(sid, lang, items);
  };
  const deleteFaqItem = (sid, lang, index) => {
    const items = getFaqItems(sections.find((x) => x.id === sid), lang).slice();
    items.splice(index, 1);
    setFaqItems(sid, lang, items);
  };
  const moveFaqItem = (sid, lang, index, dir) => {
    const items = getFaqItems(sections.find((x) => x.id === sid), lang).slice();
    const j = index + dir;
    const tmp = items[index];
    items[index] = items[j];
    items[j] = tmp;
    setFaqItems(sid, lang, items);
  };

  if (loading) return <div className="container mt-6">{t("misc.loading")}</div>;
  const hasInvalid = sections.some((s) => !s.dataValid);

  return (
    <div className="container mt-3 space-y-4">
      {/* STICKY TOOLBAR */}
      <div className="sticky top-16 z-[5]">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md px-3 sm:px-4 py-3 glass shadow-smooth">
          <div className="flex flex-col gap-3 sm:gap-2">
            {/* Row 1 */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <LayoutList className="opacity-70" size={18} />
                <h1 className="text-lg sm:text-xl font-bold">{t("admin.customize.title", { defaultValue: "Kustomisasi Halaman" })}</h1>
                {hasInvalid && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                    JSON invalid
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-outline !py-2 !px-3 hidden sm:inline-flex" onClick={addSection} title={t("admin.customize.addSection")}>
                  <Plus size={16} /> <span className="hidden md:inline">{t("admin.customize.addSection")}</span>
                </button>
                <button className="btn btn-primary !py-2 !px-3" onClick={save} disabled={saving || hasInvalid} title={t("admin.customize.saveAll")}>
                  <Save size={16} />
                  <span className="ml-2">{saving ? t("admin.customize.saving") : t("admin.customize.saveAll")}</span>
                </button>
              </div>
            </div>

            {/* Row 2: filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Page select */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{t("admin.customize.page", { defaultValue: "Halaman" })}</span>
                <select className="px-3 py-2 rounded-2xl border w-[180px]" value={page} onChange={(e) => setPage(e.target.value)}>
                  {PAGES.map((p) => (<option key={p.key} value={p.key}>{p.label}</option>))}
                </select>
              </div>

              {/* Search section */}
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("admin.customize.searchPlaceholder", { defaultValue: "Cari section / judul…" })}
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border-slate-200 dark:border-slate-700"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Language pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar sm:justify-end">
                <Languages size={16} className="opacity-70 mr-1 hidden sm:block" />
                {LANGS.map((l) => (
                  <button key={l} className={`btn ${activeLang === l ? "btn-primary" : "btn-outline"} !py-1.5 !px-3`} onClick={() => setActiveLang(l)}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile quick add */}
            <div className="sm:hidden">
              <button className="btn btn-outline w-full" onClick={addSection}>
                <Plus size={16} /> {t("admin.customize.addSection")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LIST SECTIONS */}
      <div className="space-y-6">
        {sorted.map((s) => {
          // coba baca images dari dataText untuk gallery editor
          let dataObj = {};
          try { dataObj = JSON.parse(s.dataText || "{}"); } catch {}
          const images = Array.isArray(dataObj.images) ? dataObj.images : [];

          return (
            <div key={s.id} className="card p-4">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold uppercase">[{s.section_key}]</span>
                  <input
                    value={s.section_key}
                    onChange={(e) => { setSections((prev) => prev.map((x) => (x.id === s.id ? { ...x, section_key: e.target.value, _dirty: true } : x))); }}
                    className="px-2 py-1 rounded-xl border dark:bg-slate-900"
                    placeholder="section_key"
                  />
                  {!s.dataValid && (
                    <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                      JSON invalid
                    </span>
                  )}
                  {s._dirty && (
                    <span className="ml-2 text-[11px] text-amber-600">• {t("admin.customize.unsaved", { defaultValue: "belum disimpan" })}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => move(s.id, -1)} title={t("admin.customize.up", { defaultValue: "Naik" })}>
                    <ArrowUp size={16} />
                  </button>
                  <button className="p-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => move(s.id, +1)} title={t("admin.customize.down", { defaultValue: "Turun" })}>
                    <ArrowDown size={16} />
                  </button>
                  <button className="p-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => duplicateSection(s.id)} title={t("admin.customize.duplicate", { defaultValue: "Duplikat" })}>
                    <Copy size={16} />
                  </button>
                  <button className="p-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => revertSection(s.id)} title={t("admin.customize.revert", { defaultValue: "Kembalikan" })}>
                    <RotateCcw size={16} />
                  </button>
                  <button className="p-2 rounded-xl border hover:bg-red-50 dark:hover:bg-slate-800" onClick={() => deleteSection(s.id)} title={t("admin.customize.delete", { defaultValue: "Hapus" })}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-4 mt-4">
                {/* Data JSON + uploader + preview ringkas */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">{t("admin.customize.dataJsonLabel")}</label>
                    <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                      <Upload size={14} /> {t("admin.customize.uploadImage", { defaultValue: "Upload Gambar" })}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(s.id, e.target.files[0])} />
                    </label>
                  </div>
                  <textarea
                    rows="14"
                    className={`w-full border rounded-xl px-3 py-2 dark:bg-slate-900 font-mono text-xs ${s.dataValid ? "" : "border-red-500"}`}
                    value={s.dataText}
                    onChange={(e) => updateDataText(s.id, e.target.value)}
                  />
                  {!s.dataValid && <div className="text-xs text-red-600 mt-1">JSON tidak valid</div>}

                  {/* Preview ringkas */}
                  <div className="mt-2 p-2 rounded-xl border text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2 mb-1"><Eye size={14} /> {t("admin.customize.quickPreview", { defaultValue: "Pratinjau data" })}</div>
                    <pre className="whitespace-pre-wrap break-words">{(() => {
                      try {
                        const obj = JSON.parse(s.dataText || "{}");
                        const keys = Object.keys(obj);
                        return keys.length ? JSON.stringify(keys.reduce((a, k) => (a[k] = Array.isArray(obj[k]) ? `[${obj[k].length}]` : typeof obj[k] === "object" && obj[k] ? "{…}" : obj[k], a), {}), null, 2) : "{}";
                      } catch { return "{}"; }
                    })()}</pre>
                  </div>
                </div>

                {/* Locales */}
                <div className="space-y-2">
                  <div className="font-medium uppercase">{activeLang}</div>
                  <label className="text-sm">{t("admin.customize.titleLabel")}</label>
                  <input
                    className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900 mb-2"
                    value={s.locales[activeLang].title}
                    onChange={(e) => updateLocal(s.id, activeLang, "title", e.target.value)}
                  />
                  <label className="text-sm">{t("admin.customize.bodyLabel")}</label>
                  <textarea
                    rows="8"
                    className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
                    value={s.locales[activeLang].body_md}
                    onChange={(e) => updateLocal(s.id, activeLang, "body_md", e.target.value)}
                  />
                </div>

                {/* Gallery editor (jika ada images) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Images size={16} /> <span className="font-medium">{t("admin.customize.gallery", { defaultValue: "Galeri" })}</span>
                    <span className="text-xs text-slate-400">({images.length})</span>
                  </div>
                  {images.length === 0 ? (
                    <div className="text-sm text-slate-500">{t("admin.customize.noImages", { defaultValue: "Belum ada gambar. Tambahkan lewat Upload Gambar." })}</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img src={url} alt="" className="w-full h-24 object-cover rounded-lg border" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition" />
                          <div className="absolute top-1 left-1 flex gap-1">
                            <button
                              className="p-1 rounded bg-white/90 text-slate-700"
                              onClick={() => {
                                const obj = JSON.parse(s.dataText || "{}");
                                const arr = Array.isArray(obj.images) ? obj.images.slice() : [];
                                if (idx > 0) { [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; }
                                updateDataText(s.id, JSON.stringify({ ...obj, images: arr }, null, 2));
                              }}
                              title="Naik"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              className="p-1 rounded bg-white/90 text-slate-700"
                              onClick={() => {
                                const obj = JSON.parse(s.dataText || "{}");
                                const arr = Array.isArray(obj.images) ? obj.images.slice() : [];
                                if (idx < arr.length - 1) { [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]]; }
                                updateDataText(s.id, JSON.stringify({ ...obj, images: arr }, null, 2));
                              }}
                              title="Turun"
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>
                          <button
                            className="absolute top-1 right-1 p-1 rounded bg-white/90 text-rose-600"
                            onClick={() => {
                              const obj = JSON.parse(s.dataText || "{}");
                              const arr = Array.isArray(obj.images) ? obj.images.slice() : [];
                              arr.splice(idx, 1);
                              updateDataText(s.id, JSON.stringify({ ...obj, images: arr }, null, 2));
                            }}
                            title="Hapus"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Editor FAQ */}
              {s.section_key === "faq_list" && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">FAQ Items ({activeLang.toUpperCase()})</div>
                    <button className="btn btn-outline !py-1 !px-3" onClick={() => addFaqItem(s.id, activeLang)}>
                      <Plus size={14} /> {t("admin.customize.addItem", { defaultValue: "Tambah Item" })}
                    </button>
                  </div>

                  {getFaqItems(s, activeLang).length === 0 ? (
                    <div className="text-sm text-slate-500">
                      {t("admin.customize.noFaq", { defaultValue: "Belum ada item. Klik Tambah Item." })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getFaqItems(s, activeLang).map((it, idx) => (
                        <div key={idx} className="p-3 rounded-xl border dark:border-slate-700">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 text-slate-500">
                              <GripVertical size={16} /> <span className="text-xs">#{idx + 1}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button className="p-1 rounded-lg border" onClick={() => moveFaqItem(s.id, activeLang, idx, -1)} title="Naik">
                                <ArrowUp size={14} />
                              </button>
                              <button className="p-1 rounded-lg border" onClick={() => moveFaqItem(s.id, activeLang, idx, +1)} title="Turun">
                                <ArrowDown size={14} />
                              </button>
                              <button className="p-1 rounded-lg border hover:bg-red-50 dark:hover:bg-slate-800" onClick={() => deleteFaqItem(s.id, activeLang, idx)} title="Hapus">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <input
                            className="w-full border rounded-xl px-3 py-2 mb-2 dark:bg-slate-900"
                            placeholder="Pertanyaan (Q)"
                            value={it.q || ""}
                            onChange={(e) => updateFaqItem(s.id, activeLang, idx, "q", e.target.value)}
                          />
                          <textarea
                            rows="3"
                            className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
                            placeholder="Jawaban (A)"
                            value={it.a || ""}
                            onChange={(e) => updateFaqItem(s.id, activeLang, idx, "a", e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
