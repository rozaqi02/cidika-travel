import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Kustomisasi() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const { data, error } = await supabase.from("page_content").select("*").order("page");
    if (!error) setItems(data||[]);
  };
  useEffect(()=>{ load(); }, []);

  const onEdit = (it) => setEditing({ ...it });
  const onSave = async () => {
    const { data, error } = await supabase.from("page_content").upsert(editing).select();
    if (!error) { setEditing(null); load(); }
  };

  return (
    <div className="container mt-6 grid md:grid-cols-2 gap-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Konten Per Halaman</h2>
          <button className="btn btn-outline" onClick={()=>setEditing({ page:'home', key:'hero_desc', lang:'en', content:'' })}>Tambah</button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>Page</th><th>Key</th><th>Lang</th><th>Content</th><th></th></tr></thead>
          <tbody>
            {items.map(it=> (
              <tr key={it.id}>
                <td>{it.page}</td><td>{it.key}</td><td>{it.lang}</td><td className="truncate max-w-[220px]">{it.content}</td>
                <td><button className="btn btn-outline" onClick={()=>onEdit(it)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card p-4">
        <h2 className="font-semibold mb-2">Editor</h2>
        {!editing ? <p className="text-slate-500">Pilih item untuk edit / tambah baru.</p> : (
          <div className="grid gap-2">
            <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="page" value={editing.page||""} onChange={e=>setEditing({...editing, page:e.target.value})} />
            <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="key" value={editing.key||""} onChange={e=>setEditing({...editing, key:e.target.value})} />
            <select className="border rounded-xl px-3 py-2 dark:bg-slate-900" value={editing.lang||"en"} onChange={e=>setEditing({...editing, lang:e.target.value})}>
              <option value="en">en</option><option value="id">id</option><option value="ja">ja</option>
            </select>
            <textarea rows="6" className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="content" value={editing.content||""} onChange={e=>setEditing({...editing, content:e.target.value})} />
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={onSave}>Simpan</button>
              <button className="btn btn-outline" onClick={()=>setEditing(null)}>Batal</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}