import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Orderan() {
  const [rows, setRows] = useState([]);

  const load = async () => {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (!error) setRows(data||[]);
  };
  useEffect(()=>{ load(); }, []);

  return (
    <div className="container mt-6">
      <h1 className="text-2xl font-bold mb-3">Orderan</h1>
      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="text-left"><th className="p-3">Tanggal</th><th>Paket</th><th>Nama</th><th>Kontak</th><th>Pax</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map(r=> (
              <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                <td>{r.package_id}</td>
                <td>{r.name}</td>
                <td>{r.phone||r.email}</td>
                <td>{r.pax}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}