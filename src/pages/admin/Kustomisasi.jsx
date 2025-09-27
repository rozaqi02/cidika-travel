// src/pages/admin/Kustomisasi.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useTranslation } from "react-i18next";
import {
  Trash2, Plus, ArrowUp, ArrowDown, Upload, GripVertical, Save, LayoutList, Languages, Search,
} from "lucide-react";

/**
 * Catatan:
 * - Toolbar sticky di bagian atas (mengikuti margin container).
 * - Layout responsif mobile: kontrol dipadatkan dan mudah di-swipe.
 * - Ada pencarian section (berdasarkan section_key / title locale aktif).
 * - Badge “Draft/Invalid JSON” bila dataText tidak valid.
 * - Editor FAQ tetap ada, dengan UX yang lebih rapi.
 */

const LANGS = ["id", "en", "ja"];

export default function Kustomisasi() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState("home");
  const [sections, setSections] = useState([]);
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
      dataText: JSON.stringify(s.data || {}, null, 2),
      dataValid: true,
    }));
    setSections(mapped);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [page]);

  /** ===============================
   *  Mutators
   *  =============================== */
  const updateLocal = (sid, lang, field, value) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sid
          ? { ...s, locales: { ...s.locales, [lang]: { ...s.locales[lang], [field]: value } } }
          : s
      )
    );
  };

  const updateLocaleExtra = (sid, lang, nextExtra) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sid
          ? {
              ...s,
              locales: {
                ...s.locales,
                [lang]: { ...s.locales[lang], extra: nextExtra },
              },
            }
          : s
      )
    );
  };

  const updateDataText = (sid, text) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sid) return s;
        let valid = true;
        try {
          JSON.parse(text || "{}");
        } catch {
          valid = false;
        }
        return { ...s, dataText: text, dataValid: valid };
      })
    );
  };

  const commitDataJSON = (s) => {
    try {
      return JSON.parse(s.dataText || "{}");
    } catch {
      return s.data || {};
    }
  };

  const addSection = async () => {
    const section_key = prompt(
      "Section key (mis: hero, whyus, stats, how, popular, testimonials, cta, faq_list)?"
    );
    if (!section_key) return;
    const sort_index = (sections[sections.length - 1]?.sort_index || 0) + 10;

    const { data, error } = await supabase
      .from("page_sections")
      .insert({ page, section_key, sort_index, data: {} })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }
    setSections((prev) => [
      ...prev,
      {
        ...data,
        locales: LANGS.reduce(
          (acc, l) => ({ ...acc, [l]: { title: "", body_md: "", extra: null } }),
          {}
        ),
        dataText: "{}",
        dataValid: true,
      },
    ]);
  };

  const deleteSection = async (id) => {
    if (!confirm("Hapus section ini?")) return;
    const { error } = await supabase.from("page_sections").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
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
        const { error: e1 } = await supabase
          .from("page_sections")
          .update({ data: dataJSON, sort_index: s.sort_index, section_key: s.section_key })
          .eq("id", s.id);
        if (e1) throw e1;

        for (const lang of LANGS) {
          const payload = {
            section_id: s.id,
            lang,
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
    if (upErr) {
      alert(upErr.message);
      return;
    }

    const { data: pub } = supabase.storage.from("assets").getPublicUrl(path);
    const url = pub?.publicUrl;

    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sid) return s;
        let obj;
        try {
          obj = JSON.parse(s.dataText || "{}");
        } catch {
          obj = {};
        }
        const arr = Array.isArray(obj.images) ? obj.images.slice() : [];
        arr.push(url);
        obj.images = arr;
        return { ...s, dataText: JSON.stringify(obj, null, 2), dataValid: true };
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
          return (
            (s.section_key || "").toLowerCase().includes(q) ||
            title.includes(q)
          );
        }),
    [sections, query, activeLang]
  );

  /** ============== Helpers khusus FAQ editor ============== */
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
    const sec = sections.find((x) => x.id === sid);
    if (!sec) return;
    const items = getFaqItems(sec, lang).slice();
    items.push({ q: "", a: "" });
    setFaqItems(sid, lang, items);
  };

  const updateFaqItem = (sid, lang, index, field, value) => {
    const sec = sections.find((x) => x.id === sid);
    if (!sec) return;
    const items = getFaqItems(sec, lang).slice();
    if (index < 0 || index >= items.length) return;
    items[index] = { ...items[index], [field]: value };
    setFaqItems(sid, lang, items);
  };

  const deleteFaqItem = (sid, lang, index) => {
    const sec = sections.find((x) => x.id === sid);
    if (!sec) return;
    const items = getFaqItems(sec, lang).slice();
    if (index < 0 || index >= items.length) return;
    items.splice(index, 1);
    setFaqItems(sid, lang, items);
  };

  const moveFaqItem = (sid, lang, index, dir) => {
    const sec = sections.find((x) => x.id === sid);
    if (!sec) return;
    const items = getFaqItems(sec, lang).slice();
    const j = index + dir;
    if (index < 0 || index >= items.length || j < 0 || j >= items.length) return;
    const tmp = items[index];
    items[index] = items[j];
    items[j] = tmp;
    setFaqItems(sid, lang, items);
  };

  /** ===============================
   *  UI
   *  =============================== */
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
                <h1 className="text-lg sm:text-xl font-bold">{t("admin.customize.title")}</h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="btn btn-outline !py-2 !px-3 hidden sm:inline-flex"
                  onClick={addSection}
                  title={t("admin.customize.addSection")}
                >
                  <Plus size={16} /> <span className="hidden md:inline">{t("admin.customize.addSection")}</span>
                </button>
                <button
                  className="btn btn-primary !py-2 !px-3"
                  onClick={save}
                  disabled={saving || hasInvalid}
                  title={t("admin.customize.saveAll")}
                >
                  <Save size={16} />
                  <span className="ml-2">{saving ? t("admin.customize.saving") : t("admin.customize.saveAll")}</span>
                </button>
              </div>
            </div>

            {/* Row 2: filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Page select */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{t("nav.home")} • {t("nav.faq")} • {t("nav.contact")}</span>
                <select
                  className="px-3 py-2 rounded-2xl border w-[160px]"
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                >
                  {PAGES.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search section */}
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari section / judul…"
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border-slate-200 dark:border-slate-700"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Language pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar sm:justify-end">
                <Languages size={16} className="opacity-70 mr-1 hidden sm:block" />
                {LANGS.map((l) => (
                  <button
                    key={l}
                    className={`btn ${activeLang === l ? "btn-primary" : "btn-outline"} !py-1.5 !px-3`}
                    onClick={() => setActiveLang(l)}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning invalid JSON */}
            {hasInvalid && (
              <div className="text-xs text-amber-700 dark:text-amber-300">
                ⚠️ Ada JSON yang tidak valid. Perbaiki dulu sebelum menyimpan.
              </div>
            )}

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
        {sorted.map((s) => (
          <div key={s.id} className="card p-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold uppercase">[{s.section_key}]</span>
                <input
                  value={s.section_key}
                  onChange={(e) =>
                    setSections((prev) =>
                      prev.map((x) => (x.id === s.id ? { ...x, section_key: e.target.value } : x))
                    )
                  }
                  className="px-2 py-1 rounded-xl border dark:bg-slate-900"
                  placeholder="section_key"
                />
                {!s.dataValid && (
                  <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                    JSON invalid
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => move(s.id, -1)}
                  title="Naik"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  className="p-2 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => move(s.id, +1)}
                  title="Turun"
                >
                  <ArrowDown size={16} />
                </button>
                <label className="text-sm">{t("admin.customize.sort")}</label>
                <input
                  type="number"
                  className="w-20 border rounded-xl px-2 py-1 dark:bg-slate-900"
                  value={s.sort_index}
                  onChange={(e) =>
                    setSections((prev) =>
                      prev.map((x) =>
                        x.id === s.id ? { ...x, sort_index: parseInt(e.target.value) || 0 } : x
                      )
                    )
                  }
                />
                <button
                  className="p-2 rounded-xl border hover:bg-red-50 dark:hover:bg-slate-800"
                  onClick={() => deleteSection(s.id)}
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {/* Data JSON + uploader */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm">{t("admin.customize.dataJsonLabel")}</label>
                  <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                    <Upload size={14} /> Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onUpload(s.id, e.target.files?.[0])}
                    />
                  </label>
                </div>
                <textarea
                  rows="14"
                  className={`w-full border rounded-xl px-3 py-2 dark:bg-slate-900 font-mono text-xs ${
                    s.dataValid ? "" : "border-red-500"
                  }`}
                  value={s.dataText}
                  onChange={(e) => updateDataText(s.id, e.target.value)}
                />
                {!s.dataValid && <div className="text-xs text-red-600 mt-1">JSON tidak valid</div>}
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
            </div>

            {/* Editor FAQ */}
            {s.section_key === "faq_list" && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">FAQ Items ({activeLang.toUpperCase()})</div>
                  <button
                    className="btn btn-outline !py-1 !px-3"
                    onClick={() => addFaqItem(s.id, activeLang)}
                  >
                    <Plus size={14} /> Tambah Item
                  </button>
                </div>

                {getFaqItems(s, activeLang).length === 0 ? (
                  <div className="text-sm text-slate-500">
                    Belum ada item. Klik <b>Tambah Item</b>.
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
                            <button
                              className="p-1 rounded-lg border"
                              onClick={() => moveFaqItem(s.id, activeLang, idx, -1)}
                              title="Naik"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              className="p-1 rounded-lg border"
                              onClick={() => moveFaqItem(s.id, activeLang, idx, +1)}
                              title="Turun"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              className="p-1 rounded-lg border hover:bg-red-50 dark:hover:bg-slate-800"
                              onClick={() => deleteFaqItem(s.id, activeLang, idx)}
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <input
                          className="w-full border rounded-xl px-3 py-2 mb-2 dark:bg-slate-900"
                          placeholder="Pertanyaan (Q)"
                          value={it.q || ""}
                          onChange={(e) =>
                            updateFaqItem(s.id, activeLang, idx, "q", e.target.value)
                          }
                        />
                        <textarea
                          rows="3"
                          className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
                          placeholder="Jawaban (A)"
                          value={it.a || ""}
                          onChange={(e) =>
                            updateFaqItem(s.id, activeLang, idx, "a", e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
