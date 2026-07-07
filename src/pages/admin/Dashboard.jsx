// src/pages/admin/Dashboard.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from "recharts";
import {
  RotateCcw,
  Users,
  Calendar,
  TrendingUp,
  PieChart as PieIcon,
  Package,
  Filter,
  ChevronRight,
} from "lucide-react";

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


const CHART_COLORS = ["#8b5cf6", "#22d3ee", "#f59e0b", "#34d399", "#fb7185", "#6366f1"];
const CHART_GRID = "rgba(148, 163, 184, 0.15)";
const CHART_AXIS = "#94a3b8";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/80 dark:bg-white/10 ${className}`} />;
}

function AdminPanel({ title, subtitle, icon: Icon, children, className = "" }) {
  return (
    <section className={`admin-panel overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-white/10">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                <Icon size={16} />
              </span>
            ) : null}
            <h2 className="truncate text-sm font-bold md:text-base">{title}</h2>
          </div>
          {subtitle ? <p className="mt-1 text-xs text-slate-500 dark:text-indigo-200/60">{subtitle}</p> : null}
        </div>
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

function MetricPill({ label, value, accent, loading }) {
  if (loading) return <Skeleton className="h-20 min-w-[140px]" />;
  return (
    <div className="admin-metric-pill min-w-[140px] flex-shrink-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-indigo-200/60">{label}</p>
      <p className={`mt-1 text-xl font-black ${accent}`}>{value}</p>
    </div>
  );
}

