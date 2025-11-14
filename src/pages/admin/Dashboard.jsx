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
  AreaChart, Area,
} from "recharts";
import { Filter, RotateCcw, DollarSign, Users, Calendar, TrendingUp, PieChart as PieIcon, BarChart as BarIcon } from "lucide-react";

function fmtIDR(n) {
  try { return (n ?? 0).toLocaleString("id-ID"); } catch { return String(n ?? 0); }
}
function startOfDayISO(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
function endOfDayISO(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}
// Helper untuk format YYYY-MM-DD
function formatYYYYMMDD(d) {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


const COLORS = ["#0ea5e9", "#a78bfa", "#f59e0b", "#10b981", "#ef4444", "#22d3ee"];

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl ${className}`}></div>;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  // ===== Filters / Controls =====
  const [statusScope, setStatusScope] = useState("confirmed"); // confirmed | pending | all
  const [includePendingOverlay, setIncludePendingOverlay] = useState(false); // overlay garis pending di chart
  const [audience, setAudience] = useState(""); // "" | "domestic" | "foreign"
  const [daysPreset, setDaysPreset] = useState(30); // 7 | 30 | 90 | 0 (custom)
  
  // PERBAIKAN: Beri nilai awal pada state tanggal
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return formatYYYYMMDD(d);
  });
  const [dateTo, setDateTo] = useState(() => formatYYYYMMDD(new Date()));

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
    avgRevenue: 0,
    conversionRate: 0,
  });
  const [seriesDaily, setSeriesDaily] = useState([]);         // confirmed daily
  const [seriesDailyPending, setSeriesDailyPending] = useState([]); // pending daily (opsional overlay)
  const [statusCounts, setStatusCounts] = useState([]);       // distribusi status (mengikuti filter waktu & audience)
  const [audienceDist, setAudienceDist] = useState([]);       // distribusi audience
  const [topPackages, setTopPackages] = useState([]);         // daftar paket top
  const [recent, setRecent] = useState([]);                   // tabel terbaru (ikut filter statusScope)

  // ===== Date Range resolve =====
  const { fromISO, toISO, daysWindow } = useMemo(() => {
    if (daysPreset > 0) {
      const from = new Date();
      from.setDate(from.getDate() - (daysPreset - 1));
      const to = new Date();
      return { fromISO: startOfDayISO(from), toISO: endOfDayISO(to), daysWindow: daysPreset };
    }
    // custom
    const from = dateFrom ? startOfDayISO(new Date(dateFrom)) : startOfDayISO(new Date(Date.now() - 29 * 86400000));
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

      const base = supabase
        .from("bookings")
        .select("id, created_at, total_idr, status, package_id, audience, customer_name")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: true });

      if (audience) base.eq("audience", audience);

      const { data: rows, error } = await base;
      if (error) { console.error(error); setLoading(false); return; }
      const rowsSafe = rows || [];

      const days = [];
      for (let i = daysWindow - 1; i >= 0; i--) {
        const d = new Date(fromISO);
        d.setDate(d.getDate() + (daysWindow - 1 - i));
        const key = d.toISOString().slice(0, 10);
        days.push({ key, label: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) });
      }
      const mkMap = () => new Map(days.map(d => [d.key, { dateKey: d.key, label: d.label, count: 0, revenue: 0 }]));
      const mapConfirm = mkMap();
      const mapPending = mkMap();

      let confirmCount = 0, pendingCount = 0, confirmRevenue = 0;
      const statusMap = new Map();
      const audienceMap = new Map();
      const pkgCountMap = new Map();
      const pkgRevenueMap = new Map();

      rowsSafe.forEach(b => {
        const dayKey = String(b.created_at).slice(0, 10);
        const amt = b.total_idr || 0;
        const st = (b.status || "pending").toLowerCase();

        statusMap.set(st, (statusMap.get(st) || 0) + 1);

        const aud = b.audience || "unknown";
        audienceMap.set(aud, (audienceMap.get(aud) || 0) + 1);

        if (st === "confirmed") {
          pkgCountMap.set(b.package_id, (pkgCountMap.get(b.package_id) || 0) + 1);
          pkgRevenueMap.set(b.package_id, (pkgRevenueMap.get(b.package_id) || 0) + amt);
        }

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
          }
          pendingCount += 1;
        }
      });

      setSeriesDaily(Array.from(mapConfirm.values()));
      setSeriesDailyPending(Array.from(mapPending.values()));
      setStatusCounts(Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })));
      setAudienceDist(Array.from(audienceMap.entries()).map(([audience, count]) => ({ audience, count })));
      setStats((st) => ({ ...st, bookingsConfirm: confirmCount, bookingsPending: pendingCount, revenueConfirm: confirmRevenue, avgRevenue: confirmCount > 0 ? Math.round(confirmRevenue / confirmCount) : 0, conversionRate: (confirmCount + pendingCount) > 0 ? Math.round((confirmCount / (confirmCount + pendingCount)) * 100) : 0 }));

      const metricMap = (sortPkgBy === "revenue") ? pkgRevenueMap : pkgCountMap;
      const topIds = Array.from(metricMap.entries())
        .sort((a, b) => sortPkgDir === "asc" ? a[1] - b[1] : b[1] - a[1])
        .slice(0, 5)
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
        .sort((a, b) => sortPkgDir === "asc" ? a[1] - b[1] : b[1] - a[1])
        .slice(0, 5)
        .map(([id, val]) => ({ name: titleById[id] || id?.slice(0, 6) || "-", value: val }));
      setTopPackages(top);

      const scope = statusScope === "all" ? undefined : statusScope;
      const recentQ = supabase
        .from("bookings")
        .select("id, created_at, customer_name, total_idr, status, package_id, audience")
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: false })
        .limit(10);
      if (audience) recentQ.eq("audience", audience);
      if (scope) recentQ.eq("status", scope);
      const { data: recData } = await recentQ;
      setRecent(recData || []);

      setLoading(false);
    })();
  }, [fromISO, toISO, audience, statusScope, includePendingOverlay, sortPkgBy, sortPkgDir, daysWindow]);

  const statLabels = {
    bookings: t("admin.dashboard.stats.bookings") || "Bookings",
    packages: t("admin.dashboard.stats.packages") || "Packages",
    sections: t("admin.dashboard.stats.sections") || "Sections",
  };

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
    <div className="container mt-3 space-y-4">
      <div className="sticky top-16 z-[5] transition-transform duration-200 translate-y-0">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md px-3 sm:px-4 py-2 glass shadow-smooth">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold">{t("admin.dashboard.title", { defaultValue: "Dashboard" })}</h1>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-outline !py-1.5 !px-3" onClick={() => location.reload()} title="Refresh">
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-6 gap-2">
              <select className="px-3 py-2 rounded-2xl border" value={statusScope} onChange={(e) => setStatusScope(e.target.value)}>
                <option value="confirmed">Confirmed only</option>
                <option value="pending">Pending only</option>
                <option value="all">All status</option>
              </select>

              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border">
                <input type="checkbox" checked={includePendingOverlay} onChange={(e) => setIncludePendingOverlay(e.target.checked)} />
                <span className="text-sm">Show Pending overlay</span>
              </label>

              <select className="px-3 py-2 rounded-2xl border" value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="">All Audience</option>
                <option value="domestic">Domestic</option>
                <option value="foreign">Foreign</option>
              </select>

              <select className="px-3 py-2 rounded-2xl border" value={String(daysPreset)} onChange={(e) => setDaysPreset(Number(e.target.value))}>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="0">Custom</option>
              </select>
              
              {/* PERBAIKAN: Gunakan `daysPreset === 0` untuk logika disabled */}
              <input type="date" disabled={daysPreset !== 0} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded-2xl border disabled:opacity-50 disabled:cursor-not-allowed" />
              <input type="date" disabled={daysPreset !== 0} value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded-2xl border disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <button className="btn btn-outline !py-1 !px-3" onClick={resetFilters}>Reset</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Top Packages sort:</span>
                <select className="px-2 py-1.5 rounded-xl border" value={sortPkgBy} onChange={(e) => setSortPkgBy(e.target.value)}>
                  <option value="bookings">Bookings</option>
                  <option value="revenue">Revenue</option>
                </select>
                <select className="px-2 py-1.5 rounded-xl border" value={sortPkgDir} onChange={(e) => setSortPkgDir(e.target.value)}>
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />) : (
          <>
            <div className="card p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500"><TrendingUp size={20} /> Confirmed Bookings</div>
              <div className="text-3xl font-bold">{stats.bookingsConfirm}</div>
            </div>
            <div className="card p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500"><DollarSign size={20} /> Revenue (Confirmed)</div>
              <div className="text-3xl font-bold">Rp {fmtIDR(stats.revenueConfirm)}</div>
            </div>
            <div className="card p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500"><Users size={20} /> Avg Revenue / Booking</div>
              <div className="text-3xl font-bold">Rp {fmtIDR(stats.avgRevenue)}</div>
            </div>
            <div className="card p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500"><PieIcon size={20} /> Conversion Rate</div>
              <div className="text-3xl font-bold">{stats.conversionRate}%</div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold mb-2 flex items-center gap-2"><BarIcon size={18} /> Daily Trends</h2>
          {loading ? <Skeleton className="h-64" /> : (
            <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={seriesDaily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(v, n) => (n === "revenue" ? [`Rp ${fmtIDR(v)}`, "Revenue"] : [v, "Bookings"])} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="count" name="Bookings (Confirmed)" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
                <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (Confirmed)" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.3} />
                {includePendingOverlay && (
                  <Area yAxisId="left" type="monotone" data={seriesDailyPending} dataKey="count" name="Bookings (Pending)" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeDasharray="4 4" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-2 flex items-center gap-2"><PieIcon size={18} /> Status Distribution</h2>
          {loading ? <Skeleton className="h-64" /> : (
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie data={statusCounts} dataKey="count" nameKey="status" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {statusCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-2 flex items-center gap-2"><Users size={18} /> Audience Distribution</h2>
          {loading ? <Skeleton className="h-64" /> : (
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie data={audienceDist} dataKey="count" nameKey="audience" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {audienceDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-2 flex items-center gap-2"><TrendingUp size={18} /> Top Packages</h2>
          {loading ? <Skeleton className="h-64" /> : (
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={topPackages} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip formatter={(v) => sortPkgBy === "revenue" ? [`Rp ${fmtIDR(v)}`, "Revenue"] : [v, "Bookings"]} />
                <Bar dataKey="value" name={sortPkgBy === "revenue" ? "Revenue" : "Bookings"} fill="#10b981" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-2 flex items-center gap-2"><Calendar size={18} /> Recent Bookings</h2>
        {loading ? <Skeleton className="h-48" /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-left">
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Package</th>
                  <th className="p-3">Audience</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-3">{r.customer_name}</td>
                    <td className="p-3">{r.package_id.slice(0, 8)}...</td>
                    <td className="p-3 capitalize">{r.audience}</td>
                    <td className="p-3">Rp {fmtIDR(r.total_idr)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${r.status === "confirmed" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200" :
                        r.status === "pending" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200" :
                          "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                        }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td className="p-3 text-center text-slate-500" colSpan={6}>No recent bookings</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}