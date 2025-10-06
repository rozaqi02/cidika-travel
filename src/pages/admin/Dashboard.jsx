// src/pages/admin/Dashboard.jsx
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
import { Filter, RotateCcw } from "lucide-react";

function fmtIDR(n) {
  try { return (n ?? 0).toLocaleString("id-ID"); } catch { return String(n ?? 0); }
}
function startOfDayISO(d) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x.toISOString();
}
function endOfDayISO(d) {
  const x = new Date(d);
  x.setHours(23,59,59,999);
  return x.toISOString();
}

const COLORS = ["#0ea5e9", "#a78bfa", "#f59e0b", "#10b981", "#ef4444", "#22d3ee"];

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  // ===== Filters / Controls =====
  const [statusScope, setStatusScope] = useState("confirmed"); // confirmed | pending | all
  const [includePendingOverlay, setIncludePendingOverlay] = useState(false); // overlay garis pending di chart
  const [audience, setAudience] = useState(""); // "" | "domestic" | "foreign"
  const [daysPreset, setDaysPreset] = useState(30); // 7 | 30 | 90 | 0 (custom)
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortPkgBy, setSortPkgBy] = useState("bookings"); // bookings | revenue
  const [sortPkgDir, setSortPkgDir] = useState("desc"); // asc | desc

  // ===== State =====
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    bookingsConfirm: 0,
    bookingsPending: 0,
    revenueConfirm: 0,
    packages: 0,
    sections: 0,
  });
  const [seriesDaily, setSeriesDaily] = useState([]);           // confirmed daily
  const [seriesDailyPending, setSeriesDailyPending] = useState([]); // pending daily (opsional overlay)
  const [statusCounts, setStatusCounts] = useState([]);         // distribusi status (mengikuti filter waktu & audience)
  const [topPackages, setTopPackages] = useState([]);           // daftar paket top
  const [recent, setRecent] = useState([]);                     // tabel terbaru (ikut filter statusScope)

  // ===== Date Range resolve =====
  const { fromISO, toISO, daysWindow } = useMemo(() => {
    if (daysPreset > 0) {
      const from = new Date();
      from.setDate(from.getDate() - (daysPreset - 1));
      const to = new Date();
      return { fromISO: startOfDayISO(from), toISO: endOfDayISO(to), daysWindow: daysPreset };
    }
    // custom
    const from = dateFrom ? startOfDayISO(new Date(dateFrom)) : startOfDayISO(new Date(Date.now() - 29*86400000));
    const to = dateTo ? endOfDayISO(new Date(dateTo)) : endOfDayISO(new Date());
    const diffDays = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1);
    return { fromISO: from, toISO: to, daysWindow: diffDays };
  }, [daysPreset, dateFrom, dateTo]);

  // ===== Load static counts (packages/sections) once =====
  useEffect(() => {
    (async () => {
      const [{ count: p }, { count: s }] = await Promise.all([
        supabase.from("packages").select("*", { count: "exact", head: true }),
        supabase.from("page_sections").select("*", { count: "exact", head: true }),
      ]);
      setStats((st) => ({ ...st, packages: p || 0, sections: s || 0 }));
    })();
  }, []);

  // ===== Main data loader (depends on filters) =====
  useEffect(() => {
    (async () => {
      setLoading(true);

      // Compose base query with time & audience
      const base = supabase
        .from("bookings")
        .select("id, created_at, total_idr, status, package_id, audience, customer_name")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: true });

      if (audience) base.eq("audience", audience);

      // Pull once; we'll split by status on client for flexibility
      const { data: rows, error } = await base;
      if (error) { console.error(error); setLoading(false); return; }
      const rowsSafe = rows || [];

      // Build day buckets
      const days = [];
      for (let i = daysWindow - 1; i >= 0; i--) {
        const d = new Date();
        d.setHours(0,0,0,0);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0,10);
        days.push({ key, label: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) });
      }
      const mkMap = () => new Map(days.map(d => [d.key, { dateKey: d.key, label: d.label, count: 0, revenue: 0 }]));
      const mapConfirm = mkMap();
      const mapPending = mkMap();

      // Aggregations
      let confirmCount = 0, pendingCount = 0, confirmRevenue = 0;
      const statusMap = new Map();           // for pie
      const pkgCountMap = new Map();         // top pkg by bookings
      const pkgRevenueMap = new Map();       // top pkg by revenue

      rowsSafe.forEach(b => {
        const dayKey = String(b.created_at).slice(0,10);
        const amt = b.total_idr || 0;
        const st = (b.status || "pending").toLowerCase();

        // pie
        statusMap.set(st, (statusMap.get(st) || 0) + 1);

        // top packages counters (confirmed only for revenue & bookings by default)
        if (st === "confirmed") {
          pkgCountMap.set(b.package_id, (pkgCountMap.get(b.package_id) || 0) + 1);
          pkgRevenueMap.set(b.package_id, (pkgRevenueMap.get(b.package_id) || 0) + amt);
        }

        // daily split
        if (st === "confirmed") {
          if (mapConfirm.has(dayKey)) {
            const row = mapConfirm.get(dayKey);
            row.count += 1;
            row.revenue += amt;
          }
          confirmCount += 1;
          confirmRevenue += amt;
        } else if (st === "pending") {
          if (mapPending.has(dayKey)) {
            const row = mapPending.get(dayKey);
            row.count += 1;
            // revenue pending tidak dihitung
          }
          pendingCount += 1;
        }
      });

      setSeriesDaily(Array.from(mapConfirm.values()));
      setSeriesDailyPending(Array.from(mapPending.values()));
      setStatusCounts(Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })));
      setStats((st) => ({ ...st, bookingsConfirm: confirmCount, bookingsPending: pendingCount, revenueConfirm: confirmRevenue }));

      // resolve package titles (ID locale) for top 5
      const metricMap = (sortPkgBy === "revenue") ? pkgRevenueMap : pkgCountMap;
      const topIds = Array.from(metricMap.entries())
        .sort((a,b) => sortPkgDir === "asc" ? a[1] - b[1] : b[1] - a[1])
        .slice(0,5)
        .map(([id]) => id);

      let titleById = {};
      if (topIds.length) {
        const { data: titles } = await supabase
          .from("package_locales")
          .select("package_id,title,lang")
          .in("package_id", topIds)
          .eq("lang", "id");
        (titles || []).forEach(r => { titleById[r.package_id] = r.title; });
      }
      const top = Array.from(metricMap.entries())
        .sort((a,b) => sortPkgDir === "asc" ? a[1] - b[1] : b[1] - a[1])
        .slice(0,5)
        .map(([id, val]) => ({ name: titleById[id] || id?.slice(0,6) || "-", value: val }));
      setTopPackages(top);

      // Recent table (respect statusScope)
      const scope = statusScope === "all" ? undefined : statusScope;
      const recentQ = supabase
        .from("bookings")
        .select("id, created_at, customer_name, total_idr, status")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: false })
        .limit(6);
      if (audience) recentQ.eq("audience", audience);
      if (scope) recentQ.eq("status", scope);
      const { data: recData } = await recentQ;
      setRecent(recData || []);

      setLoading(false);
    })();
  }, [fromISO, toISO, audience, statusScope, includePendingOverlay, sortPkgBy, sortPkgDir, daysWindow]);

  // ===== Derived labels =====
  const statLabels = {
    bookings: t("admin.dashboard.stats.bookings") || "Bookings",
    packages: t("admin.dashboard.stats.packages") || "Packages",
    sections: t("admin.dashboard.stats.sections") || "Sections",
  };

  // ===== UI =====
  const resetFilters = () => {
    setStatusScope("confirmed");
    setIncludePendingOverlay(false);
    setAudience("");
    setDaysPreset(30);
    setDateFrom("");
    setDateTo("");
    setSortPkgBy("bookings");
    setSortPkgDir("desc");
  };

  return (
    <div className="container mt-6 space-y-6">
      {/* FILTER BAR (sticky) */}
      <div className="sticky top-16 z-[5]">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md px-3 sm:px-4 py-3 glass shadow-smooth">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <Filter size={16} />
              <span>Filter & Sort Dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-outline !py-1.5 !px-3" onClick={resetFilters} title="Reset">Reset</button>
              <button className="btn btn-outline !py-1.5 !px-3" onClick={() => location.reload()} title="Refresh">
                <RotateCcw size={16}/>
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* Status scope */}
            <select className="px-3 py-2 rounded-2xl border" value={statusScope} onChange={(e)=>setStatusScope(e.target.value)}>
              <option value="confirmed">Confirmed only (disarankan)</option>
              <option value="pending">Pending only</option>
              <option value="all">Semua status</option>
            </select>

            {/* Pending overlay */}
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border">
              <input type="checkbox" checked={includePendingOverlay} onChange={(e)=>setIncludePendingOverlay(e.target.checked)} />
              <span className="text-sm">Tampilkan garis Pending di chart</span>
            </label>

            {/* Audience */}
            <select className="px-3 py-2 rounded-2xl border" value={audience} onChange={(e)=>setAudience(e.target.value)}>
              <option value="">Semua Audience</option>
              <option value="domestic">Domestic</option>
              <option value="foreign">Foreign</option>
            </select>

            {/* Preset range */}
            <select className="px-3 py-2 rounded-2xl border" value={String(daysPreset)} onChange={(e)=>setDaysPreset(Number(e.target.value))}>
              <option value="7">7 hari</option>
              <option value="30">30 hari</option>
              <option value="90">90 hari</option>
              <option value="0">Custom</option>
            </select>

            {/* Custom range (aktif jika preset=0) */}
            <input type="date" disabled={daysPreset !== 0} value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} className="px-3 py-2 rounded-2xl border" />
            <input type="date" disabled={daysPreset !== 0} value={dateTo} onChange={(e)=>setDateTo(e.target.value)} className="px-3 py-2 rounded-2xl border" />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-slate-500">Top Packages sort:</span>
            <select className="px-2 py-1.5 rounded-xl border" value={sortPkgBy} onChange={(e)=>setSortPkgBy(e.target.value)}>
              <option value="bookings">Bookings (confirmed)</option>
              <option value="revenue">Revenue (confirmed)</option>
            </select>
            <select className="px-2 py-1.5 rounded-xl border" value={sortPkgDir} onChange={(e)=>setSortPkgDir(e.target.value)}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-slate-500">{statLabels.bookings} (confirmed)</p>
          <p className="text-3xl font-bold">{stats.bookingsConfirm}</p>
          <p className="text-xs text-slate-500 mt-1">Rentang terpilih</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-500">Revenue (confirmed)</p>
          <p className="text-3xl font-bold">Rp {fmtIDR(stats.revenueConfirm)}</p>
          <p className="text-xs text-slate-500 mt-1">Pending tidak dihitung</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-500">Pending (info)</p>
          <p className="text-3xl font-bold">{stats.bookingsPending}</p>
          <p className="text-xs text-slate-500 mt-1">Bukan KPI</p>
        </div>
        <div className="card p-4">
          <p className="text-slate-500">{statLabels.packages} / {statLabels.sections}</p>
          <p className="text-3xl font-bold">{stats.packages} / {stats.sections}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <h2 className="font-semibold mb-2">Bookings per Day (confirmed)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={seriesDaily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(v, n) => (n === "revenue" ? [`Rp ${fmtIDR(v)}`, "Revenue"] : [v, "Bookings"])} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="count" name="Bookings (Confirmed)" stroke="#0ea5e9" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (Confirmed)" stroke="#a78bfa" dot={false} />
                {includePendingOverlay && (
                  <Line yAxisId="left" type="monotone" data={seriesDailyPending} dataKey="count" name="Bookings (Pending)" stroke="#ef4444" dot={false} strokeDasharray="4 4" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2">Catatan: garis merah putus-putus adalah pending (opsional).</p>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-2">Status Distribution</h2>
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
          <p className="text-xs text-slate-500 mt-2">Mengikuti filter waktu & audience. Revenue tetap dihitung hanya untuk confirmed.</p>
        </div>

        <div className="card p-4 lg:col-span-3">
          <h2 className="font-semibold mb-2">
            Top Packages by {sortPkgBy === "bookings" ? "Bookings" : "Revenue"} (confirmed)
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPackages} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={180} />
                <Tooltip formatter={(v)=> sortPkgBy==="revenue" ? [`Rp ${fmtIDR(v)}`, "Revenue"] : [v, "Bookings"]} />
                <Bar dataKey="value" name={sortPkgBy==="revenue" ? "Revenue" : "Bookings"} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Latest bookings table (honors statusScope) */}
      <div className="card p-4">
        <h2 className="font-semibold mb-2">
          {t("admin.dashboard.latestOrders") || "Latest Bookings"} — {statusScope === "all" ? "Semua" : statusScope}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Waktu</th>
                <th>Nama</th>
                <th>Status</th>
                <th>Total (IDR)</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-2">{new Date(r.created_at).toLocaleString("id-ID")}</td>
                  <td>{r.customer_name}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      r.status === "confirmed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200" :
                      r.status === "cancelled" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                    }`}>{r.status}</span>
                  </td>
                  <td>Rp {fmtIDR(r.total_idr)}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td className="p-2 text-slate-500" colSpan={4}>{t("admin.common.empty") || "Tidak ada data."}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading…</div>}
    </div>
  );
}
