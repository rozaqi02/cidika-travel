// src/pages/admin/Dashboard.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from "recharts";
import { RotateCcw, DollarSign, Users, Calendar, TrendingUp, PieChart as PieIcon, BarChart as BarIcon } from "lucide-react";

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
  const { t, i18n } = useTranslation();

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

  const languageCode = (i18n.language || "id").slice(0, 2);
  const dateLocale = useMemo(
    () =>
      ({
        id: "id-ID",
        en: "en-US",
        ja: "ja-JP",
      })[languageCode] || "en-US",
    [languageCode]
  );

  const labels = useMemo(
    () => ({
      refresh: t("admin.dashboard.refresh", { defaultValue: "Refresh" }),
      confirmedOnly: t("admin.dashboard.filters.confirmedOnly", {
        defaultValue: "Confirmed only",
      }),
      pendingOnly: t("admin.dashboard.filters.pendingOnly", {
        defaultValue: "Pending only",
      }),
      allStatus: t("admin.dashboard.filters.allStatus", {
        defaultValue: "All status",
      }),
      showPendingOverlay: t("admin.dashboard.filters.showPendingOverlay", {
        defaultValue: "Show pending overlay",
      }),
      allAudience: t("admin.dashboard.filters.allAudience", {
        defaultValue: "All audience",
      }),
      audienceDomestic: t("explore.domestic", { defaultValue: "Domestic" }),
      audienceForeign: t("explore.foreign", { defaultValue: "Foreign" }),
      customDate: t("admin.dashboard.filters.customDate", {
        defaultValue: "Custom",
      }),
      reset: t("admin.dashboard.filters.reset", { defaultValue: "Reset" }),
      topSort: t("admin.dashboard.filters.topSort", {
        defaultValue: "Top packages sort",
      }),
      sortBookings: t("admin.dashboard.filters.sortBookings", {
        defaultValue: "Bookings",
      }),
      sortRevenue: t("admin.dashboard.filters.sortRevenue", {
        defaultValue: "Revenue",
      }),
      sortDesc: t("admin.dashboard.filters.sortDesc", {
        defaultValue: "Desc",
      }),
      sortAsc: t("admin.dashboard.filters.sortAsc", {
        defaultValue: "Asc",
      }),
      confirmedBookings: t("admin.dashboard.cards.confirmedBookings", {
        defaultValue: "Confirmed Bookings",
      }),
      confirmedRevenue: t("admin.dashboard.cards.confirmedRevenue", {
        defaultValue: "Revenue (Confirmed)",
      }),
      avgRevenue: t("admin.dashboard.cards.avgRevenue", {
        defaultValue: "Avg Revenue / Booking",
      }),
      conversionRate: t("admin.dashboard.cards.conversionRate", {
        defaultValue: "Conversion Rate",
      }),
      dailyTrends: t("admin.dashboard.sections.dailyTrends", {
        defaultValue: "Daily Trends",
      }),
      statusDistribution: t("admin.dashboard.sections.statusDistribution", {
        defaultValue: "Status Distribution",
      }),
      audienceDistribution: t("admin.dashboard.sections.audienceDistribution", {
        defaultValue: "Audience Distribution",
      }),
      topPackages: t("admin.dashboard.sections.topPackages", {
        defaultValue: "Top Packages",
      }),
      recentBookings: t("admin.dashboard.sections.recentBookings", {
        defaultValue: "Recent Bookings",
      }),
      date: t("admin.dashboard.table.date", { defaultValue: "Date" }),
      customer: t("admin.dashboard.table.customer", {
        defaultValue: "Customer",
      }),
      package: t("admin.dashboard.table.package", {
        defaultValue: "Package",
      }),
      audience: t("admin.dashboard.table.audience", {
        defaultValue: "Audience",
      }),
      total: t("admin.dashboard.table.total", { defaultValue: "Total" }),
      status: t("admin.dashboard.table.status", { defaultValue: "Status" }),
      noRecentBookings: t("admin.dashboard.emptyRecent", {
        defaultValue: "No recent bookings",
      }),
      bookingsMetric: t("admin.dashboard.metrics.bookings", {
        defaultValue: "Bookings",
      }),
      revenueMetric: t("admin.dashboard.metrics.revenue", {
        defaultValue: "Revenue",
      }),
      pendingMetric: t("admin.dashboard.metrics.pendingBookings", {
        defaultValue: "Bookings (Pending)",
      }),
      confirmedBookingMetric: t("admin.dashboard.metrics.confirmedBookings", {
        defaultValue: "Bookings (Confirmed)",
      }),
      confirmedRevenueMetric: t("admin.dashboard.metrics.confirmedRevenue", {
        defaultValue: "Revenue (Confirmed)",
      }),
      unknownAudience: t("admin.dashboard.filters.unknownAudience", {
        defaultValue: "Unknown",
      }),
    }),
    [t]
  );

  const dayLabel = useCallback(
    (count) =>
      t("admin.dashboard.filters.dayWindow", {
        count,
        defaultValue: "{{count}} days",
      }),
    [t]
  );

  const formatStatusLabel = useCallback(
    (status) => {
      const normalized = String(status || "pending").toLowerCase();
      const defaultValue =
        normalized.charAt(0).toUpperCase() + normalized.slice(1);
      return t(`admin.dashboard.status.${normalized}`, { defaultValue });
    },
    [t]
  );

  const formatAudienceLabel = useCallback(
    (value) => {
      if (value === "domestic") return labels.audienceDomestic;
      if (value === "foreign") return labels.audienceForeign;
      return labels.unknownAudience;
    },
    [labels.audienceDomestic, labels.audienceForeign, labels.unknownAudience]
  );

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
        days.push({
          key,
          label: d.toLocaleDateString(dateLocale, {
            day: "2-digit",
            month: "short",
          }),
        });
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
      setStatusCounts(
        Array.from(statusMap.entries()).map(([status, count]) => ({
          status,
          label: formatStatusLabel(status),
          count,
        }))
      );
      setAudienceDist(
        Array.from(audienceMap.entries()).map(([audience, count]) => ({
          audience,
          label: formatAudienceLabel(audience),
          count,
        }))
      );
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
          .eq("lang", languageCode);
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
  }, [dateLocale, fromISO, toISO, audience, statusScope, sortPkgBy, sortPkgDir, daysWindow, languageCode, formatStatusLabel, formatAudienceLabel]);

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
      <div>
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md px-3 sm:px-4 py-2 glass shadow-smooth">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold">{t("admin.dashboard.title", { defaultValue: "Dashboard" })}</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-outline !py-1.5 !px-3"
                  onClick={() => window.location.reload()}
                  title={labels.refresh}
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-6 gap-2">
              <select className="px-3 py-2 rounded-2xl border" value={statusScope} onChange={(e) => setStatusScope(e.target.value)}>
                <option value="confirmed">{labels.confirmedOnly}</option>
                <option value="pending">{labels.pendingOnly}</option>
                <option value="all">{labels.allStatus}</option>
              </select>

              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border">
                <input type="checkbox" checked={includePendingOverlay} onChange={(e) => setIncludePendingOverlay(e.target.checked)} />
                <span className="text-sm">{labels.showPendingOverlay}</span>
              </label>

              <select className="px-3 py-2 rounded-2xl border" value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="">{labels.allAudience}</option>
                <option value="domestic">{labels.audienceDomestic}</option>
                <option value="foreign">{labels.audienceForeign}</option>
              </select>

              <select className="px-3 py-2 rounded-2xl border" value={String(daysPreset)} onChange={(e) => setDaysPreset(Number(e.target.value))}>
                <option value="7">{dayLabel(7)}</option>
                <option value="30">{dayLabel(30)}</option>
                <option value="90">{dayLabel(90)}</option>
                <option value="0">{labels.customDate}</option>
              </select>
              
              {/* PERBAIKAN: Gunakan `daysPreset === 0` untuk logika disabled */}
              <input type="date" disabled={daysPreset !== 0} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded-2xl border disabled:opacity-50 disabled:cursor-not-allowed" />
              <input type="date" disabled={daysPreset !== 0} value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded-2xl border disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <button className="btn btn-outline !py-1 !px-3" onClick={resetFilters}>
                  {labels.reset}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{labels.topSort}:</span>
                <select className="px-2 py-1.5 rounded-xl border" value={sortPkgBy} onChange={(e) => setSortPkgBy(e.target.value)}>
                  <option value="bookings">{labels.sortBookings}</option>
                  <option value="revenue">{labels.sortRevenue}</option>
                </select>
                <select className="px-2 py-1.5 rounded-xl border" value={sortPkgDir} onChange={(e) => setSortPkgDir(e.target.value)}>
                  <option value="desc">{labels.sortDesc}</option>
                  <option value="asc">{labels.sortAsc}</option>
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
              <div className="flex items-center gap-2 text-slate-500">
                <TrendingUp size={20} /> {labels.confirmedBookings}
              </div>
              <div className="text-3xl font-bold">{stats.bookingsConfirm}</div>
            </div>
            <div className="card p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <DollarSign size={20} /> {labels.confirmedRevenue}
              </div>
              <div className="text-3xl font-bold">Rp {fmtIDR(stats.revenueConfirm)}</div>
            </div>
            <div className="card p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Users size={20} /> {labels.avgRevenue}
              </div>
              <div className="text-3xl font-bold">Rp {fmtIDR(stats.avgRevenue)}</div>
            </div>
            <div className="card p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <PieIcon size={20} /> {labels.conversionRate}
              </div>
              <div className="text-3xl font-bold">{stats.conversionRate}%</div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <BarIcon size={18} /> {labels.dailyTrends}
          </h2>
          {loading ? <Skeleton className="h-64" /> : (
            <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={seriesDaily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(v, n) =>
                    n === "revenue"
                      ? [`Rp ${fmtIDR(v)}`, labels.revenueMetric]
                      : [v, labels.bookingsMetric]
                  }
                />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="count" name={labels.confirmedBookingMetric} stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
                <Area yAxisId="right" type="monotone" dataKey="revenue" name={labels.confirmedRevenueMetric} stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.3} />
                {includePendingOverlay && (
                  <Area yAxisId="left" type="monotone" data={seriesDailyPending} dataKey="count" name={labels.pendingMetric} stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeDasharray="4 4" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <PieIcon size={18} /> {labels.statusDistribution}
          </h2>
          {loading ? <Skeleton className="h-64" /> : (
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie data={statusCounts} dataKey="count" nameKey="label" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {statusCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <Users size={18} /> {labels.audienceDistribution}
          </h2>
          {loading ? <Skeleton className="h-64" /> : (
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie data={audienceDist} dataKey="count" nameKey="label" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {audienceDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp size={18} /> {labels.topPackages}
          </h2>
          {loading ? <Skeleton className="h-64" /> : (
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={topPackages} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip formatter={(v) => sortPkgBy === "revenue" ? [`Rp ${fmtIDR(v)}`, labels.revenueMetric] : [v, labels.bookingsMetric]} />
                <Bar dataKey="value" name={sortPkgBy === "revenue" ? labels.revenueMetric : labels.bookingsMetric} fill="#10b981" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          <Calendar size={18} /> {labels.recentBookings}
        </h2>
        {loading ? <Skeleton className="h-48" /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-left">
                  <th className="p-3">{labels.date}</th>
                  <th className="p-3">{labels.customer}</th>
                  <th className="p-3">{labels.package}</th>
                  <th className="p-3">{labels.audience}</th>
                  <th className="p-3">{labels.total}</th>
                  <th className="p-3">{labels.status}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3">{new Date(r.created_at).toLocaleDateString(dateLocale)}</td>
                    <td className="p-3">{r.customer_name}</td>
                    <td className="p-3">{r.package_id.slice(0, 8)}...</td>
                    <td className="p-3 capitalize">{formatAudienceLabel(r.audience)}</td>
                    <td className="p-3">Rp {fmtIDR(r.total_idr)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${r.status === "confirmed" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200" :
                        r.status === "pending" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200" :
                          "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                        }`}>{formatStatusLabel(r.status)}</span>
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td className="p-3 text-center text-slate-500" colSpan={6}>
                      {labels.noRecentBookings}
                    </td>
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
