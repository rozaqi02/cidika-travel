// src/pages/admin/Kustomisasi.jsx
import React, { useEffect, useMemo, useState, useRef, useDeferredValue, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion"; // <-- TAMBAHKAN BARIS INI
import { supabase } from "../../lib/supabaseClient";
import { useTranslation } from "react-i18next";
import {
  Trash2, Plus, ArrowUp, ArrowDown, Upload, GripVertical, Save, LayoutList, Languages, Search,
  Copy, RotateCcw, Images, Eye, Wrench, Settings2, Star, ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "react-hot-toast";

const LANGS = ["id", "en", "ja"];

// Hoisted helper components
const Labeled = ({ label, htmlFor, children }) => (
  <div className="block text-sm mb-1">
    {label && (
      <label htmlFor={htmlFor} className="text-slate-600 dark:text-slate-300">
        {label}
      </label>
    )}
    <div className="mt-1">{children}</div>
  </div>
);

const DataTextArea = React.memo(({ s, updateDataText, validateDataText }) => (
  <textarea
    rows="14"
    className={`w-full border rounded-xl px-3 py-2 dark:bg-slate-900 font-mono text-xs ${s.dataValid ? "" : "border-red-500"}`}
    value={s.dataText}
    onChange={(e) => updateDataText(s.id, e.target.value)}
    onBlur={() => validateDataText(s.id)}
  />
));

// Hoisted editor components
const HeroEditor = ({ s, activeLang, updateLocal, updateLocaleExtra, readData, writeData, onUploadToImages }) => {
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
            onChange={(e) => updateLocal(s.id, activeLang, "title", e.target.value)} />
        </Labeled>
        <Labeled label="Judul Besar (body_md)">
          <textarea rows="3" className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
            value={s.locales[activeLang].body_md}
            onChange={(e) => updateLocal(s.id, activeLang, "body_md", e.target.value)} />
        </Labeled>
        <Labeled label="Deskripsi (extra.desc)">
          <textarea rows="4" className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
            value={s.locales[activeLang].extra?.desc || ""}
            onChange={(e) => updateLocaleExtra(s.id, activeLang, { ...(s.locales[activeLang].extra || {}), desc: e.target.value })} />
        </Labeled>
        <Labeled label="Label Tombol (extra.cta_contact_label)">
          <input className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
            value={s.locales[activeLang].extra?.cta_contact_label || ""}
            onChange={(e) => updateLocaleExtra(s.id, activeLang, { ...(s.locales[activeLang].extra || {}), cta_contact_label: e.target.value })} />
        </Labeled>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Chips (data.chips)</div>
            <button className="btn btn-outline !py-1 !px-3" onClick={() => setChips([...(chips || []), { label: "New", q: "" }])}><Plus size={14} /> Tambah Chip</button>
          </div>
          {(chips || []).length === 0 ? <div className="text-sm text-slate-500">Belum ada chip.</div> : (
            <div className="space-y-2">
              {chips.map((c, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input className="col-span-5 border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="label"
                    value={c.label || ""} onChange={(e) => { const arr = chips.slice(); arr[idx] = { ...c, label: e.target.value }; setChips(arr); }} />
                  <input className="col-span-5 border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="q (query)"
                    value={c.q || ""} onChange={(e) => { const arr = chips.slice(); arr[idx] = { ...c, q: e.target.value }; setChips(arr); }} />
                  <div className="col-span-2 flex gap-1 justify-end">
                    <button className="p-2 rounded-xl border" onClick={() => { if (idx > 0) { const arr = chips.slice();[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; setChips(arr); } }}><ArrowUp size={14} /></button>
                    <button className="p-2 rounded-xl border" onClick={() => { if (idx < chips.length - 1) { const arr = chips.slice();[arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]]; setChips(arr); } }}><ArrowDown size={14} /></button>
                    <button className="p-2 rounded-xl border hover:bg-red-50 dark:hover:bg-slate-800" onClick={() => { const arr = chips.slice(); arr.splice(idx, 1); setChips(arr); }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Images size={16} /> <span className="font-medium">Galeri Hero (data.images)</span>
          <span className="text-xs text-slate-400">({images.length})</span>
        </div>
        <label className="btn btn-outline !py-1.5 !px-3 mb-2 inline-flex items-center gap-2 cursor-pointer">
          <Upload size={14} /> Upload Gambar
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUploadToImages(s.id, e.target.files[0])} />
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
                  <button className="p-1 rounded bg-white/90 text-slate-700" onClick={() => { const arr = images.slice(); if (idx > 0) {;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; } setImages(arr); }} title="Naik"><ArrowUp size={12} /></button>
                  <button className="p-1 rounded bg-white/90 text-slate-700" onClick={() => { const arr = images.slice(); if (idx < images.length - 1) {;[arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]]; } setImages(arr); }} title="Turun"><ArrowDown size={12} /></button>
                </div>
                <button className="absolute top-1 right-1 p-1 rounded bg-white/90 text-rose-600" onClick={() => { const arr = images.slice(); arr.splice(idx, 1); setImages(arr); }} title="Hapus"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TestimonialsEditor = ({ items, setItems, loading }) => {
  const updateTestimonial = async (id, patch) => {
  const { error } = await supabase.from('testimonials').update(patch).eq('id', id);
  if (error) {
    toast.error('Gagal update: ' + error.message);
    return false;
  }
  setItems(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  toast.success('Perubahan testimoni disimpan');
  return true;
};

const deleteTestimonial = async (id) => {
  if (!window.confirm('Yakin hapus testimoni ini?')) return;
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) {
    toast.error('Gagal hapus: ' + error.message);
    return;
  }
  setItems(prev => prev.filter(t => t.id !== id));
  toast.success('Testimoni dihapus');
};


  const handleFieldChange = (id, field, value) => {
    setItems(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  
  if (loading) return <div className="text-sm text-slate-500">Memuat testimoni...</div>;

  return (
    <div>
      <div className="font-medium mb-2">Manajemen Testimoni</div>
      {items.length === 0 ? (
        <div className="text-sm text-slate-500">Belum ada testimoni.</div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className={`p-3 rounded-xl border ${it.is_approved ? 'border-emerald-200 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-slate-500">
                   <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={it.is_approved} onChange={(e) => updateTestimonial(it.id, { is_approved: e.target.checked })} />
                    {it.is_approved ? <span className="text-emerald-600 font-medium">Disetujui</span> : 'Belum Disetujui'}
                  </label>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded-lg border hover:bg-red-50 dark:hover:bg-slate-800" onClick={() => deleteTestimonial(it.id)} title="Hapus">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-2">
                <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Nama" value={it.name || ""} onChange={(e) => handleFieldChange(it.id, "name", e.target.value)} />
                <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Kota (opsional)" value={it.city || ""} onChange={(e) => handleFieldChange(it.id, "city", e.target.value)} />
              </div>

              <textarea rows="3" className="mt-2 w-full border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Teks" value={it.text || ""} onChange={(e) => handleFieldChange(it.id, "text", e.target.value)} />
              
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500" />
                  <span className="text-sm">Bintang:</span>
                  <select className="px-3 py-2 rounded-2xl" value={Number(it.stars || 5)} onChange={(e) => handleFieldChange(it.id, "stars", Number(e.target.value))}>
                    {[1, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>{n}</option>))}
                  </select>
                </div>
                <button className="btn btn-primary !py-1 !px-3" onClick={() => updateTestimonial(it.id, { name: it.name, city: it.city, text: it.text, stars: it.stars })}>
                  Simpan Perubahan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FaqListEditor = ({ s, activeLang, updateLocaleExtra }) => {
  const ex = s.locales[activeLang].extra || {};
  const items = Array.isArray(ex.items) ? ex.items : [];
  const setItems = (arr) =>
    updateLocaleExtra(s.id, activeLang, { ...ex, items: arr });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">FAQ Items — {activeLang.toUpperCase()}</div>
        <button className="btn btn-outline !py-1 !px-3" onClick={() => setItems([...(items || []), { q: "", a: "" }])}><Plus size={14} /> Tambah</button>
      </div>

      {(items || []).length === 0 ? (
        <div className="text-sm text-slate-500">Belum ada FAQ untuk bahasa ini.</div>
      ) : (
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="p-3 rounded-xl border dark:border-slate-700">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <GripVertical size={16} /> <span className="text-xs">#{idx + 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded-lg border" onClick={() => { if (idx > 0) { const arr = items.slice();[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; setItems(arr); } }} title="Naik"><ArrowUp size={14} /></button>
                  <button className="p-1 rounded-lg border" onClick={() => { if (idx < items.length - 1) { const arr = items.slice();[arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]]; setItems(arr); } }} title="Turun"><ArrowDown size={14} /></button>
                  <button className="p-1 rounded-lg border hover:bg-red-50 dark:hover:bg-slate-800" onClick={() => { const arr = items.slice(); arr.splice(idx, 1); setItems(arr); }} title="Hapus"><Trash2 size={14} /></button>
                </div>
              </div>

              <input className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900 mb-2" placeholder="Pertanyaan (q)" value={it.q || ""} onChange={(e) => { const arr = items.slice(); arr[idx] = { ...it, q: e.target.value }; setItems(arr); }} />
              <textarea rows="3" className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Jawaban (a)" value={it.a || ""} onChange={(e) => { const arr = items.slice(); arr[idx] = { ...it, a: e.target.value }; setItems(arr); }} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 text-xs text-slate-500">
        *Data disimpan ke <code>page_section_locales.extra.items</code> untuk bahasa aktif.
      </div>
    </div>
  );
};

const StatsEditor = ({ s, readData, writeData }) => {
  const d = readData(s);
  const set = (k, v) => writeData(s, { ...d, [k]: v });
  return (
    <div className="grid md:grid-cols-3 gap-3">
      <Labeled label="Total Trips (data.trips)">
        <input type="number" className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900" value={Number(d.trips || 0)} onChange={(e) => set("trips", Number(e.target.value || 0))} />
      </Labeled>
      <Labeled label="Foto/Video (data.photos)">
        <input type="number" className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900" value={Number(d.photos || 0)} onChange={(e) => set("photos", Number(e.target.value || 0))} />
      </Labeled>
      <Labeled label="Rating (data.rating, contoh: 4.9)">
        <input type="number" step="0.1" className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900" value={Number(d.rating || 0)} onChange={(e) => set("rating", Number(e.target.value || 0))} />
      </Labeled>
    </div>
  );
};

const WhyUsEditor = ({ s, activeLang, updateLocal, updateLocaleExtra }) => {
  const ex = s.locales[activeLang].extra || {};
  const items = Array.isArray(ex.items) ? ex.items : [];
  const setItems = (arr) => updateLocaleExtra(s.id, activeLang, { ...ex, items: arr });

  return (
    <div>
      <div className="font-medium mb-2">Konten Umum - Bahasa: {activeLang.toUpperCase()}</div>
      <div className="grid md:grid-cols-2 gap-3">
        <Labeled label="Judul (title)">
          <input
            className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
            value={s.locales[activeLang].title || ""}
            onChange={(e) => updateLocal(s.id, activeLang, "title", e.target.value)}
          />
        </Labeled>
        <Labeled label="Subjudul (body_md)">
          <input
            className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
            value={s.locales[activeLang].body_md || ""}
            onChange={(e) => updateLocal(s.id, activeLang, "body_md", e.target.value)}
          />
        </Labeled>
      </div>

      <div className="flex items-center justify-between mt-4 mb-2">
        <div className="font-medium">4 Kartu Keunggulan (extra.items)</div>
        <button
          className="btn btn-outline !py-1 !px-3"
          onClick={() => setItems([...(items || []), { title: "", text: "", icon: "badge-check" }])}
        >
          <Plus size={14} /> Tambah Kartu
        </button>
      </div>

      {(items || []).length === 0 ? (
        <div className="text-sm text-slate-500">Belum ada kartu keunggulan untuk bahasa ini.</div>
      ) : (
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="p-3 rounded-xl border dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500">#{idx + 1}</span>
                <button className="p-1 rounded-lg border" onClick={() => { if (idx > 0) { const arr = items.slice();[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; setItems(arr); } }} title="Naik"><ArrowUp size={14} /></button>
                <button className="p-1 rounded-lg border" onClick={() => { if (idx < items.length - 1) { const arr = items.slice();[arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]]; setItems(arr); } }} title="Turun"><ArrowDown size={14} /></button>
                <button className="ml-auto p-1 rounded-lg border hover:bg-red-50 dark:hover:bg-slate-800" onClick={() => { const arr = items.slice(); arr.splice(idx, 1); setItems(arr); }} title="Hapus"><Trash2 size={14} /></button>
              </div>
              <div className="grid md:grid-cols-3 gap-2">
                <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Judul Kartu" value={it.title || ""} onChange={(e) => { const arr = items.slice(); arr[idx] = { ...it, title: e.target.value }; setItems(arr); }} />
                <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Teks Kartu" value={it.text || ""} onChange={(e) => { const arr = items.slice(); arr[idx] = { ...it, text: e.target.value }; setItems(arr); }} />
                <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Icon (badge-check/users/calendar/map-pin)" value={it.icon || ""} onChange={(e) => { const arr = items.slice(); arr[idx] = { ...it, icon: e.target.value }; setItems(arr); }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const HowEditor = ({ s, activeLang, updateLocal, updateLocaleExtra }) => {
  const ex = s.locales[activeLang].extra || {};
  const steps = Array.isArray(ex.steps) ? ex.steps : [];
  const setSteps = (arr) => updateLocaleExtra(s.id, activeLang, { ...ex, steps: arr });

  return (
    <div>
      <div className="font-medium mb-2">Lang: {activeLang.toUpperCase()}</div>
      <div className="grid md:grid-cols-2 gap-3">
        <Labeled label="Judul (title)">
          <input
            className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
            value={s.locales[activeLang].title}
            onChange={(e) => updateLocal(s.id, activeLang, "title", e.target.value)}
          />
        </Labeled>
        <Labeled label="Subjudul (body_md)">
          <input
            className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
            value={s.locales[activeLang].body_md}
            onChange={(e) => updateLocal(s.id, activeLang, "body_md", e.target.value)}
          />
        </Labeled>
      </div>

      <div className="flex items-center justify-between mt-3 mb-2">
        <div className="font-medium">Langkah (extra.steps)</div>
        <button
          className="btn btn-outline !py-1 !px-3"
          onClick={() =>
            setSteps([...(steps || []), { title: "", text: "", icon: "search" }])
          }
        >
          <Plus size={14} /> Tambah
        </button>
      </div>

      {(steps || []).length === 0 ? (
        <div className="text-sm text-slate-500">Belum ada langkah.</div>
      ) : (
        <div className="space-y-3">
          {steps.map((it, idx) => (
            <div key={idx} className="p-3 rounded-xl border dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500">#{idx + 1}</span>
                <button
                  className="p-1 rounded-lg border"
                  onClick={() => {
                    if (idx > 0) {
                      const arr = steps.slice();
                      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                      setSteps(arr);
                    }
                  }}
                  title="Naik"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  className="p-1 rounded-lg border"
                  onClick={() => {
                    if (idx < steps.length - 1) {
                      const arr = steps.slice();
                      [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                      setSteps(arr);
                    }
                  }}
                  title="Turun"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  className="ml-auto p-1 rounded-lg border hover:bg-red-50 dark:hover:bg-slate-800"
                  onClick={() => {
                    const arr = steps.slice();
                    arr.splice(idx, 1);
                    setSteps(arr);
                  }}
                  title="Hapus"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-2">
                <input
                  className="border rounded-xl px-3 py-2 dark:bg-slate-900"
                  placeholder="Judul"
                  value={it.title || ""}
                  onChange={(e) => {
                    const arr = steps.slice();
                    arr[idx] = { ...it, title: e.target.value };
                    setSteps(arr);
                  }}
                />
                <input
                  className="border rounded-xl px-3 py-2 dark:bg-slate-900"
                  placeholder="Teks"
                  value={it.text || ""}
                  onChange={(e) => {
                    const arr = steps.slice();
                    arr[idx] = { ...it, text: e.target.value };
                    setSteps(arr);
                  }}
                />
                <input
                  className="border rounded-xl px-3 py-2 dark:bg-slate-900"
                  placeholder="Icon (search/message/calendar/badge-check)"
                  value={it.icon || ""}
                  onChange={(e) => {
                    const arr = steps.slice();
                    arr[idx] = { ...it, icon: e.target.value };
                    setSteps(arr);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CTAEditor = ({ s, activeLang, updateLocal, readData, writeData }) => {
  const d = readData(s);
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <Labeled label="Judul (per bahasa)">
        <input
          className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
          value={s.locales[activeLang].title}
          onChange={(e) => updateLocal(s.id, activeLang, "title", e.target.value)}
        />
      </Labeled>
      <Labeled label="Deskripsi (per bahasa)">
        <textarea
          rows="3"
          className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
          value={s.locales[activeLang].body_md}
          onChange={(e) => updateLocal(s.id, activeLang, "body_md", e.target.value)}
        />
      </Labeled>
      <Labeled label="Nomor WhatsApp (data.whatsapp)">
        <input
          className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
          value={d.whatsapp || ""}
          onChange={(e) => writeData(s, { ...d, whatsapp: e.target.value })}
        />
      </Labeled>
    </div>
  );
};

const CardsEditor = ({ s, activeLang, updateLocaleExtra, page, uploadToBucket }) => {
  const ex = s.locales[activeLang].extra || {};
  const items = Array.isArray(ex.items) ? ex.items : [];

  const setItems = (arr) => updateLocaleExtra(s.id, activeLang, { ...ex, items: arr });

  const addItem = () => {
    const next = [
      ...(items || []),
      {
        __id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        key: "",
        title: "",
        desc: "",
        image: "",
      },
    ];
    setItems(next);
  };

  const setAt = (idx, patch) => {
    const arr = (items || []).slice();
    arr[idx] = { ...(arr[idx] || {}), ...patch };
    setItems(arr);
  };

  const moveAt = (idx, dir) => {
    const arr = (items || []).slice();
    const t = idx + dir;
    if (t < 0 || t >= arr.length) return;
    [arr[idx], arr[t]] = [arr[t], arr[idx]];
    setItems(arr);
  };

  const removeAt = (idx) => {
    const arr = (items || []).slice();
    arr.splice(idx, 1);
    setItems(arr);
  };

  const uploadImg = async (idx, file) => {
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `pages/${page}/${s.id}-card-${idx}-${Date.now()}.${ext}`;
    try {
      const { error: upErr } = await uploadToBucket.from("assets").upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("assets").getPublicUrl(path);
      const url = pub?.publicUrl;
      setAt(idx, { image: url });
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Cards — {activeLang.toUpperCase()}</div>
        <button className="btn btn-outline !py-1 !px-3" onClick={addItem}>
          <Plus size={14} /> Tambah
        </button>
      </div>

      {(items || []).length === 0 ? (
        <div className="text-sm text-slate-500">Belum ada card untuk bahasa ini.</div>
      ) : (
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div
              key={it.__id || idx}
              className="p-3 rounded-xl border dark:border-slate-700"
            >
              <div className="flex items-center gap-1 justify-between mb-2">
                <div className="text-xs text-slate-500">#{idx + 1}</div>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded-lg border" title="Naik" onClick={() => moveAt(idx, -1)}>
                    <ArrowUp size={14} />
                  </button>
                  <button className="p-1 rounded-lg border" title="Turun" onClick={() => moveAt(idx, +1)}>
                    <ArrowDown size={14} />
                  </button>
                  <button
                    className="p-1 rounded-lg border hover:bg-red-50 dark:hover:bg-slate-800"
                    title="Hapus"
                    onClick={() => removeAt(idx)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-2">
                <Labeled label="Key (slug)">
                  <input
                    className="border rounded-xl px-3 py-2 dark:bg-slate-900"
                    placeholder="contoh: nusa-penida"
                    value={it.key || ""}
                    onChange={(e) => setAt(idx, { key: e.target.value })}
                  />
                </Labeled>
                <Labeled label="Judul">
                  <input
                    className="border rounded-xl px-3 py-2 dark:bg-slate-900"
                    placeholder="Judul"
                    value={it.title || ""}
                    onChange={(e) => setAt(idx, { title: e.target.value })}
                  />
                </Labeled>
              </div>

              <Labeled label="Deskripsi">
                <textarea
                  rows="3"
                  className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
                  placeholder="Deskripsi singkat"
                  value={it.desc || ""}
                  onChange={(e) => setAt(idx, { desc: e.target.value })}
                />
              </Labeled>

              <Labeled label="Gambar">
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 border rounded-xl px-3 py-2 dark:bg-slate-900"
                    placeholder="URL gambar atau upload di kanan"
                    value={it.image || ""}
                    onChange={(e) => setAt(idx, { image: e.target.value })}
                  />
                  <label className="btn btn-outline !py-1 !px-3 cursor-pointer">
                    <Upload size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => uploadImg(idx, e.target.files?.[0])}
                    />
                  </label>
                </div>
              </Labeled>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 text-xs text-slate-500">
        *Data tersimpan ke <code>page_section_locales.extra.items</code> untuk bahasa aktif.
      </div>
    </div>
  );
};

const CategoriesEditor = ({ s, readData, writeData, page, uploadToBucket }) => {
  const d = readData(s);
  const items = Array.isArray(d.items) ? d.items : [];
  const setItems = (arr) => writeData(s, { ...d, items: arr });

  const uploadForIdx = async (idx, file) => {
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `pages/${page}/${s.id}-cat-${idx}-${Date.now()}.${ext}`;
    try {
      const { error: upErr } = await uploadToBucket.from("assets").upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("assets").getPublicUrl(path);
      const url = pub?.publicUrl;
      const arr = items.slice();
      arr[idx] = { ...(arr[idx] || {}), image: url };
      setItems(arr);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Items</div>
        <button
          className="btn btn-outline !py-1 !px-3"
          onClick={() => setItems([...(items || []), { __id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, tag: "", title: "", image: "" }])}
        >
          <Plus size={14} /> Tambah
        </button>
      </div>

      {(items || []).length === 0 ? (
        <div className="text-sm text-slate-500">Belum ada item.</div>
      ) : (
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div
              key={it.__id || idx}
              className="p-3 rounded-xl border dark:border-slate-700"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500">#{idx + 1}</span>
                <button
                  className="p-1 rounded-lg border"
                  onClick={() => {
                    if (idx > 0) {
                      const arr = items.slice();
                      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                      setItems(arr);
                    }
                  }}
                  title="Naik"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  className="p-1 rounded-lg border"
                  onClick={() => {
                    if (idx < items.length - 1) {
                      const arr = items.slice();
                      [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                      setItems(arr);
                    }
                  }}
                  title="Turun"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  className="ml-auto p-1 rounded-lg border hover:bg-red-50 dark:hover:bg-slate-800"
                  onClick={() => {
                    const arr = items.slice();
                    arr.splice(idx, 1);
                    setItems(arr);
                  }}
                  title="Hapus"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-2">
                <input
                  className="border rounded-xl px-3 py-2 dark:bg-slate-900"
                  placeholder="Tag"
                  value={it.tag || ""}
                  onChange={(e) => {
                    const arr = items.slice();
                    arr[idx] = { ...it, tag: e.target.value };
                    setItems(arr);
                  }}
                />
                <input
                  className="border rounded-xl px-3 py-2 dark:bg-slate-900"
                  placeholder="Title"
                  value={it.title || ""}
                  onChange={(e) => {
                    const arr = items.slice();
                    arr[idx] = { ...it, title: e.target.value };
                    setItems(arr);
                  }}
                />
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 border rounded-xl px-3 py-2 dark:bg-slate-900"
                    placeholder="Image URL"
                    value={it.image || ""}
                    onChange={(e) => {
                      const arr = items.slice();
                      arr[idx] = { ...it, image: e.target.value };
                      setItems(arr);
                    }}
                  />
                  <label className="btn btn-outline !py-1 !px-3 cursor-pointer">
                    <Upload size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => uploadForIdx(idx, e.target.files?.[0])}
                    />
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

const BannerEditor = ({ s, withQuotes = false, readData, writeData, onUploadToField }) => {
  const d = readData(s);
  const set = (obj) => writeData(s, obj);
  const items = Array.isArray(d.items) ? d.items : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Labeled label="Gambar (data.image)">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 border rounded-xl px-3 py-2 dark:bg-slate-900"
              value={d.image || ""}
              onChange={(e) => set({ ...d, image: e.target.value })}
            />
            <label className="btn btn-outline !py-1 !px-3 cursor-pointer">
              <Upload size={14} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onUploadToField(s.id, e.target.files?.[0], "image")}
              />
            </label>
          </div>
        </Labeled>
      </div>

      {withQuotes && (
        <>
          <div className="flex items-center justify-between mt-1 mb-2">
            <div className="font-medium">Quotes (data.items: name + text)</div>
            <button
              className="btn btn-outline !py-1 !px-3"
              onClick={() => set({ ...d, items: [...(items || []), { __id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, name: "", text: "" }] })}
            >
              <Plus size={14} /> Tambah
            </button>
          </div>

          {(items || []).length === 0 ? (
            <div className="text-sm text-slate-500">Belum ada quotes.</div>
          ) : (
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div
                  key={it.__id || idx}
                  className="p-3 rounded-xl border dark:border-slate-700"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-slate-500">#{idx + 1}</span>
                    <button
                      className="p-1 rounded-lg border"
                      onClick={() => {
                        const arr = items.slice();
                        if (idx > 0) [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                        set({ ...d, items: arr });
                      }}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="p-1 rounded-lg border"
                      onClick={() => {
                        const arr = items.slice();
                        if (idx < items.length - 1) [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                        set({ ...d, items: arr });
                      }}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      className="ml-auto p-1 rounded-lg border hover:bg-red-50 dark:hover:bg-slate-800"
                      onClick={() => {
                        const arr = items.slice();
                        arr.splice(idx, 1);
                        set({ ...d, items: arr });
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-2">
                    <input
                      className="border rounded-xl px-3 py-2 dark:bg-slate-900"
                      placeholder="Name"
                      value={it.name || ""}
                      onChange={(e) => {
                        const arr = items.slice();
                        arr[idx] = { ...it, name: e.target.value };
                        set({ ...d, items: arr });
                      }}
                    />
                    <input
                      className="border rounded-xl px-3 py-2 dark:bg-slate-900"
                      placeholder="Text"
                      value={it.text || ""}
                      onChange={(e) => {
                        const arr = items.slice();
                        arr[idx] = { ...it, text: e.target.value };
                        set({ ...d, items: arr });
                      }}
                    />
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

const SimpleTitleBody = ({ s, activeLang, updateLocal, titleLabel = "Judul", bodyLabel = "Deskripsi" }) => (
  <div className="grid md:grid-cols-2 gap-3">
    <Labeled label={`${titleLabel} (${activeLang.toUpperCase()})`}>
      <input
        className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
        value={s.locales[activeLang].title}
        onChange={(e) => updateLocal(s.id, activeLang, "title", e.target.value)}
      />
    </Labeled>
    <Labeled label={`${bodyLabel} (${activeLang.toUpperCase()})`}>
      <textarea
        rows="3"
        className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
        value={s.locales[activeLang].body_md}
        onChange={(e) => updateLocal(s.id, activeLang, "body_md", e.target.value)}
      />
    </Labeled>
  </div>
);

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
  const [hideToolbar, setHideToolbar] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const [pkgList, setPkgList] = useState([]);
  const [pkgLoading, setPkgLoading] = useState(false);
  const [pkgSaving, setPkgSaving] = useState(false);

  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);

  const deferredQuery = useDeferredValue(query);

  const loadTestimonials = async () => {
    setTestimonialsLoading(true);
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
  console.error("Error fetching testimonials for admin:", error);
  setTestimonials([]);
  toast.error("Gagal memuat testimoni");
} else {
  setTestimonials(data || []);
}
    setTestimonialsLoading(false);
  };

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      const last = lastScrollYRef.current;
      const down = y > last;
      const delta = Math.abs(y - last);

      if (delta > 14) {
        setHideToolbar(down && y > 80);
        setCompactToolbar(y > 40);
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
  setSections([]); setOriginal([]); setLoading(false);
  toast.error("Gagal memuat sections");
  return;
}

    const mapped = mapFromDb(data);
    setSections(mapped);
    setOriginal(mapped);
    setLoading(false);
    // Default collapsed for all sections
    const expandedState = mapped.reduce((acc, s) => {
      acc[s.id] = false;
      return acc;
    }, {});
    setExpandedSections(expandedState);
  };

  const loadPackages = async () => {
    setPkgLoading(true);
    const { data, error } = await supabase
      .from("packages")
      .select("id, slug, is_active, default_image, created_at, package_locales(*), price_tiers(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setPkgList([]); setPkgLoading(false);
      return;
    }

    const mapped = (data || []).map((p) => ({
      id: p.id,
      slug: p.slug,
      is_active: p.is_active,
      default_image: p.default_image,
      locales: LANGS.reduce((acc, l) => {
  const r = p.package_locales?.find((x) => x.lang === l) || {};
  acc[l] = {
    title: r.title || "",
    summary: r.summary || "",
    // tambahan agar admin bisa edit semua
    spots: Array.isArray(r.spots) ? r.spots : [],
    itinerary: Array.isArray(r.itinerary) ? r.itinerary : [],
    include: Array.isArray(r.include) ? r.include : [],
    note: r.note || "",
  };
  return acc;
}, {}),
      tiers: (p.price_tiers || [])
        .slice()
        .sort((a, b) =>
          a.audience === b.audience ? a.pax - b.pax : a.audience.localeCompare(b.audience)
        )
        .map((t) => ({
          id: t.id,
          pax: t.pax,
          price_idr: t.price_idr,
          audience: t.audience,
          _new: false,
          _dirty: false,
          _deleted: false,
        })),
    }));
    setPkgList(mapped);
    setPkgLoading(false);
  };

  useEffect(() => {
    load();
    if (page === "explore") loadPackages();
    if (page === "home") loadTestimonials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // mark dirty field paket
  const updatePkgField = (id, key, value) => {
    setPkgList(prev => prev.map(p => p.id === id ? ({ ...p, [key]: value, _dirty: true }) : p));
  };

  // mark dirty field lokal
  const updatePkgLocale = (id, lang, key, value) => {
    setPkgList(prev => prev.map(p => p.id === id ? ({
      ...p,
      _dirty: true,
      locales: { ...p.locales, [lang]: { ...(p.locales[lang] || {}), [key]: value } },
    }) : p));
  };

  // upload gambar default paket
  const onUploadPkgImage = async (p, file) => {
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `packages/${p.id}-default-${Date.now()}.${ext}`;
try {
  const url = await uploadToBucket(file, path);
  updatePkgField(p.id, "default_image", url);
  toast.success("Gambar paket diperbarui");
} catch (e) {
  toast.error(e.message || "Gagal upload gambar");
}

  };

  // ===== Price Tiers helpers =====
  const updateTier = (pkgId, idx, patch) => {
    setPkgList((prev) =>
      prev.map((p) =>
        p.id === pkgId
          ? {
              ...p,
              _dirty: true,
              tiers: (p.tiers || []).map((t, i) =>
                i === idx ? { ...t, ...patch, _dirty: true } : t
              ),
            }
          : p
      )
    );
  };

  const addTier = (pkgId, audience = "domestic") => {
    setPkgList((prev) =>
      prev.map((p) => {
        if (p.id !== pkgId) return p;
        const existing = (p.tiers || []).filter((t) => t.audience === audience && !t._deleted);
        const suggestedPax =
          Math.max(0, ...existing.map((t) => Number(t.pax) || 0)) + 1;
        const newTier = {
          id: null,
          pax: Math.min(suggestedPax, 6),
          price_idr: 0,
          audience,
          _new: true,
          _dirty: true,
          _deleted: false,
        };
        return { ...p, _dirty: true, tiers: [...(p.tiers || []), newTier] };
      })
    );
  };

  const removeTier = (pkgId, idx) => {
    setPkgList((prev) =>
      prev.map((p) => {
        if (p.id !== pkgId) return p;
        const tiers = (p.tiers || []).slice();
        const t = tiers[idx];
        if (!t) return p;
        if (t.id == null) {
          tiers.splice(idx, 1);
        } else {
          tiers[idx] = { ...t, _deleted: true, _dirty: true };
        }
        return { ...p, _dirty: true, tiers };
      })
    );
  };

  const arrToText = (arr) => (Array.isArray(arr) ? arr.join("\n") : "");
const textToArr = (txt) =>
  (txt || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);


  const savePackages = async () => {
    setPkgSaving(true);
    try {
      for (const p of pkgList) {
        const seen = new Set();
        for (const t of p.tiers || []) {
          if (t._deleted) continue;
          const k = `${t.audience}:${t.pax}`;
          if (seen.has(k)) {
            throw new Error(`Duplikat tier ${k} pada paket "${p.slug}".`);
          }
          seen.add(k);
        }
      }

      for (const p of pkgList) {
        if (p._dirty) {
          const { error: e1 } = await supabase
            .from("packages")
            .update({ slug: p.slug, is_active: p.is_active, default_image: p.default_image })
            .eq("id", p.id);
          if (e1) throw e1;

          for (const lang of LANGS) {
const L = p.locales[lang] || {};
const payload = {
  package_id: p.id,
  lang,
  title: L.title || "",
  summary: L.summary || null,
  // simpan field tambahan
  spots: Array.isArray(L.spots) ? L.spots : null,
  itinerary: Array.isArray(L.itinerary) ? L.itinerary : null,
  include: Array.isArray(L.include) ? L.include : null,
  note: L.note || null,
};
const { error: e2 } = await supabase
  .from("package_locales")
  .upsert(payload, { onConflict: "package_id,lang" });
if (e2) throw e2;

          }
        }

        for (const t of p.tiers || []) {
          if (t._deleted && t.id) {
            const { error: delErr } = await supabase.from("price_tiers").delete().eq("id", t.id);
            if (delErr) throw delErr;
            continue;
          }
          if (t._deleted) continue;

          const payloadTier = {
            package_id: p.id,
            pax: Number(t.pax || 1),
            price_idr: Number(t.price_idr || 0),
            audience: t.audience || "domestic",
          };

          if (t.id) {
            if (t._dirty) {
              const { error: upErr } = await supabase
                .from("price_tiers")
                .update(payloadTier)
                .eq("id", t.id);
              if (upErr) throw upErr;
            }
          } else {
            const { error: insErr } = await supabase
              .from("price_tiers")
              .insert(payloadTier);
            if (insErr) throw insErr;
          }
        }
      }

      toast.success("Packages & Price Tiers tersimpan");
await loadPackages();
    } catch (e) {
  console.error(e);
  toast.error(e.message || "Gagal menyimpan packages/tiers");
} finally {
      setPkgSaving(false);
    }
  };

  // buat paket baru
  const addPackage = async () => {
    const slug = prompt("Slug paket (tanpa spasi, unik):");
    if (!slug) return;
    const { data, error } = await supabase
      .from("packages")
      .insert({ slug, is_active: true, default_image: "" })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }

    for (const lang of LANGS) {
      await supabase.from("package_locales")
        .upsert({ package_id: data.id, lang, title: "", summary: null }, { onConflict: "package_id,lang" });
    }
    await loadPackages();
  };

  // hapus paket
  const deletePackageRow = async (id) => {
    if (!confirm("Hapus paket ini?")) return;
const { error } = await supabase.from("packages").delete().eq("id", id);
if (error) { toast.error(error.message); return; }
await loadPackages();
toast.success("Paket dihapus");

  };

  // === UPDATE HELPERS (langsung, tanpa startTransition) ===
  const updateLocal = (sid, lang, field, value) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sid
          ? {
              ...s,
              _dirty: true,
              locales: {
                ...s.locales,
                [lang]: { ...s.locales[lang], [field]: value },
              },
            }
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
              _dirty: true,
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
      prev.map((s) => (s.id === sid ? { ...s, dataText: text, _dirty: true } : s))
    );
  };

  const validateDataText = (sid) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sid) return s;
        let valid = true;
        try {
          JSON.parse(s.dataText || "{}");
        } catch {
          valid = false;
        }
        return { ...s, dataValid: valid };
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
    if (error) { toast.error(error.message); return; }
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
    toast.success("Section berhasil diduplikasi");
  };

  const revertSection = (sid) => {
    const orig = original.find((s) => s.id === sid);
    if (!orig) return;
    setSections((prev) => prev.map((s) => (s.id === sid ? { ...orig } : s)));
  };

  const deleteSection = async (id) => {
    if (!confirm("Hapus section ini?")) return;
const { error } = await supabase.from("page_sections").delete().eq("id", id);
if (error) { toast.error(error.message); return; }
setSections((prev) => prev.filter((s) => s.id !== id));
toast.success("Section dihapus");
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

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
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
      toast.success("Semua perubahan tersimpan");
      await load();
    } catch (e) {
  console.error(e);
  toast.error(e.message || "Gagal menyimpan");
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
    } catch (e) { toast.error(e.message || "Gagal upload"); }
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

  // === FILTERED (menggunakan 'sections' langsung) ===
  const sorted = useMemo(
    () =>
      sections.slice()
        .sort((a, b) => a.sort_index - b.sort_index)
        .filter((s) => {
          const q = deferredQuery.trim().toLowerCase();
          if (!q) return true;
          const title = (s.locales?.[activeLang]?.title || "").toLowerCase();
          return (s.section_key || "").toLowerCase().includes(q) || title.includes(q);
        }),
    [sections, deferredQuery, activeLang]
  );


  // Helpers to read/write JSON path in dataText
  const readData = (s) => { try { return JSON.parse(s.dataText || "{}"); } catch { return {}; } };
  const writeData = (s, obj) => updateDataText(s.id, JSON.stringify(obj || {}, null, 2));

  // ======= RENDER =======
  if (loading) return <div className="container mt-6">{t("misc.loading")}</div>;
  const hasInvalid = sections.some((s) => !s.dataValid);

  return (
    <div className="container mt-3 space-y-4">
      {/* STICKY TOOLBAR */}
      <div
        className={`sticky top-16 z-[5] transition-transform duration-200 ${hideToolbar ? "-translate-y-[120%]" : "translate-y-0"
          }`}
      >
        <div
          className={`rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md px-3 sm:px-4 ${compactToolbar ? "py-1.5" : "py-3"
            } glass shadow-smooth transition-all duration-200`}
        >
          <div className={`flex flex-col ${compactToolbar ? "gap-2" : "gap-3 sm:gap-2"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <LayoutList className="opacity-70" size={compactToolbar ? 16 : 18} />
                <h1 className={`${compactToolbar ? "text-base" : "text-lg sm:text-xl"} font-bold`}>
                  Kustomisasi Halaman
                </h1>
                {hasInvalid && (
                  <span
                    className={`${compactToolbar ? "text-[10px] px-1.5 py-[1px]" : "text-[11px] px-2 py-0.5"
                      } rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200`}
                  >
                    JSON invalid
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Mode toggle */}
                <div className="hidden sm:flex items-center gap-1 mr-2">
                  <button
                    className={`btn ${mode === "simple" ? "btn-primary" : "btn-outline"} ${compactToolbar ? "!py-1.5 !px-2.5" : "!py-2 !px-3"
                      }`}
                    onClick={() => setMode("simple")}
                  >
                    <Settings2 size={compactToolbar ? 14 : 16} />{" "}
                    <span className={compactToolbar ? "hidden lg:inline" : ""}>Simple</span>
                  </button>
                  <button
                    className={`btn ${mode === "advanced" ? "btn-primary" : "btn-outline"} ${compactToolbar ? "!py-1.5 !px-2.5" : "!py-2 !px-3"
                      }`}
                    onClick={() => setMode("advanced")}
                  >
                    <Wrench size={compactToolbar ? 14 : 16} />{" "}
                    <span className={compactToolbar ? "hidden lg:inline" : ""}>Advanced JSON</span>
                  </button>
                </div>
                <button
                  className={`btn btn-outline hidden sm:inline-flex ${compactToolbar ? "!py-1.5 !px-2.5" : "!py-2 !px-3"
                    }`}
                  onClick={addSection}
                  title="Tambah Section"
                >
                  <Plus size={compactToolbar ? 14 : 16} />{" "}
                  <span className={`${compactToolbar ? "hidden md:inline" : "hidden md:inline"}`}>
                    Tambah Section
                  </span>
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
                <select
                  className="px-3 py-2 rounded-2xl border w-[180px]"
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
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari section / judul…"
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border-slate-200 dark:border-slate-700"
                />
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
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
                <button
                  className={`flex-1 btn ${mode === "simple" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setMode("simple")}
                >
                  Simple
                </button>
                <button
                  className={`flex-1 btn ${mode === "advanced" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setMode("advanced")}
                >
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

      {/* ===== Explore: kelola Packages & Price Tiers ===== */}
      {page === "explore" && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">
              Kelola Packages ({pkgList.length}) — {activeLang.toUpperCase()}
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-outline !py-1.5 !px-3" onClick={addPackage}>
                <Plus size={14} /> Tambah Paket
              </button>
              <button
                className="btn btn-primary !py-1.5 !px-3"
                onClick={savePackages}
                disabled={pkgSaving}
                title="Simpan perubahan packages"
              >
                <Save size={14} /> {pkgSaving ? "Menyimpan…" : "Simpan Packages"}
              </button>
            </div>
          </div>

          {pkgLoading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : pkgList.length === 0 ? (
            <div className="text-sm text-slate-500">Belum ada paket.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pkgList.map((p) => (
                <div key={p.id} className="rounded-xl border p-3 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{p.id.slice(0, 8)}…</span>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={!!p.is_active}
                          onChange={(e) => updatePkgField(p.id, "is_active", e.target.checked)}
                        />
                        aktif
                      </label>
                      <button
                        className="p-1 rounded-lg border hover:bg-red-50 dark:hover:bg-slate-800"
                        onClick={() => deletePackageRow(p.id)}
                        title="Hapus paket"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <input
                    className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
                    placeholder="slug"
                    value={p.slug || ""}
                    onChange={(e) => updatePkgField(p.id, "slug", e.target.value)}
                  />

                  {/* Default image */}
                  <div>
                    <div className="text-xs mb-1">Default Image</div>
                    {p.default_image && (
                      <img
                        src={p.default_image}
                        alt=""
                        className="h-28 w-full object-cover rounded-lg border mb-2"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        className="flex-1 border rounded-xl px-3 py-2 dark:bg-slate-900"
                        placeholder="URL gambar"
                        value={p.default_image || ""}
                        onChange={(e) => updatePkgField(p.id, "default_image", e.target.value)}
                      />
                      <label className="btn btn-outline !py-1 !px-3 cursor-pointer">
                        <Upload size={14} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onUploadPkgImage(p, e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </div>

{/* Locale fields */}
<div>
  <div className="text-xs mb-1">Bahasa: {activeLang.toUpperCase()}</div>

  {/* Title */}
  <input
    className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900 mb-2"
    placeholder="Title"
    value={p.locales?.[activeLang]?.title || ""}
    onChange={(e) => updatePkgLocale(p.id, activeLang, "title", e.target.value)}
  />

  {/* Summary */}
  <textarea
    rows={2}
    className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900 mb-3"
    placeholder="Summary"
    value={p.locales?.[activeLang]?.summary || ""}
    onChange={(e) => updatePkgLocale(p.id, activeLang, "summary", e.target.value)}
  />

  {/* Spots */}
  <label className="text-xs text-slate-500">Spots (satu baris = satu item)</label>
  <textarea
    rows={3}
    className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900 mb-3 font-mono text-xs"
    placeholder={"contoh:\nKelingking Beach\nBroken Beach\nAngel’s Billabong"}
    value={arrToText(p.locales?.[activeLang]?.spots)}
    onChange={(e) => updatePkgLocale(p.id, activeLang, "spots", textToArr(e.target.value))}
  />

  {/* Itinerary */}
  <label className="text-xs text-slate-500">Itinerary (satu baris = satu langkah)</label>
  <textarea
    rows={6}
    className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900 mb-3 font-mono text-xs"
    placeholder={"07.15 Meeting Point di Sanur\n08.00 Berangkat ke Nusa Penida\n..."}
    value={arrToText(p.locales?.[activeLang]?.itinerary)}
    onChange={(e) => updatePkgLocale(p.id, activeLang, "itinerary", textToArr(e.target.value))}
  />

  {/* Include */}
  <label className="text-xs text-slate-500">Include (satu baris = satu item)</label>
  <textarea
    rows={4}
    className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900 mb-3 font-mono text-xs"
    placeholder={"Tiket speed boat PP\nAC car (BBM + Driver)\n..."}
    value={arrToText(p.locales?.[activeLang]?.include)}
    onChange={(e) => updatePkgLocale(p.id, activeLang, "include", textToArr(e.target.value))}
  />

  {/* Note */}
  <label className="text-xs text-slate-500">Note</label>
  <textarea
    rows={3}
    className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
    placeholder="Catatan tambahan paket"
    value={p.locales?.[activeLang]?.note || ""}
    onChange={(e) => updatePkgLocale(p.id, activeLang, "note", e.target.value)}
  />
</div>


                  {/* Price Tiers */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">Price Tiers</div>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-outline !py-1 !px-2"
                          onClick={() => addTier(p.id, "domestic")}
                        >
                          + Domestik
                        </button>
                        <button
                          className="btn btn-outline !py-1 !px-2"
                          onClick={() => addTier(p.id, "foreign")}
                        >
                          + Mancanegara
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2 mt-2">
                      {["domestic", "foreign"].map((aud) => {
                        const label = aud === "domestic" ? "Domestik" : "Mancanegara";
                        const list = (p.tiers || [])
                          .filter((t) => t.audience === aud && !t._deleted)
                          .sort((a, b) => a.pax - b.pax);

                        return (
                          <div key={aud} className="p-2 rounded-xl border dark:border-slate-700">
                            <div className="text-xs mb-2">{label}</div>
                            {list.length === 0 ? (
                              <div className="text-xs text-slate-500">Belum ada tier.</div>
                            ) : (
                              <div className="space-y-1">
                                {list.map((t) => {
                                  const idx = (p.tiers || []).findIndex((z) => z === t);
                                  return (
                                    <div
                                      key={t.id || `new-${idx}`}
                                      className="grid grid-cols-12 gap-2 items-center"
                                    >
                                      <input
                                        type="number"
                                        min={1}
                                        className="col-span-3 border rounded-xl px-3 py-1.5 dark:bg-slate-900"
                                        value={t.pax}
                                        onChange={(e) =>
                                          updateTier(p.id, idx, {
                                            pax: Number(e.target.value || 1),
                                          })
                                        }
                                        placeholder="Pax"
                                        title="Pax"
                                      />
                                      <input
                                        type="number"
                                        min={0}
                                        className="col-span-7 border rounded-xl px-3 py-1.5 dark:bg-slate-900"
                                        value={t.price_idr}
                                        onChange={(e) =>
                                          updateTier(p.id, idx, {
                                            price_idr: Number(e.target.value || 0),
                                          })
                                        }
                                        placeholder="Harga IDR"
                                        title="Harga per pax (IDR)"
                                      />
                                      <button
                                        className="col-span-2 p-2 rounded-xl border hover:bg-red-50 dark:hover:bg-slate-800"
                                        onClick={() => removeTier(p.id, idx)}
                                        title="Hapus tier"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* penanda dirty */}
                  {p._dirty && (
                    <div className="text-[11px] text-amber-600 mt-1">• belum disimpan</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-2 text-xs text-slate-500">
            *Data tersimpan ke tabel <code>packages</code> & <code>package_locales</code>.
          </div>
        </div>
      )}

      {/* ===== Sections ===== */}
      <div className="space-y-6">
        {sorted.map((s) => {
          const isExpanded = expandedSections[s.id];

          // Header bar per section
          const HeaderBar = () => (
            <div className="flex flex-wrap items-center justify-between gap-2 cursor-pointer" onClick={() => toggleSection(s.id)}>
              <div className="flex items-center gap-2 flex-1">
                <span className="font-semibold uppercase">[{s.section_key}]</span>
                <input
                  value={s.section_key}
                  onChange={(e) => {
                    setSections((prev) =>
                      prev.map((x) =>
                        x.id === s.id ? { ...x, section_key: e.target.value, _dirty: true } : x
                      )
                    );
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent toggle on input click
                  className="px-2 py-1 rounded-xl border dark:bg-slate-900"
                  placeholder="section_key"
                />
                {!s.dataValid && (
                  <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                    JSON invalid
                  </span>
                )}
                {s._dirty && (
                  <span className="ml-2 text-[11px] text-amber-600">• belum disimpan</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl border" onClick={(e) => { e.stopPropagation(); move(s.id, -1); }} title="Naik">
                  <ArrowUp size={16} />
                </button>
                <button className="p-2 rounded-xl border" onClick={(e) => { e.stopPropagation(); move(s.id, +1); }} title="Turun">
                  <ArrowDown size={16} />
                </button>
                <button
                  className="p-2 rounded-xl border"
                  onClick={(e) => { e.stopPropagation(); duplicateSection(s.id); }}
                  title="Duplikat"
                >
                  <Copy size={16} />
                </button>
                <button
                  className="p-2 rounded-xl border"
                  onClick={(e) => { e.stopPropagation(); revertSection(s.id); }}
                  title="Kembalikan"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  className="p-2 rounded-xl border hover:bg-red-50 dark:hover:bg-slate-800"
                  onClick={(e) => { e.stopPropagation(); deleteSection(s.id); }}
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
          );

          // SIMPLE editors
          const renderSimple = () => {
switch (s.section_key) {
  case "hero":
  case "hero_contact":  // Tambahkan ini agar hero contact pakai editor sama seperti hero (dengan unggah gambar)
    return <HeroEditor s={s} activeLang={activeLang} updateLocal={updateLocal} updateLocaleExtra={updateLocaleExtra} readData={readData} writeData={writeData} onUploadToImages={onUploadToImages} />;
  case "whyus":           
    return <WhyUsEditor s={s} activeLang={activeLang} updateLocal={updateLocal} updateLocaleExtra={updateLocaleExtra} />;
  case "testimonials":
    return (
      <div className="space-y-6">
        <SimpleTitleBody s={s} activeLang={activeLang} updateLocal={updateLocal} bodyLabel="Subjudul (opsional)" />
        <div className="border-t dark:border-slate-700 my-4" />
        <TestimonialsEditor items={testimonials} setItems={setTestimonials} loading={testimonialsLoading} />
      </div>
    );
  case "stats":           
    return <StatsEditor s={s} readData={readData} writeData={writeData} />;
  case "stats":
    return <StatsEditor s={s} activeLang={activeLang} updateLocal={updateLocal} />;
  case "how":
    return <HowEditor s={s} activeLang={activeLang} updateLocal={updateLocal} updateLocaleExtra={updateLocaleExtra} />;
  case "cta":
    return <CTAEditor s={s} activeLang={activeLang} updateLocal={updateLocal} readData={readData} writeData={writeData} />;
  case "cards":
    return <CardsEditor s={s} activeLang={activeLang} updateLocaleExtra={updateLocaleExtra} page={page} uploadToBucket={supabase.storage} />;
  case "categories":
    return <CategoriesEditor s={s} readData={readData} writeData={writeData} page={page} uploadToBucket={supabase.storage} />;
  case "categories_banner":
  case "banner1":
    return <BannerEditor s={s} readData={readData} writeData={writeData} onUploadToField={onUploadToField} />;
  case "quotes_banner":
    return <BannerEditor s={s} withQuotes readData={readData} writeData={writeData} onUploadToField={onUploadToField} />;
  case "faq_list":
    return <FaqListEditor s={s} activeLang={activeLang} updateLocaleExtra={updateLocaleExtra} />;
  case "popular":
  case "about":
  case "destinations_intro":
  default:
    return <SimpleTitleBody s={s} activeLang={activeLang} updateLocal={updateLocal} />;
}
          };

          // ADVANCED JSON editor
          const renderAdvanced = () => {
            const obj = readData(s);
            const images = Array.isArray(obj.images) ? obj.images : [];

            return (
              <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-4 mt-4">
                {/* Data JSON */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Data JSON</label>
                    {s.section_key === "hero" && (
                      <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                        <Upload size={14} /> Upload Gambar → data.images
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            e.target.files?.[0] && onUploadToImages(s.id, e.target.files[0])
                          }
                        />
                      </label>
                    )}
                  </div>
                  <DataTextArea s={s} updateDataText={updateDataText} validateDataText={validateDataText} />
                  {!s.dataValid && (
                    <div className="text-xs text-red-600 mt-1">JSON tidak valid</div>
                  )}

                  <div className="mt-2 p-2 rounded-xl border text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye size={14} /> Pratinjau kunci
                    </div>
                    <pre className="whitespace-pre-wrap break-words">
                      {(() => {
                        try {
                          const obj2 = JSON.parse(s.dataText || "{}");
                          const keys = Object.keys(obj2);
                          return keys.length
                            ? JSON.stringify(
                                keys.reduce((a, k) => {
                                  a[k] =
                                    Array.isArray(obj2[k])
                                      ? `[${obj2[k].length}]`
                                      : typeof obj2[k] === "object" && obj2[k]
                                      ? "{…}"
                                      : obj2[k];
                                  return a;
                                }, {}),
                                null,
                                2
                              )
                            : "{}";
                        } catch {
                          return "{}";
                        }
                      })()}
                    </pre>
                  </div>
                </div>

                {/* Localized title/body */}
                <div className="space-y-2">
                  <div className="font-medium uppercase">{activeLang}</div>
                  <label className="text-sm">Title</label>
                  <input
                    className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900 mb-2"
                    value={s.locales[activeLang].title}
                    onChange={(e) => updateLocal(s.id, activeLang, "title", e.target.value)}
                  />
                  <label className="text-sm">Body</label>
                  <textarea
                    rows="8"
                    className="w-full border rounded-xl px-3 py-2 dark:bg-slate-900"
                    value={s.locales[activeLang].body_md}
                    onChange={(e) => updateLocal(s.id, activeLang, "body_md", e.target.value)}
                  />
                </div>

                {/* Gallery quick controls */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Images size={16} />{" "}
                    <span className="font-medium">Galeri (jika ada data.images)</span>
                    <span className="text-xs text-slate-400">({images.length})</span>
                  </div>
                  {images.length === 0 ? (
                    <div className="text-sm text-slate-500">Belum ada gambar.</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt=""
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition" />
                          <div className="absolute top-1 left-1 flex gap-1">
                            <button
                              className="p-1 rounded bg-white/90 text-slate-700"
                              onClick={() => {
                                const cur = readData(s);
                                const arr = Array.isArray(cur.images)
                                  ? cur.images.slice()
                                  : [];
                                if (idx > 0) [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                                writeData(s, { ...cur, images: arr });
                              }}
                              title="Naik"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              className="p-1 rounded bg-white/90 text-slate-700"
                              onClick={() => {
                                const cur = readData(s);
                                const arr = Array.isArray(cur.images)
                                  ? cur.images.slice()
                                  : [];
                                if (idx < arr.length - 1)
                                  [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                                writeData(s, { ...cur, images: arr });
                              }}
                              title="Turun"
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>
                          <button
                            className="absolute top-1 right-1 p-1 rounded bg-white/90 text-rose-600"
                            onClick={() => {
                              const cur = readData(s);
                              const arr = Array.isArray(cur.images) ? cur.images.slice() : [];
                              arr.splice(idx, 1);
                              writeData(s, { ...cur, images: arr });
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
            );
          };

          return (
            <div key={s.id} className="card p-4">
              <HeaderBar />
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4">{mode === "simple" ? renderSimple() : renderAdvanced()}</div>

                    {/* Editor FAQ (Advanced) */}
                    {mode === "advanced" && s.section_key === "faq_list" && (
                      <div className="mt-4">
                        <FaqListEditor s={s} activeLang={activeLang} updateLocaleExtra={updateLocaleExtra} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}