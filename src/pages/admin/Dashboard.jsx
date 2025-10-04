// src/pages/admin/Dashboard.jsx (with charts)
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar,
  PieChart, Pie, Cell,
} from "recharts";

function fmtIDR(n) {
  try { return (n ?? 0).toLocaleString("id-ID"); } catch { return String(n ?? 0); }
}
function startOfDayISO(d) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x.toISOString();
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const [stats, setStats] = useState({ bookings: 0, packages: 0, sections: 0, revenue30d: 0 });
  const [recent, setRecent] = useState([]);
  const [bookings30, setBookings30] = useState([]);
  const [statusCounts, setStatusCounts] = useState([]);
  const [topPackages, setTopPackages] = useState([]);

  useEffect(() => {
    (async () => {
      // KPI counters
      const [{ count: p }, { count: s }] = await Promise.all([
        supabase.from("packages").select("*", { count: "exact", head: true }),
        supabase.from("page_sections").select("*", { count: "exact", head: true }),
      ]);

      // Recent table
      const { data: rec } = await supabase.from("bookings")
        .select("id, created_at, customer_name, total_idr, status")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecent(rec || []);

      // 30d bookings
      const sinceISO = startOfDayISO(new Date(Date.now() - 29 * 86400000));
      const { data: bdata } = await supabase
        .from("bookings")
        .select("id, created_at, total_idr, status, package_id")
        .gte("created_at", sinceISO)
        .order("created_at", { ascending: true });

      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setHours(0,0,0,0);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0,10);
        days.push({ key, label: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) });
      }

      const byDay = new Map(days.map(d => [d.key, { label: d.label, dateKey: d.key, count: 0, revenue: 0 }]));
      const statusMap = new Map();   // status -> count
      const pkgMap = new Map();      // package_id -> count

      (bdata || []).forEach(b => {
        const k = String(b.created_at).slice(0,10);
        if (byDay.has(k)) {
          const row = byDay.get(k);
          row.count += 1;
          row.revenue += (b.total_idr || 0);
        }
        statusMap.set(b.status || "pending", (statusMap.get(b.status || "pending") || 0) + 1);
        if (b.package_id) pkgMap.set(b.package_id, (pkgMap.get(b.package_id) || 0) + 1);
      });

      const bookingsSeries = Array.from(byDay.values());
      setBookings30(bookingsSeries);

      const revenue30d = bookingsSeries.reduce((s,x) => s + x.revenue, 0);

      // status series
      setStatusCounts(Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })));

      // top packages (resolve title in id locale if available)
      const topIds = Array.from(pkgMap.entries())
        .sort((a,b) => b[1]-a[1])
        .slice(0,5)
        .map(([id]) => id);

      let topTitleById = {};
      if (topIds.length) {
        const { data: titles } = await supabase
          .from("package_locales")
          .select("package_id,title,lang")
          .in("package_id", topIds)
          .eq("lang", "id");
        (titles || []).forEach(r => { topTitleById[r.package_id] = r.title; });
      }
      const top = Array.from(pkgMap.entries())
        .sort((a,b) => b[1]-a[1])
        .slice(0,5)
        .map(([id, count]) => ({ name: topTitleById[id] || id.slice(0,6), count }));
      setTopPackages(top);

      setStats({
        bookings: (bdata || []).length,
        packages: p || 0,
        sections: s || 0,
        revenue30d,
      });
    })();
  }, []);

  const statLabels = {
    bookings: t("admin.dashboard.stats.bookings"),
    packages: t("admin.dashboard.stats.packages"),
    sections: t("admin.dashboard.stats.sections"),
  };

  const COLORS = ["#0ea5e9", "#a78bfa", "#f59e0b", "#10b981", "#ef4444", "#22d3ee"];

  return (
    <div className="container mt-6 space-y-6">
      {/* KPI */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-slate-500">{statLabels.bookings} (30d)</p>
          <p className="text-3xl font-bold">{stats.bookings}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-500">Revenue (30d)</p>
          <p className="text-3xl font-bold">Rp {fmtIDR(stats.revenue30d)}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-500">{statLabels.packages}</p>
          <p className="text-3xl font-bold">{stats.packages}</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-500">{statLabels.sections}</p>
          <p className="text-3xl font-bold">{stats.sections}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <h2 className="font-semibold mb-2">Bookings per Day (30d)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookings30}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(v, n) => n === "revenue" ? [`Rp ${fmtIDR(v)}`, "Revenue"] : [v, "Bookings"]} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="count" name="Bookings" stroke="#0ea5e9" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#a78bfa" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-2">Status Distribution (30d)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCounts}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {statusCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4 lg:col-span-3">
          <h2 className="font-semibold mb-2">Top Packages by Bookings (30d)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPackages} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={180} />
                <Tooltip />
                <Bar dataKey="count" name="Bookings" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Latest bookings table */}
      <div className="card p-4">
        <h2 className="font-semibold mb-2">{t("admin.dashboard.latestOrders")}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">{t("admin.dashboard.table.date")}</th>
                <th>{t("admin.dashboard.table.name")}</th>
                <th>{t("admin.dashboard.table.status")}</th>
                <th>{t("admin.dashboard.table.totalIDR")}</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-2">{new Date(r.created_at).toLocaleString("id-ID")}</td>
                  <td>{r.customer_name}</td>
                  <td>{r.status}</td>
                  <td>Rp {fmtIDR(r.total_idr)}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td className="p-2 text-slate-500" colSpan={4}>{t("admin.common.empty")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
