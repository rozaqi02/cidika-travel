import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ bookings: 0, packages: 0, sections: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    (async () => {
      const { count: b } = await supabase.from("bookings").select("*", { count: "exact", head: true });
      const { count: p } = await supabase.from("packages").select("*", { count: "exact", head: true });
      const { count: s } = await supabase.from("page_sections").select("*", { count: "exact", head: true });
      setStats({ bookings: b || 0, packages: p || 0, sections: s || 0 });

      const { data: rec } = await supabase.from("bookings")
        .select("id, created_at, customer_name, total_idr, status")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecent(rec || []);
    })();
  }, []);

  return (
    <div className="container mt-6 space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className="card p-4">
            <p className="text-slate-500 capitalize">{k}</p>
            <p className="text-3xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-2">Order terbaru</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left"><th className="p-2">Tanggal</th><th>Nama</th><th>Status</th><th>Total (IDR)</th></tr></thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.customer_name}</td>
                  <td>{r.status}</td>
                  <td>{r.total_idr.toLocaleString("id-ID")}</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td className="p-2 text-slate-500" colSpan={4}>Belum ada data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
