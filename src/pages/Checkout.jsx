import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabaseClient.js";
import { useNavigate } from "react-router-dom";

export default function Checkout() {
  const { items, clear } = useCart();
  const nav = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", phone:"", date:"", notes:"" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!items.length) { setMsg("Keranjang kosong."); return; }
    const first = items[0]; // satu paket per order, pakai package_id dari item pertama
    setLoading(true);
    setMsg("Membuat order...");
    try {
      const payload = {
        p_package_id: first.id,              // HARUS uuid packages.id
        p_date: form.date || new Date().toISOString().slice(0,10),
        p_pax: first.pax || 1,
        p_audience: "domestic",
        p_customer_name: form.name,
        p_email: form.email,
        p_phone: form.phone,
        p_notes: form.notes || "",
        p_items: items.map(it => ({ item_name: it.title, qty: it.qty || 1, price_idr: it.price || 0 }))
      };
      const { data, error } = await supabase.rpc("place_order", payload);
      if (error) throw error;
      clear();
      setMsg("Order dibuat! Kode publik: " + data?.[0]?.public_code);
      nav("/"); // sementara arahkan pulang; nanti ganti ke halaman "Terima kasih" + instruksi bayar
    } catch (e2) {
      setMsg(e2.message || "Gagal membuat order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-6 grid md:grid-cols-2 gap-6">
      <div className="card p-4">
        <h1 className="text-2xl font-bold mb-2">Checkout</h1>
        <form onSubmit={onSubmit} className="grid gap-3">
          <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Nama Lengkap" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
          <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
          <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Telepon/WA" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
          <input className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Tanggal Trip (YYYY-MM-DD)" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
          <textarea className="border rounded-xl px-3 py-2 dark:bg-slate-900" placeholder="Catatan" rows="4" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} />
          <button className="btn btn-primary" disabled={loading}>{loading ? "Memproses..." : "Buat Pesanan"}</button>
          {msg && <p className="text-sm text-slate-500">{msg}</p>}
        </form>
      </div>
      <div className="card p-4">
        <h2 className="font-semibold mb-2">Ringkasan</h2>
        {items.length === 0 ? <p className="text-slate-500">Keranjang kosong</p> :
          <ul className="space-y-2">
            {items.map(it => (
              <li key={it.id} className="flex items-center justify-between">
                <span>{it.title} × {it.qty}</span>
                <span>{(it.price||0).toLocaleString("id-ID")}</span>
              </li>
            ))}
          </ul>
        }
      </div>
    </div>
  );
}