function RankedPackage({ name, value, max, isRevenue }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="truncate font-semibold">{name}</span>
        <span className="flex-shrink-0 font-bold text-violet-600 dark:text-violet-300">
          {isRevenue ? `Rp ${fmtIDR(value)}` : value}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status, label }) {
  const normalized = String(status || "pending").toLowerCase();
  const styles = {
    confirmed: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    pending: "bg-amber-500/15 text-amber-700 ring-amber-500/20 dark:text-amber-300",
    cancelled: "bg-rose-500/15 text-rose-700 ring-rose-500/20 dark:text-rose-300",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${styles[normalized] || styles.pending}`}>
      {label}
    </span>
  );
}

function FilterSelect({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`admin-select ${className}`}
    >
      {children}
    </select>
  );
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

  const languageCode = "id";
  const dateLocale = "id-ID";

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

  const topPackagesMax = useMemo(
    () => topPackages.reduce((max, item) => Math.max(max, item.value || 0), 0),
    [topPackages]
  );

  const tooltipStyle = {
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.2)",
    background: "rgba(15,23,42,0.92)",
    color: "#e2e8f0",
  };

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <aside className="admin-filter-rail w-full flex-shrink-0 xl:sticky xl:top-24 xl:w-72">
        <div className="admin-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
              <Filter size={16} />
            </span>
            <div>
              <h2 className="text-sm font-bold">Panel Filter</h2>
              <p className="text-xs text-slate-500 dark:text-indigo-200/60">Atur rentang & tampilan data</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-indigo-200/60">Status</label>
            <FilterSelect value={statusScope} onChange={(e) => setStatusScope(e.target.value)}>
              <option value="confirmed">{labels.confirmedOnly}</option>
              <option value="pending">{labels.pendingOnly}</option>
              <option value="all">{labels.allStatus}</option>
            </FilterSelect>

            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-indigo-200/60">Audiens</label>
            <FilterSelect value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="">{labels.allAudience}</option>
              <option value="domestic">{labels.audienceDomestic}</option>
              <option value="foreign">{labels.audienceForeign}</option>
            </FilterSelect>

            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-indigo-200/60">Periode</label>
            <FilterSelect value={String(daysPreset)} onChange={(e) => setDaysPreset(Number(e.target.value))}>
              <option value="7">{dayLabel(7)}</option>
              <option value="30">{dayLabel(30)}</option>
              <option value="90">{dayLabel(90)}</option>
              <option value="0">{labels.customDate}</option>
            </FilterSelect>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                disabled={daysPreset !== 0}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="admin-input disabled:cursor-not-allowed disabled:opacity-50"
              />
              <input
                type="date"
                disabled={daysPreset !== 0}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="admin-input disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <label className="admin-toggle">
              <input
                type="checkbox"
                checked={includePendingOverlay}
                onChange={(e) => setIncludePendingOverlay(e.target.checked)}
              />
              <span>{labels.showPendingOverlay}</span>
            </label>

            <div className="border-t border-slate-200/70 pt-3 dark:border-white/10">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-indigo-200/60">{labels.topSort}</p>
              <div className="grid grid-cols-2 gap-2">
                <FilterSelect value={sortPkgBy} onChange={(e) => setSortPkgBy(e.target.value)}>
                  <option value="bookings">{labels.sortBookings}</option>
                  <option value="revenue">{labels.sortRevenue}</option>
                </FilterSelect>
                <FilterSelect value={sortPkgDir} onChange={(e) => setSortPkgDir(e.target.value)}>
                  <option value="desc">{labels.sortDesc}</option>
                  <option value="asc">{labels.sortAsc}</option>
                </FilterSelect>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" className="admin-btn-secondary flex-1" onClick={resetFilters}>
                {labels.reset}
              </button>
              <button
                type="button"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-3 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500"
                onClick={() => window.location.reload()}
              >
                <RotateCcw size={15} />
                {labels.refresh}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Ringkasan Operasional</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-indigo-200/60">
              Periode aktif: <span className="font-semibold text-slate-700 dark:text-white">{dayLabel(daysWindow)}</span>
            </p>
          </div>
          <div className="admin-panel inline-flex items-center gap-3 self-start px-4 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Konversi</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{loading ? "—" : `${stats.conversionRate}%`}</p>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-white/10" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Pending</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{loading ? "—" : stats.bookingsPending}</p>
            </div>
          </div>
        </div>

        <div className="admin-panel overflow-hidden">
          <div className="flex gap-3 overflow-x-auto p-4">
            <MetricPill label={labels.confirmedBookings} value={stats.bookingsConfirm} accent="text-violet-600 dark:text-violet-300" loading={loading} />
            <MetricPill label={labels.confirmedRevenue} value={`Rp ${fmtIDR(stats.revenueConfirm)}`} accent="text-cyan-600 dark:text-cyan-300" loading={loading} />
            <MetricPill label={labels.avgRevenue} value={`Rp ${fmtIDR(stats.avgRevenue)}`} accent="text-amber-600 dark:text-amber-300" loading={loading} />
            <MetricPill label="Paket Aktif" value={stats.packages} accent="text-indigo-600 dark:text-indigo-300" loading={loading} />
            <MetricPill label="Section" value={stats.sections} accent="text-slate-700 dark:text-slate-200" loading={loading} />
          </div>
        </div>

        <AdminPanel title={labels.dailyTrends} subtitle="Grafik order & pendapatan harian" icon={TrendingUp} className="xl:col-span-2">
          {loading ? <Skeleton className="h-80" /> : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={seriesDaily}>
                <defs>
                  <linearGradient id="bookingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_GRID} strokeDasharray="4 4" />
                <XAxis dataKey="label" tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: CHART_AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v, n) =>
                    n === "revenue"
                      ? [`Rp ${fmtIDR(v)}`, labels.revenueMetric]
                      : [v, labels.bookingsMetric]
                  }
                />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="count" name={labels.confirmedBookingMetric} stroke="#8b5cf6" fill="url(#bookingFill)" strokeWidth={2.5} />
                <Area yAxisId="right" type="monotone" dataKey="revenue" name={labels.confirmedRevenueMetric} stroke="#22d3ee" fill="url(#revenueFill)" strokeWidth={2.5} />
                {includePendingOverlay ? (
                  <Area
                    yAxisId="left"
                    type="monotone"
                    data={seriesDailyPending}
                    dataKey="count"
                    name={labels.pendingMetric}
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.08}
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  />
                ) : null}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </AdminPanel>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <AdminPanel title={labels.recentBookings} icon={Calendar} className="lg:col-span-7">
            {loading ? <Skeleton className="h-80" /> : recent.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500 dark:text-indigo-200/60">{labels.noRecentBookings}</p>
            ) : (
              <div className="space-y-3">
                {recent.map((row) => (
                  <article
                    key={row.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 transition hover:border-violet-300/60 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold">{row.customer_name}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-indigo-200/60">
                        {new Date(row.created_at).toLocaleDateString(dateLocale)} · {formatAudienceLabel(row.audience)} · {row.package_id.slice(0, 8)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-violet-700 dark:text-violet-300">Rp {fmtIDR(row.total_idr)}</p>
                      <StatusBadge status={row.status} label={formatStatusLabel(row.status)} />
                      <ChevronRight size={16} className="hidden text-slate-400 sm:block" />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </AdminPanel>

          <div className="space-y-4 lg:col-span-5">
            <AdminPanel title={labels.topPackages} subtitle="Peringkat berdasarkan filter aktif" icon={Package}>
              {loading ? <Skeleton className="h-48" /> : topPackages.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">Belum ada data paket</p>
              ) : (
                <div className="space-y-4">
                  {topPackages.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="flex gap-3">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-sm font-black text-violet-600 dark:text-violet-300">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <RankedPackage
                          name={item.name}
                          value={item.value}
                          max={topPackagesMax}
                          isRevenue={sortPkgBy === "revenue"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminPanel>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <AdminPanel title={labels.statusDistribution} icon={PieIcon}>
                {loading ? <Skeleton className="h-52" /> : (
                  <ResponsiveContainer width="100%" height={208}>
                    <PieChart>
                      <Pie data={statusCounts} dataKey="count" nameKey="label" innerRadius={48} outerRadius={78} paddingAngle={3}>
                        {statusCounts.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </AdminPanel>

              <AdminPanel title={labels.audienceDistribution} icon={Users}>
                {loading ? <Skeleton className="h-52" /> : (
                  <ResponsiveContainer width="100%" height={208}>
                    <PieChart>
                      <Pie data={audienceDist} dataKey="count" nameKey="label" innerRadius={48} outerRadius={78} paddingAngle={3}>
                        {audienceDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </AdminPanel>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
