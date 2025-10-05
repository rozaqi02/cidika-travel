// src/pages/admin/Kustomisasi.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useTranslation } from "react-i18next";
import {
  Trash2, Plus, ArrowUp, ArrowDown, Upload, GripVertical, Save, LayoutList, Languages, Search,
  Copy, RotateCcw, Images, Eye, Wrench, Settings2, Star
} from "lucide-react";

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
  const [mode, setMode] = useState("simple"); // simple | advanced
const [compactToolbar, setCompactToolbar] = useState(false);
const lastScrollYRef = useRef(0);

useEffect(() => {
  const onScroll = () => {
    const y = window.scrollY || 0;
    const last = lastScrollYRef.current;
    const down = y > last;
    const delta = Math.abs(y - last);

    // Toggle hanya jika bergerak >18px agar tidak "flicker"
    if (delta > 18) {
      if (down && y > 80) {
        setCompactToolbar(true);   // mengecil saat scroll-down
      } else {
        setCompactToolbar(false);  // kembali normal saat scroll-up
      }
      lastScrollYRef.current = y;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, []);


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
      setSections([]); setOriginal([]); setLoading(false); return;
    }
    const mapped = mapFromDb(data);
    setSections(mapped); setOriginal(mapped); setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

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
  const commitDataJSON = (s) => { try { return JSON.parse(s.dataText || "{}"); } catch { return s.data || {}; } };

  const addSection = async () => {
    const section_key = prompt("Section key (mis: hero, whyus, stats, how, popular, testimonials, cta, faq_list, categories, categories_banner, banner1, quotes_banner)?");
    if (!section_key) return;
    const sort_index = (sections[sections.length - 1]?.sort_index || 0) + 10;
    const { data, error } = await supabase.from("page_sections").insert({ page, section_key, sort_index, data: {} }).select().single();
    if (error) { alert(error.message); return; }
    setSections((prev) => ([...prev, {
      ...data,
      locales: LANGS.reduce((acc, l) => ({ ...acc, [l]: { title: "", body_md: "", extra: null } }), {}),
      dataText: "{}",
      dataValid: true,
      _dirty: true,
    }]));
  };

  const duplicateSection = async (sid) => {
    const base = sections.find((s) => s.id === sid); if (!base) return;
    const payload = {
      page,
      section_key: `${base.section_key}_copy`,
      sort_index: (sections[sections.length - 1]?.sort_index || 0) + 10,
      data: commitDataJSON(base),
    };
    const { data, error } = await supabase.from("page_sections").insert(payload).select().single();
    if (error) { alert(error.message); return; }
    for (const lang of LANGS) {
      const pl = { section_id: data.id, lang,
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
    if (!confirm("Hapus section ini?")) return;
    const { error } = await supabase.from("page_sections").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const move = (id, dir) => {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    const a = sections[idx], b = sections[target];
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
          const { error: e2 } = await supabase.from("page_section_locales").upsert(payload, { onConflict: "section_id,lang" });
          if (e2) throw e2;
        }
      }
      alert("Tersimpan");
      await load();
    } catch (e) {
      console.error(e);
      alert(e.message || "Gagal simpan");
    } finally { setSaving(false); }
  };

  // === UPLOAD HELPERS ===
  const uploadToBucket = async (file, path) => {
    const { error: upErr } = await supabase.storage.from("assets").upload(path, file, { cacheControl: "3600", upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("assets").getPublicUrl(path);
    return pub?.publicUrl;
  };
  const onUploadToImages = async (sid, file) => {
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `pages/${page}/${sid}-${Date.now()}.${ext}`;
    try {
      const url = await uploadToBucket(file, path);
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== sid) return s;
          let obj; try { obj = JSON.parse(s.dataText || "{}"); } catch { obj = {}; }
          const arr = Array.isArray(obj.images) ? obj.images.slice() : [];
          arr.push(url); obj.images = arr;
          return { ...s, dataText: JSON.stringify(obj, null, 2), dataValid: true, _dirty: true };
        })
      );
    } catch (e) { alert(e.message); }
  };
  const onUploadToField = async (sid, file, field = "image") => {
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `pages/${page}/${sid}-${field}-${Date.now()}.${ext}`;
    try {
      const url = await uploadToBucket(file, path);
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== sid) return s;
          let obj; try { obj = JSON.parse(s.dataText || "{}"); } catch { obj = {}; }
          obj[field] = url;
          return { ...s, dataText: JSON.stringify(obj, null, 2), dataValid: true, _dirty: true };
        })
      );
    } catch (e) { alert(e.message); }
  };

  // === FILTERED ===
  const sorted = useMemo(
    () =>
      sections.slice()
        .sort((a, b) => a.sort_index - b.sort_index)
        .filter((s) => {
          const q = query.trim().toLowerCase();
          if (!q) return true;
          const title = (s.locales?.[activeLang]?.title || "").toLowerCase();
          return (s.section_key || "").toLowerCase().includes(q) || title.includes(q);
        }),
    [sections, query, activeLang]
  );

  // === SIMPLE EDITORS ===
  const DataTextArea = ({ s }) => (
    <textarea
      rows="14"
      className={`w-full border rounded-xl px-3 py-2 dark:bg-slate-900 font-mono text-xs ${s.dataValid ? "" : "border-red-500"}`}
      value={s.dataText}
      onChange={(e) => updateDataText(s.id, e.target.value)}
    />
  );

  const Labeled = ({ label, children }) => (
    <label className="block text-sm mb-1">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );

  // Helpers to read/write JSON path in dataText
  const readData = (s) => { try { return JSON.parse(s.dataText || "{}"); } catch { return {}; } };
  const writeData = (s, obj) => updateDataText(s.id, JSON.stringify(obj || {}, null, 2));

  // HERO Editor
  const HeroEditor = ({ s }) => {
    const d = readData(s);
    const chips = Array.isArray(d.chips) ? d.chips : [];
    const images = Array.isArray(d.images) ? d.images : [];

    const setChips = (arr) => writeData(s, { ...d, chips: arr });
    const setImages = (arr) => writeData(s, { ...d, images: arr });

    return (
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="font-medium mb-2">Teks (per bahasa): {activeLang.toUpperCase()}</div>
          <Labeled label="Subtitle (title)">
            <input className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
              value={s.locales[activeLang].title}
              onChange={(e)=>updateLocal(s.id, activeLang, "title", e.target.value)} />
          </Labeled>
          <Labeled label="Judul Besar (body_md)">
            <textarea rows="3" className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
              value={s.locales[activeLang].body_md}
              onChange={(e)=>updateLocal(s.id, activeLang, "body_md", e.target.value)} />
          </Labeled>
          <Labeled label="Deskripsi (extra.desc)">
            <textarea rows="4" className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
              value={s.locales[activeLang].extra?.desc || ""}
              onChange={(e)=>updateLocaleExtra(s.id, activeLang, { ...(s.locales[activeLang].extra||{}), desc: e.target.value })} />
          </Labeled>
          <Labeled label="Label Tombol (extra.cta_contact_label)">
            <input className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
              value={s.locales[activeLang].extra?.cta_contact_label || ""}
              onChange={(e)=>updateLocaleExtra(s.id, activeLang, { ...(s.locales[activeLang].extra||{}), cta_contact_label: e.target.value })} />
          </Labeled>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">Chips (data.chips)</div>
              <button className="btn btn-outline !py-1 !px-3" onClick={()=> setChips([...(chips||[]), { label:"New", q:"" }])}><Plus size={14}/> Tambah Chip</button>
            </div>
            {(chips||[]).length === 0 ? <div className="text-sm text-slate-500">Belum ada chip.</div> : (
              <div className="space-y-2">
                {chips.map((c,idx)=>(
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input className="col-span-5 border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="label"
                      value={c.label||""} onChange={(e)=>{ const arr=chips.slice(); arr[idx]={...c,label:e.target.value}; setChips(arr);} } />
                    <input className="col-span-5 border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="q (query)"
                      value={c.q||""} onChange={(e)=>{ const arr=chips.slice(); arr[idx]={...c,q:e.target.value}; setChips(arr);} } />
                    <div className="col-span-2 flex gap-1 justify-end">
                      <button className="p-2 rounded-xl border" onClick={()=>{ if(idx>0){ const arr=chips.slice(); [arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]]; setChips(arr);} }}><ArrowUp size={14}/></button>
                      <button className="p-2 rounded-xl border" onClick={()=>{ if(idx<chips.length-1){ const arr=chips.slice(); [arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]]; setChips(arr);} }}><ArrowDown size={14}/></button>
                      <button className="p-2 rounded-xl border hover:bg-red-50 dark:hover:bg-slate-800" onClick={()=>{ const arr=chips.slice(); arr.splice(idx,1); setChips(arr); }}><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Galeri gambar */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Images size={16} /> <span className="font-medium">Galeri Hero (data.images)</span>
            <span className="text-xs text-slate-400">({images.length})</span>
          </div>
          <label className="btn btn-outline !py-1.5 !px-3 mb-2 inline-flex items-center gap-2 cursor-pointer">
            <Upload size={14}/> Upload Gambar
            <input type="file" accept="image/*" className="hidden" onChange={(e)=>e.target.files?.[0] && onUploadToImages(s.id, e.target.files[0])}/>
          </label>
          {images.length === 0 ? (
            <div className="text-sm text-slate-500">Belum ada gambar.</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {images.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img src={url} alt="" className="w-full h-24 object-cover rounded-lg border" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition" />
                  <div className="absolute top-1 left-1 flex gap-1">
                    <button className="p-1 rounded bg-white/90 text-slate-700" onClick={()=>{ const arr=images.slice(); if(idx>0){ [arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]];} setImages(arr); }} title="Naik"><ArrowUp size={12}/></button>
                    <button className="p-1 rounded bg-white/90 text-slate-700" onClick={()=>{ const arr=images.slice(); if(idx<images.length-1){ [arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]];} setImages(arr); }} title="Turun"><ArrowDown size={12}/></button>
                  </div>
                  <button className="absolute top-1 right-1 p-1 rounded bg-white/90 text-rose-600" onClick={()=>{ const arr=images.slice(); arr.splice(idx,1); setImages(arr); }} title="Hapus"><Trash2 size={12}/></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // TESTIMONIALS Editor — data.items: [{ name, city, text, stars }]
  const TestimonialsEditor = ({ s }) => {
    const d = readData(s);
    const items = Array.isArray(d.items) ? d.items : [];
    const setItems = (arr) => writeData(s, { ...d, items: arr });

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Testimonial Items</div>
          <button className="btn btn-outline !py-1 !px-3" onClick={()=> setItems([...(items||[]), { name:"", city:"", text:"", stars:5 }])}><Plus size={14}/> Tambah</button>
        </div>
        {(items||[]).length===0 ? <div className="text-sm text-slate-500">Belum ada testimonial.</div> : (
          <div className="space-y-3">
            {items.map((it,idx)=>(
              <div key={idx} className="p-3 rounded-xl border dark:border-slate-700">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-slate-500"><GripVertical size={16}/> <span className="text-xs">#{idx+1}</span></div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded-lg border" onClick={()=>{ if(idx>0){ const arr=items.slice(); [arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]]; setItems(arr); } }} title="Naik"><ArrowUp size={14}/></button>
                    <button className="p-1 rounded-lg border" onClick={()=>{ if(idx<items.length-1){ const arr=items.slice(); [arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]]; setItems(arr); } }} title="Turun"><ArrowDown size={14}/></button>
                    <button className="p-1 rounded-lg border hover:bg-red-50 dark:hover:bg-slate-800" onClick={()=>{ const arr=items.slice(); arr.splice(idx,1); setItems(arr); }} title="Hapus"><Trash2 size={14}/></button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-2">
                  <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Nama" value={it.name||""} onChange={(e)=>{ const arr=items.slice(); arr[idx]={...it,name:e.target.value}; setItems(arr);} } />
                  <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Kota (opsional)" value={it.city||""} onChange={(e)=>{ const arr=items.slice(); arr[idx]={...it,city:e.target.value}; setItems(arr);} } />
                </div>
                <textarea rows="3" className="mt-2 w-full border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Teks" value={it.text||""} onChange={(e)=>{ const arr=items.slice(); arr[idx]={...it,text:e.target.value}; setItems(arr);} } />

                <div className="mt-2 flex items-center gap-2">
                  <Star size={16} className="text-amber-500"/><span className="text-sm">Bintang:</span>
                  <select className="px-3 py-2 rounded-2xl" value={Number(it.stars||5)} onChange={(e)=>{ const arr=items.slice(); arr[idx]={...it,stars:Number(e.target.value)}; setItems(arr);} }>
                    {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // STATS Editor — data: { trips, photos, rating }
  const StatsEditor = ({ s }) => {
    const d = readData(s);
    const set = (k,v)=> writeData(s, { ...d, [k]: v });
    return (
      <div className="grid md:grid-cols-3 gap-3">
        <Labeled label="Total Trips (data.trips)"><input type="number" className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900" value={Number(d.trips||0)} onChange={(e)=>set("trips", Number(e.target.value||0))} /></Labeled>
        <Labeled label="Foto/Video (data.photos)"><input type="number" className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900" value={Number(d.photos||0)} onChange={(e)=>set("photos", Number(e.target.value||0))} /></Labeled>
        <Labeled label="Rating (data.rating, contoh 4.9)"><input type="number" step="0.1" className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900" value={Number(d.rating||0)} onChange={(e)=>set("rating", Number(e.target.value||0))} /></Labeled>
      </div>
    );
  };

  // HOW Editor — per bahasa di locales.extra.steps [{title,text,icon}]
  const HowEditor = ({ s }) => {
    const ex = s.locales[activeLang].extra || {};
    const steps = Array.isArray(ex.steps) ? ex.steps : [];
    const setSteps = (arr) => updateLocaleExtra(s.id, activeLang, { ...ex, steps: arr });

    return (
      <div>
        <div className="font-medium mb-2">Lang: {activeLang.toUpperCase()}</div>
        <div className="grid md:grid-cols-2 gap-3">
          <Labeled label="Judul (title)">
            <input className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900" value={s.locales[activeLang].title} onChange={(e)=>updateLocal(s.id, activeLang, "title", e.target.value)} />
          </Labeled>
          <Labeled label="Subjudul (body_md)">
            <input className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900" value={s.locales[activeLang].body_md} onChange={(e)=>updateLocal(s.id, activeLang, "body_md", e.target.value)} />
          </Labeled>
        </div>

        <div className="flex items-center justify-between mt-3 mb-2">
          <div className="font-medium">Langkah (extra.steps)</div>
          <button className="btn btn-outline !py-1 !px-3" onClick={()=> setSteps([...(steps||[]), { title:"", text:"", icon:"search" }])}><Plus size={14}/> Tambah</button>
        </div>
        {(steps||[]).length===0 ? <div className="text-sm text-slate-500">Belum ada langkah.</div> : (
          <div className="space-y-3">
            {steps.map((it,idx)=>(
              <div key={idx} className="p-3 rounded-xl border dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-slate-500">#{idx+1}</span>
                  <button className="p-1 rounded-lg border" onClick={()=>{ if(idx>0){ const arr=steps.slice(); [arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]]; setSteps(arr);} }} title="Naik"><ArrowUp size={14}/></button>
                  <button className="p-1 rounded-lg border" onClick={()=>{ if(idx<steps.length-1){ const arr=steps.slice(); [arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]]; setSteps(arr);} }} title="Turun"><ArrowDown size={14}/></button>
                  <button className="ml-auto p-1 rounded-lg border hover:bg-red-50 dark:hover:bg-slate-800" onClick={()=>{ const arr=steps.slice(); arr.splice(idx,1); setSteps(arr);} } title="Hapus"><Trash2 size={14}/></button>
                </div>
                <div className="grid md:grid-cols-3 gap-2">
                  <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Judul" value={it.title||""} onChange={(e)=>{ const arr=steps.slice(); arr[idx]={...it,title:e.target.value}; setSteps(arr);} } />
                  <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Teks" value={it.text||""} onChange={(e)=>{ const arr=steps.slice(); arr[idx]={...it,text:e.target.value}; setSteps(arr);} } />
                  <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Icon (search/message/calendar/badge-check)" value={it.icon||""} onChange={(e)=>{ const arr=steps.slice(); arr[idx]={...it,icon:e.target.value}; setSteps(arr);} } />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // CTA Editor — locales + data.whatsapp
  const CTAEditor = ({ s }) => {
    const d = readData(s);
    return (
      <div className="grid md:grid-cols-2 gap-3">
        <Labeled label="Judul (per bahasa)">
          <input className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
            value={s.locales[activeLang].title} onChange={(e)=>updateLocal(s.id, activeLang, "title", e.target.value)} />
        </Labeled>
        <Labeled label="Deskripsi (per bahasa)">
          <textarea rows="3" className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
            value={s.locales[activeLang].body_md} onChange={(e)=>updateLocal(s.id, activeLang, "body_md", e.target.value)} />
        </Labeled>
        <Labeled label="Nomor WhatsApp (data.whatsapp)">
          <input className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
            value={d.whatsapp||""} onChange={(e)=>writeData(s, { ...d, whatsapp: e.target.value })} />
        </Labeled>
      </div>
    );
  };

  // CATEGORIES Editor — data.items: [{tag,title,image}]
  const CategoriesEditor = ({ s }) => {
    const d = readData(s);
    const items = Array.isArray(d.items) ? d.items : [];
    const setItems = (arr) => writeData(s, { ...d, items: arr });
    const uploadForIdx = (idx, file) => {
      if(!file) return;
      const ext = file.name.split(".").pop();
      const path = `pages/${page}/${s.id}-cat-${idx}-${Date.now()}.${ext}`;
      uploadToBucket(file, path).then((url)=>{
        const arr = items.slice();
        arr[idx] = { ...(arr[idx]||{}), image: url };
        setItems(arr);
      }).catch(e=>alert(e.message));
    };
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Items</div>
          <button className="btn btn-outline !py-1 !px-3" onClick={()=> setItems([...(items||[]), { tag:"", title:"", image:"" }])}><Plus size={14}/> Tambah</button>
        </div>
        {(items||[]).length===0 ? <div className="text-sm text-slate-500">Belum ada item.</div> : (
          <div className="space-y-3">
            {items.map((it,idx)=>(
              <div key={idx} className="p-3 rounded-xl border dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-slate-500">#{idx+1}</span>
                  <button className="p-1 rounded-lg border" onClick={()=>{ if(idx>0){ const arr=items.slice(); [arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]]; setItems(arr);} }} title="Naik"><ArrowUp size={14}/></button>
                  <button className="p-1 rounded-lg border" onClick={()=>{ if(idx<items.length-1){ const arr=items.slice(); [arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]]; setItems(arr);} }} title="Turun"><ArrowDown size={14}/></button>
                  <button className="ml-auto p-1 rounded-lg border hover:bg-red-50 dark:hover:bg-slate-800" onClick={()=>{ const arr=items.slice(); arr.splice(idx,1); setItems(arr);} } title="Hapus"><Trash2 size={14}/></button>
                </div>
                <div className="grid md:grid-cols-3 gap-2">
                  <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Tag" value={it.tag||""} onChange={(e)=>{ const arr=items.slice(); arr[idx]={...it,tag:e.target.value}; setItems(arr);} } />
                  <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Title" value={it.title||""} onChange={(e)=>{ const arr=items.slice(); arr[idx]={...it,title:e.target.value}; setItems(arr);} } />
                  <div className="flex items-center gap-2">
                    <input className="flex-1 border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Image URL" value={it.image||""} onChange={(e)=>{ const arr=items.slice(); arr[idx]={...it,image:e.target.value}; setItems(arr);} } />
                    <label className="btn btn-outline !py-1 !px-3 cursor-pointer"><Upload size={14}/>
                      <input type="file" accept="image/*" className="hidden" onChange={(e)=> uploadForIdx(idx, e.target.files?.[0])}/>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Banner 1 / Categories Banner / Quotes Banner — single image + optional quotes list
  const BannerEditor = ({ s, withQuotes=false }) => {
    const d = readData(s);
    const set = (obj)=> writeData(s, obj);
    const items = Array.isArray(d.items) ? d.items : [];

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Labeled label="Gambar (data.image)">
            <div className="flex items-center gap-2">
              <input className="flex-1 border rounded-xl px-3 py-2 dark:bg-slate-900" value={d.image||""} onChange={(e)=>set({ ...d, image:e.target.value })}/>
              <label className="btn btn-outline !py-1 !px-3 cursor-pointer"><Upload size={14}/>
                <input type="file" accept="image/*" className="hidden" onChange={(e)=> onUploadToField(s.id, e.target.files?.[0], "image") }/>
              </label>
            </div>
          </Labeled>
        </div>

        {withQuotes && (
          <>
            <div className="flex items-center justify-between mt-1 mb-2">
              <div className="font-medium">Quotes (data.items: name + text)</div>
              <button className="btn btn-outline !py-1 !px-3" onClick={()=> set({ ...d, items:[...(items||[]), { name:"", text:"" }] })}><Plus size={14}/> Tambah</button>
            </div>
            {(items||[]).length===0 ? <div className="text-sm text-slate-500">Belum ada quotes.</div> : (
              <div className="space-y-3">
                {items.map((it,idx)=>(
                  <div key={idx} className="p-3 rounded-xl border dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-slate-500">#{idx+1}</span>
                      <button className="p-1 rounded-lg border" onClick={()=>{ const arr=items.slice(); if(idx>0){ [arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]]; } set({ ...d, items: arr }); }}><ArrowUp size={14}/></button>
                      <button className="p-1 rounded-lg border" onClick={()=>{ const arr=items.slice(); if(idx<items.length-1){ [arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]]; } set({ ...d, items: arr }); }}><ArrowDown size={14}/></button>
                      <button className="ml-auto p-1 rounded-lg border hover:bg-red-50 dark:hover:bg-slate-800" onClick={()=>{ const arr=items.slice(); arr.splice(idx,1); set({ ...d, items: arr }); }}><Trash2 size={14}/></button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2">
                      <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Name" value={it.name||""} onChange={(e)=>{ const arr=items.slice(); arr[idx]={...it,name:e.target.value}; set({ ...d, items: arr }); }} />
                      <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Text" value={it.text||""} onChange={(e)=>{ const arr=items.slice(); arr[idx]={...it,text:e.target.value}; set({ ...d, items: arr }); }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // POPULAR/ABOUT/DESTINATIONS_INTRO/… yang hanya butuh Title + Body
  const SimpleTitleBody = ({ s, titleLabel="Judul", bodyLabel="Deskripsi" }) => (
    <div className="grid md:grid-cols-2 gap-3">
      <Labeled label={`${titleLabel} (${activeLang.toUpperCase()})`}>
        <input className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900" value={s.locales[activeLang].title} onChange={(e)=>updateLocal(s.id, activeLang, "title", e.target.value)} />
      </Labeled>
      <Labeled label={`${bodyLabel} (${activeLang.toUpperCase()})`}>
        <textarea rows="3" className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900" value={s.locales[activeLang].body_md} onChange={(e)=>updateLocal(s.id, activeLang, "body_md", e.target.value)} />
      </Labeled>
    </div>
  );

  // FAQLIST helper (sudah ada di kode asli, tetap tampil di Advanced)

  if (loading) return <div className="container mt-6">{t("misc.loading")}</div>;
  const hasInvalid = sections.some((s) => !s.dataValid);

  return (
    <div className="container mt-3 space-y-4">
{/* STICKY TOOLBAR */}
<div className="sticky top-16 z-[5]">
  <div
    className={`rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md px-3 sm:px-4 ${
      compactToolbar ? "py-1.5" : "py-3"
    } glass shadow-smooth transition-all duration-200`}
  >
    <div className={`flex flex-col ${compactToolbar ? "gap-2" : "gap-3 sm:gap-2"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LayoutList className="opacity-70" size={compactToolbar ? 16 : 18} />
          <h1 className={`${compactToolbar ? "text-base" : "text-lg sm:text-xl"} font-bold`}>Kustomisasi Halaman</h1>
          {hasInvalid && (
            <span
              className={`${compactToolbar ? "text-[10px] px-1.5 py-[1px]" : "text-[11px] px-2 py-0.5"} rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200`}
            >
              JSON invalid
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="hidden sm:flex items-center gap-1 mr-2">
            <button
              className={`btn ${mode === "simple" ? "btn-primary" : "btn-outline"} ${
                compactToolbar ? "!py-1.5 !px-2.5" : "!py-2 !px-3"
              }`}
              onClick={() => setMode("simple")}
            >
              <Settings2 size={compactToolbar ? 14 : 16} />{" "}
              <span className={compactToolbar ? "hidden lg:inline" : ""}>Simple</span>
            </button>
            <button
              className={`btn ${mode === "advanced" ? "btn-primary" : "btn-outline"} ${
                compactToolbar ? "!py-1.5 !px-2.5" : "!py-2 !px-3"
              }`}
              onClick={() => setMode("advanced")}
            >
              <Wrench size={compactToolbar ? 14 : 16} />{" "}
              <span className={compactToolbar ? "hidden lg:inline" : ""}>Advanced JSON</span>
            </button>
          </div>
          <button
            className={`btn btn-outline hidden sm:inline-flex ${
              compactToolbar ? "!py-1.5 !px-2.5" : "!py-2 !px-3"
            }`}
            onClick={addSection}
            title="Tambah Section"
          >
            <Plus size={compactToolbar ? 14 : 16} />{" "}
            <span className={`${compactToolbar ? "hidden md:inline" : "hidden md:inline"}`}>Tambah Section</span>
          </button>
          <button
            className={`btn btn-primary ${compactToolbar ? "!py-1.5 !px-2.5" : "!py-2 !px-3"}`}
            onClick={save}
            disabled={saving || hasInvalid}
            title="Simpan Semua"
          >
            <Save size={compactToolbar ? 14 : 16} />{" "}
            <span className="ml-2">{saving ? "Menyimpan…" : "Simpan Semua"}</span>
          </button>
        </div>
      </div>

      {/* Row 2: filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Halaman</span>
          <select className="px-3 py-2 rounded-2xl border w-[180px]" value={page} onChange={(e) => setPage(e.target.value)}>
            {PAGES.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
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
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar sm:justify-end">
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

      {/* Mobile quick add */}
      <div className="sm:hidden">
        <div className="flex gap-2">
          <button className={`flex-1 btn ${mode === "simple" ? "btn-primary" : "btn-outline"}`} onClick={() => setMode("simple")}>
            Simple
          </button>
          <button className={`flex-1 btn ${mode === "advanced" ? "btn-primary" : "btn-outline"}`} onClick={() => setMode("advanced")}>
            Advanced
          </button>
        </div>
        <button className="btn btn-outline w-full mt-2" onClick={addSection}>
          <Plus size={16} /> Tambah Section
        </button>
      </div>
    </div>
  </div>
</div>

      {/* LIST SECTIONS */}
      <div className="space-y-6">
        {sorted.map((s) => {
          const dataObj = readData(s);
          const images = Array.isArray(dataObj.images) ? dataObj.images : [];

          // Header bar per section
          const HeaderBar = () => (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold uppercase">[{s.section_key}]</span>
                <input value={s.section_key} onChange={(e) => {
                  setSections((prev) => prev.map((x) => (x.id === s.id ? { ...x, section_key: e.target.value, _dirty: true } : x)));
                }} className="px-2 py-1 rounded-xl border dark:bg-slate-900" placeholder="section_key" />
                {!s.dataValid && (
                  <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                    JSON invalid
                  </span>
                )}
                {s._dirty && (<span className="ml-2 text-[11px] text-amber-600">• belum disimpan</span>)}
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl border" onClick={() => move(s.id, -1)} title="Naik"><ArrowUp size={16} /></button>
                <button className="p-2 rounded-xl border" onClick={() => move(s.id, +1)} title="Turun"><ArrowDown size={16} /></button>
                <button className="p-2 rounded-xl border" onClick={() => duplicateSection(s.id)} title="Duplikat"><Copy size={16} /></button>
                <button className="p-2 rounded-xl border" onClick={() => revertSection(s.id)} title="Kembalikan"><RotateCcw size={16} /></button>
                <button className="p-2 rounded-xl border hover:bg-red-50 dark:hover:bg-slate-800" onClick={() => deleteSection(s.id)} title="Hapus"><Trash2 size={16} /></button>
              </div>
            </div>
          );

          // Simple switcher
          const renderSimple = () => {
            switch (s.section_key) {
              case "hero": return <HeroEditor s={s} />;
              case "testimonials": return <TestimonialsEditor s={s} />;
              case "stats": return <StatsEditor s={s} />;
              case "how": return <HowEditor s={s} />;
              case "cta": return <CTAEditor s={s} />;
              case "categories": return <CategoriesEditor s={s} />;
              case "categories_banner": return <BannerEditor s={s} />;
              case "banner1": return <BannerEditor s={s} />;
              case "quotes_banner": return <BannerEditor s={s} withQuotes />;
              case "popular":
              case "about":
              case "destinations_intro":
              default: return <SimpleTitleBody s={s} />;
            }
          };

          // Advanced JSON area
          const renderAdvanced = () => (
            <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm">Data JSON</label>
                  {(s.section_key==="hero") && (
                    <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                      <Upload size={14} /> Upload Gambar → data.images
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUploadToImages(s.id, e.target.files[0])} />
                    </label>
                  )}
                </div>
                <DataTextArea s={s} />
                {!s.dataValid && <div className="text-xs text-red-600 mt-1">JSON tidak valid</div>}
                <div className="mt-2 p-2 rounded-xl border text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2 mb-1"><Eye size={14} /> Pratinjau kunci</div>
                  <pre className="whitespace-pre-wrap break-words">{(() => {
                    try {
                      const obj = JSON.parse(s.dataText || "{}");
                      const keys = Object.keys(obj);
                      return keys.length ? JSON.stringify(keys.reduce((a, k) => (a[k] = Array.isArray(obj[k]) ? `[${obj[k].length}]` : typeof obj[k] === "object" && obj[k] ? "{…}" : obj[k], a), {}), null, 2) : "{}";
                    } catch { return "{}"; }
                  })()}</pre>
                </div>
              </div>
              {/* Localized title/body */}
              <div className="space-y-2">
                <div className="font-medium uppercase">{activeLang}</div>
                <label className="text-sm">Title</label>
                <input className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900 mb-2" value={s.locales[activeLang].title} onChange={(e)=>updateLocal(s.id, activeLang, "title", e.target.value)} />
                <label className="text-sm">Body</label>
                <textarea rows="8" className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900" value={s.locales[activeLang].body_md} onChange={(e)=>updateLocal(s.id, activeLang, "body_md", e.target.value)} />
              </div>
              {/* Gallery quick controls if images exist */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Images size={16} /> <span className="font-medium">Galeri (jika ada data.images)</span>
                  <span className="text-xs text-slate-400">({images.length})</span>
                </div>
                {images.length === 0 ? (
                  <div className="text-sm text-slate-500">Belum ada gambar.</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt="" className="w-full h-24 object-cover rounded-lg border" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition" />
                        <div className="absolute top-1 left-1 flex gap-1">
                          <button className="p-1 rounded bg-white/90 text-slate-700" onClick={()=>{
                            const obj = readData(s); const arr = Array.isArray(obj.images) ? obj.images.slice() : [];
                            if (idx > 0) { [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; }
                            writeData(s, { ...obj, images: arr });
                          }} title="Naik"><ArrowUp size={12} /></button>
                          <button className="p-1 rounded bg-white/90 text-slate-700" onClick={()=>{
                            const obj = readData(s); const arr = Array.isArray(obj.images) ? obj.images.slice() : [];
                            if (idx < arr.length - 1) { [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]]; }
                            writeData(s, { ...obj, images: arr });
                          }} title="Turun"><ArrowDown size={12} /></button>
                        </div>
                        <button className="absolute top-1 right-1 p-1 rounded bg-white/90 text-rose-600" onClick={()=>{
                          const obj = readData(s); const arr = Array.isArray(obj.images) ? obj.images.slice() : [];
                          arr.splice(idx, 1); writeData(s, { ...obj, images: arr });
                        }} title="Hapus"><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );

          return (
            <div key={s.id} className="card p-4">
              <HeaderBar />
              <div className="mt-4">
                {mode === "simple" ? renderSimple() : renderAdvanced()}
              </div>

              {/* Editor FAQ khusus (tetap di Advanced agar struktur sama) */}
              {mode === "advanced" && s.section_key === "faq_list" && (
                <div className="mt-4 text-sm text-slate-500">
                  *Untuk FAQ, gunakan field <code>locales[lang].extra.items</code> dengan format <code>[{{"q":"","a":""}}]</code>.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
