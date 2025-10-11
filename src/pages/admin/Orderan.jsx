// src/pages/admin/Orderan.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useTranslation } from "react-i18next";
import {
  Search, Filter, ArrowUpDown, Download, Eye, RotateCcw, FileText, Save,
  CheckCircle2, XCircle, Copy, Printer, ChevronDown, CheckSquare, Square, Calendar as CalendarIcon
} from "lucide-react";

/* =========================
   Small inline DatePicker
   ========================= */
function formatYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseYMD(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt) ? null : dt;
}
function Calendar({ value, onSelect, startOnMonday = false }) {
  const sel = parseYMD(value);
  const today = new Date();
  const [month, setMonth] = useState(() => (sel ? new Date(sel) : new Date()));
  month.setDate(1);

  const dow = startOnMonday ? ["Mo","Tu","We","Th","Fr","Sa","Su"] : ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const firstDay = (month.getDay() + (startOnMonday ? 6 : 0)) % 7; // 0..6
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const prevMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const nextMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));

  const cells = [];
  // prev trailing
  for (let i = 0; i < firstDay; i++) {
    const dt = new Date(month.getFullYear(), month.getMonth(), 0 - (firstDay - 1 - i));
    cells.push({ dt, outside: true });
  }
  // current
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dt: new Date(month.getFullYear(), month.getMonth(), d), outside: false });
  }
  // next leading to complete 6 rows (42 cells)
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].dt;
    cells.push({ dt: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), outside: true });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].dt;
    cells.push({ dt: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), outside: true });
  }

  return (
    <div className="w-[280px] select-none">
      <div className="flex items-center justify-between p-2">
        <button onClick={prevMonth} className="btn btn-outline !py-1 !px-2">{'‹'}</button>
        <div className="text-sm font-semibold">
          {month.toLocaleString("id-ID", { month: "long", year: "numeric" })}
        </div>
        <button onClick={nextMonth} className="btn btn-outline !py-1 !px-2">{'›'}</button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-slate-500 dark:text-slate-400 px-2">
        {dow.map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 p-2">
        {cells.map(({ dt, outside }, i) => {
          const isSel = sel && dt.toDateString() === sel.toDateString() && !outside;
          const isToday = dt.toDateString() === today.toDateString() && !outside;
          return (
            <button
              key={i}
              onClick={() => !outside && onSelect(formatYMD(dt))}
              disabled={outside}
              className={[
                "py-1.5 rounded-xl border text-sm",
                outside
                  ? "border-transparent text-slate-400/60 dark:text-slate-500/50"
                  : "border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-500",
                isSel
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
                  : isToday
                  ? "bg-slate-100 dark:bg-slate-800"
                  : "bg-white dark:bg-slate-900"
              ].join(" ")}
            >
              {dt.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
function DatePicker({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        className="w-full px-3 py-2 rounded-2xl border flex items-center justify-between gap-2 bg-white dark:bg-slate-900"
        onClick={() => setOpen((v) => !v)}
        type="button"
        title={label}
      >
        <span className="flex items-center gap-2 text-sm">
          <CalendarIcon size={16} className="text-slate-500" />
          <span className="text-slate-700 dark:text-slate-200">{label}</span>
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{value || "—"}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-smooth p-2">
          <Calendar
            value={value}
            onSelect={(d) => { onChange(d); setOpen(false); }}
          />
          <div className="flex items-center justify-between px-1 pt-1">
            <button
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
            >
              Hapus
            </button>
            <button
              className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
              type="button"
              onClick={() => { onChange(formatYMD(new Date())); setOpen(false); }}
            >
              Hari ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Main page
   ========================= */
const STATUS_OPTIONS = ["pending", "confirmed", "cancelled"];

export default function Orderan() {
  const { t, i18n } = useTranslation();

  // ====== STATE ======
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [genId, setGenId] = useState(null);

  // filters & table prefs
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visibleCols, setVisibleCols] = useState({
    time: true, tourDate: true, package: true, name: true, contact: true, pax: true, total: true, status: true, invoice: true, actions: true
  });
  const [selected, setSelected] = useState(() => new Set());

  // ====== LABEL LOKAL ======
  const columnLabel = useMemo(() => {
    const L = {
      id: { invoice: "Invoice", actions: "Aksi", search: "Cari nama/email/telepon…", allStatus: "Semua Status", exportCsv: "CSV", save: "Simpan", saving: "Menyimpan…" },
      en: { invoice: "Invoice", actions: "Actions", search: "Search name/email/phone…", allStatus: "All Status", exportCsv: "CSV", save: "Save", saving: "Saving…" },
      ja: { invoice: "インボイス", actions: "操作", search: "名前/メール/電話で検索…", allStatus: "すべてのステータス", exportCsv: "CSV", save: "保存", saving: "保存中…" },
    };
    const lang = i18n.language?.slice(0, 2) || "en";
    return L[lang] || L.en;
  }, [i18n.language]);

  // ====== LOAD DATA ======
  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, created_at, status, invoice,
        booking_id, package_id, name, email, phone, pax,
        bookings:booking_id ( total_idr, customer_name, date, notes, invoice_no, invoice_pdf_url )
      `)
      .order("created_at", { ascending: false });

    if (!error) setRows(data || []);
    else console.error(error);
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => { load(); }, [i18n.language]);

  // ====== HELPERS ======
  const fmtIDR = (n) => (Number(n || 0)).toLocaleString("id-ID");
  const insideDateRange = (iso) => {
    if (!iso) return true;
    const d = new Date(iso).setHours(0,0,0,0);
    const fromOk = dateFrom ? d >= new Date(dateFrom).setHours(0,0,0,0) : true;
    const toOk   = dateTo   ? d <= new Date(dateTo).setHours(0,0,0,0)   : true;
    return fromOk && toOk;
  };
  const toggleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDir("asc"); }
  };
  const thBtn = (label, key) => (
    <button onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:opacity-80">
      {label} {sortBy === key && <ArrowUpDown size={14} className={`inline ${sortDir === "asc" ? "rotate-180" : ""}`} />}
    </button>
  );
  const resetFilters = () => {
    setQ(""); setStatusFilter(""); setDateFrom(""); setDateTo(""); setSortBy("created_at"); setSortDir("desc"); setPage(1);
  };

  // search, filter, sort
  const processed = useMemo(() => {
    const text = q.trim().toLowerCase();
    let arr = (rows || []).filter((r) => {
      const inStatus = statusFilter ? r.status === statusFilter : true;
      const inText =
        !text ||
        [r.name, r.email, r.phone, r.package_id, r.bookings?.customer_name, r.bookings?.invoice_no]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(text));
      const inRange = insideDateRange(r.bookings?.date);
      return inStatus && inText && inRange;
    });

    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const val = (row, by) => {
        switch (by) {
          case "created_at": return new Date(row.created_at).getTime();
          case "date":       return new Date(row.bookings?.date || row.created_at).getTime();
          case "total":      return (row.bookings?.total_idr || 0);
          case "name":       return (row.name || row.bookings?.customer_name || "");
          case "status":     return row.status || "";
          default:           return row[by] ?? "";
        }
      };
      const va = val(a, sortBy), vb = val(b, sortBy);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });

    return arr;
  }, [rows, q, statusFilter, dateFrom, dateTo, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const pageRows = processed.slice((page - 1) * pageSize, page * pageSize);

  const setRowField = (id, patch) => setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  // selection
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const toggleSelectAllCurrent = () => {
    const ids = pageRows.map((r) => r.id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => (allSelected ? n.delete(id) : n.add(id)));
      return n;
    });
  };

  // ====== SAVE / INVOICE ======
  const saveRow = async (r) => {
    setSavingId(r.id);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: r.status, invoice: r.invoice || r.bookings?.invoice_pdf_url || null })
        .eq("id", r.id);
      if (error) throw error;

      const noPdfYet = !(r.bookings?.invoice_pdf_url || r.invoice);
      if (r.status === "confirmed" && noPdfYet) {
        await generateAndAttachInvoice(r);
      }

      await load();
      alert(t("admin.orders.saved", { defaultValue: "Tersimpan" }));
    } catch (e) {
      console.error(e);
      alert(t("admin.orders.updateFailed", { defaultValue: "Gagal menyimpan" }));
    } finally {
      setSavingId(null);
    }
  };

  const makeInvoiceNo = (r) => {
    if (r?.bookings?.invoice_no) return r.bookings.invoice_no;
    const d = new Date(r.created_at);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    const tail = String(r.booking_id || r.id).replace(/-/g, "").slice(0, 8).toUpperCase();
    return `INV/${y}${m}${day}/${tail}`;
  };

  const fetchBookingItems = async (bookingId) => {
    const { data, error } = await supabase
      .from("booking_items")
      .select("item_name, qty, price_idr, total_idr")
      .eq("booking_id", bookingId)
      .order("id", { ascending: true });
    if (error) throw error;
    return data || [];
  };

  const buildInvoicePdfBlob = async (orderRow, items) => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const left = 48;
    let y = 60;

    const invoiceNo = makeInvoiceNo(orderRow);
    const booking = orderRow.bookings || {};
    const total = Number(booking.total_idr || 0);

    // Header
    doc.setFontSize(18);
    doc.text("INVOICE", left, y);
    doc.setFontSize(11);
    doc.text(`No: ${invoiceNo}`, left, (y += 18));
    doc.text(`Tanggal: ${new Date(orderRow.created_at).toLocaleString()}`, left, (y += 16));

    // Bill To
    y += 18;
    doc.setFontSize(12);
    doc.text("Kepada:", left, y);
    doc.setFontSize(11);
    doc.text(`${orderRow.name || booking.customer_name || "-"}`, left, (y += 16));
    if (orderRow.email) doc.text(`${orderRow.email}`, left, (y += 14));
    if (orderRow.phone) doc.text(`${orderRow.phone}`, left, (y += 14));
    doc.text(`Tanggal Tour: ${booking.date || "-"}`, left, (y += 16));
    doc.text(`Pax: ${orderRow.pax || 1}`, left, (y += 16));

    // Items
    const fmt = (n) => (Number(n || 0)).toLocaleString("id-ID");
    y += 14;

    autoTable(doc, {
      startY: y,
      head: [["Deskripsi", "Qty", "Harga", "Subtotal"]],
      body: (items?.length ? items : [{ item_name: "-", qty: 1, price_idr: 0, total_idr: 0 }]).map((it) => [
        String(it.item_name || "-"),
        String(it.qty || 1),
        fmt(it.price_idr),
        fmt(it.total_idr),
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [241, 245, 249], textColor: 30 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
      margin: { left, right: 48 },
      theme: "striped",
    });

    const after = doc.lastAutoTable.finalY || (y + 120);

    // Total
    const labelX = 360, totalX = 500;
    doc.setLineWidth(0.5);
    doc.line(labelX, after + 8, 547, after + 8);
    doc.setFontSize(12);
    doc.text("TOTAL", labelX + 60, after + 26, { align: "right" });
    doc.text(`${fmt(total)} IDR`, totalX, after + 26, { align: "right" });

    // Notes
    doc.setFontSize(10);
    doc.text("Terima kasih atas kepercayaan Anda. Harap bawa/unduh invoice ini saat trip berlangsung.", left, after + 56);

    return doc.output("blob");
  };

  const uploadInvoiceBlob = async (blob, orderRow, invoiceNo) => {
    const safeNo = invoiceNo.replace(/[^\w\-\/]/g, "_");
    const path = `invoices/${safeNo}-${orderRow.booking_id || orderRow.id}.pdf`;
    const { error: upErr } = await supabase.storage
      .from("assets")
      .upload(path, blob, { cacheControl: "3600", upsert: true, contentType: "application/pdf" });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("assets").getPublicUrl(path);
    return pub?.publicUrl;
  };

  const generateAndAttachInvoice = async (r) => {
    setGenId(r.id);
    try {
      const items = await fetchBookingItems(r.booking_id);
      const blob = await buildInvoicePdfBlob(r, items);
      const invoiceNo = makeInvoiceNo(r);
      const url = await uploadInvoiceBlob(blob, r, invoiceNo);

      const upBookings = await supabase
        .from("bookings")
        .update({ invoice_no: invoiceNo, invoice_pdf_url: url })
        .eq("id", r.booking_id);
      if (upBookings.error) throw upBookings.error;

      const upOrders = await supabase
        .from("orders")
        .update({ invoice: url })
        .eq("id", r.id);
      if (upOrders.error) throw upOrders.error;

      setRows((prev) =>
        prev.map((x) =>
          x.id === r.id
            ? { ...x, invoice: url, bookings: { ...(x.bookings || {}), invoice_no: invoiceNo, invoice_pdf_url: url } }
            : x
        )
      );
      alert(t("admin.orders.invoiceGenerated", { defaultValue: "Invoice dibuat." }));
    } catch (e) {
      console.error(e);
      alert(t("admin.orders.invoiceFailed", { defaultValue: "Gagal membuat invoice." }));
    } finally {
      setGenId(null);
    }
  };

  // bulk actions (tetap ada)
  const bulkConfirm = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("orders").update({ status: "confirmed" }).in("id", ids);
    if (error) { alert("Gagal update status."); return; }
    const target = rows.filter((r) => ids.includes(r.id) && !(r.bookings?.invoice_pdf_url || r.invoice));
    for (const r of target) await generateAndAttachInvoice({ ...r, status: "confirmed" });
    await load();
  };
  const bulkCancel = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).in("id", ids);
    if (error) { alert("Gagal update status."); return; }
    await load();
  };

  const exportCsv = () => {
    const header = ["Created At", "Tour Date", "Invoice No", "Name", "Email", "Phone", "Pax", "Total IDR", "Status", "Invoice URL"];
    const src = rows.filter((r) => selected.size === 0 || selected.has(r.id));
    const lines = src.map((r) => [
      new Date(r.created_at).toISOString(),
      r.bookings?.date || "",
      r.bookings?.invoice_no || "",
      r.name || r.bookings?.customer_name || "",
      r.email || "",
      r.phone || "",
      r.pax || 1,
      r.bookings?.total_idr || 0,
      r.status,
      r.bookings?.invoice_pdf_url || r.invoice || "",
    ]);
    const csv = [header, ...lines].map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ====== RENDER ======
  return (
    <div className="container mt-6 space-y-4">
      {/* STICKY TOOLBAR */}
      <div className="sticky top-16 z-[5]">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md px-3 sm:px-4 py-2 glass shadow-smooth">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold">{t("admin.orders.title", { defaultValue: "Orderan" })}</h1>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">{rows.length} total</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-outline !py-1.5 !px-3" onClick={load} title="Refresh">
                  <RotateCcw size={16} />
                </button>
                <button className="btn btn-outline !py-1.5 !px-3" onClick={exportCsv} title="Export CSV">
                  <Download size={16} /> <span className="ml-1 hidden md:inline">{columnLabel.exportCsv}</span>
                </button>

                {/* columns */}
                <div className="relative group">
                  <button className="btn btn-outline !py-1.5 !px-3 inline-flex items-center gap-1">
                    <Eye size={16} /><ChevronDown size={14}/>
                  </button>
                  <div className="absolute right-0 mt-1 hidden group-hover:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 min-w-[180px]">
                    {Object.entries(visibleCols).map(([k, v]) => (
                      <label key={k} className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={v}
                          onChange={(e) => setVisibleCols((c) => ({ ...c, [k]: e.target.checked }))}
                        />
                        <span className="capitalize">{k}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* FILTER BAR */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
              <div className="relative lg:col-span-2">
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  placeholder={columnLabel.search}
                  className="w-full pl-9 pr-3 py-2 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-500" />
                <select
                  className="px-3 py-2 rounded-2xl border w-full bg-white dark:bg-slate-900"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                  <option value="">{columnLabel.allStatus}</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <DatePicker label="Tanggal mulai" value={dateFrom} onChange={(v)=>{ setDateFrom(v); setPage(1); }} />
              <DatePicker label="Tanggal akhir" value={dateTo} onChange={(v)=>{ setDateTo(v); setPage(1); }} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <button className="btn btn-outline !py-1 !px-3" onClick={resetFilters}>Reset</button>
                <span className="text-slate-500 hidden sm:inline">Sort:</span>
                <select
                  className="px-3 py-1.5 rounded-2xl border bg-white dark:bg-slate-900"
                  value={`${sortBy}:${sortDir}`}
                  onChange={(e) => {
                    const [by, dir] = e.target.value.split(":");
                    setSortBy(by); setSortDir(dir);
                  }}
                >
                  <option value="created_at:desc">Terbaru</option>
                  <option value="created_at:asc">Terlama</option>
                  <option value="date:asc">Tanggal Tour ↑</option>
                  <option value="date:desc">Tanggal Tour ↓</option>
                  <option value="total:asc">Total ↑</option>
                  <option value="total:desc">Total ↓</option>
                  <option value="name:asc">Nama A→Z</option>
                  <option value="name:desc">Nama Z→A</option>
                  <option value="status:asc">Status ↑</option>
                  <option value="status:desc">Status ↓</option>
                </select>
              </div>

              {/* bulk actions */}
              <div className="flex items-center gap-2">
                <button className="btn btn-outline !py-1.5 !px-3" onClick={bulkConfirm} disabled={selected.size===0}>
                  <CheckCircle2 size={16}/> <span className="ml-1 hidden md:inline">Confirm Selected</span>
                </button>
                <button className="btn btn-outline !py-1.5 !px-3" onClick={bulkCancel} disabled={selected.size===0}>
                  <XCircle size={16}/> <span className="ml-1 hidden md:inline">Cancel Selected</span>
                </button>
                <button className="btn btn-outline !py-1.5 !px-3" onClick={exportCsv}>
                  <Download size={16}/> <span className="ml-1 hidden md:inline">{columnLabel.exportCsv}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card">
        <div className="overflow-auto max-h-[70vh]">
          {loading ? (
            <div className="p-4 text-sm text-slate-500">Loading…</div>
          ) : (
            <table
              className={`min-w-full table-fixed text-sm border-collapse
              [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wide [&_th]:font-semibold
              [&_th]:text-slate-700 dark:[&_th]:text-slate-200
              [&_td]:align-top
              [&_th]:border-l [&_td]:border-l first:[&_th]:border-l-0 first:[&_td]:border-l-0
              [&_th]:border-slate-200 [&_td]:border-slate-200
              dark:[&_th]:border-slate-700 dark:[&_td]:border-slate-800`}
            >
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 dark:bg-slate-800/80 backdrop-blur">
                  <th className="p-3 w-10 border-b border-slate-200 dark:border-slate-700">
                    <button className="inline-flex items-center" onClick={toggleSelectAllCurrent} title="Select page">
                      {pageRows.every((r) => selected.has(r.id)) ? <CheckSquare size={16}/> : <Square size={16}/>}
                    </button>
                  </th>
                  {visibleCols.time && <th className="p-3 border-b border-slate-200 dark:border-slate-700">{thBtn("Waktu", "created_at")}</th>}
                  {visibleCols.tourDate && <th className="p-3 border-b border-slate-200 dark:border-slate-700">{thBtn("Tgl Tour", "date")}</th>}
                  {visibleCols.package && <th className="p-3 border-b border-slate-200 dark:border-slate-700">{thBtn("Paket", "package_id")}</th>}
                  {visibleCols.name && <th className="p-3 border-b border-slate-200 dark:border-slate-700">{thBtn("Nama", "name")}</th>}
                  {visibleCols.contact && <th className="p-3 border-b border-slate-200 dark:border-slate-700">Kontak</th>}
                  {visibleCols.pax && <th className="p-3 border-b border-slate-200 dark:border-slate-700">{thBtn("Pax", "pax")}</th>}
                  {visibleCols.total && <th className="p-3 border-b border-slate-200 dark:border-slate-700">{thBtn("Total (IDR)", "total")}</th>}
                  {visibleCols.status && <th className="p-3 border-b border-slate-200 dark:border-slate-700">{thBtn("Status", "status")}</th>}
                  {visibleCols.invoice && <th className="p-3 border-b border-slate-200 dark:border-slate-700">{columnLabel.invoice}</th>}
                  {visibleCols.actions && <th className="p-3 border-b border-slate-200 dark:border-slate-700 w-40">{columnLabel.actions}</th>}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => {
                  const total = r.bookings?.total_idr || 0;
                  const tourDate = r.bookings?.date ? new Date(r.bookings.date).toLocaleDateString() : "-";
                  const createdAt = new Date(r.created_at).toLocaleString();
                  const canGenerate = r.status === "confirmed" && !(r.bookings?.invoice_pdf_url || r.invoice);
                  const invUrl = r.bookings?.invoice_pdf_url || r.invoice || "";
                  const invNo = r.bookings?.invoice_no || "";

                  const StatusBadge = () => (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      r.status === "confirmed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200" :
                      r.status === "cancelled" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                    }`}>{r.status}</span>
                  );

                  return (
                    <tr
                      key={r.id}
                      className="odd:bg-slate-50 even:bg-white dark:odd:bg-slate-900/30 dark:even:bg-slate-900/10 border-b border-slate-200 dark:border-slate-800"
                    >
                      <td className="p-3 w-10">
                        <button className="inline-flex items-center" onClick={() => toggleSelect(r.id)}>
                          {selected.has(r.id) ? <CheckSquare size={16}/> : <Square size={16}/>}
                        </button>
                      </td>
                      {visibleCols.time && <td className="p-3">{createdAt}</td>}
                      {visibleCols.tourDate && <td className="p-3">{tourDate}</td>}
                      {visibleCols.package && <td className="p-3 break-words">{r.package_id}</td>}
                      {visibleCols.name && <td className="p-3 font-medium">{r.name || r.bookings?.customer_name || "-"}</td>}
                      {visibleCols.contact && (
                        <td className="p-3">
                          <div>{r.phone || "-"}</div>
                          <div className="text-[12px] text-slate-500 dark:text-slate-400">{r.email || "-"}</div>
                        </td>
                      )}
                      {visibleCols.pax && <td className="p-3">{r.pax || 1}</td>}
                      {visibleCols.total && <td className="p-3">{fmtIDR(total)}</td>}

                      {visibleCols.status && (
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <StatusBadge />
                            <select
                              className="border rounded-xl px-2 py-1 bg-white dark:bg-slate-900"
                              value={r.status}
                              onChange={(e) => setRowField(r.id, { status: e.target.value })}
                            >
                              {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
                            </select>
                          </div>
                        </td>
                      )}

                      {visibleCols.invoice && (
                        <td className="p-3 min-w-[260px]">
                          <div className="flex items-center gap-2">
                            <input
                              className="flex-1 border rounded-xl px-2 py-1 bg-white dark:bg-slate-900"
                              placeholder="URL invoice (auto saat Confirmed)"
                              value={invUrl}
                              onChange={(e) => {
                                const v = e.target.value;
                                setRows((prev) =>
                                  prev.map((x) =>
                                    x.id === r.id
                                      ? { ...x, invoice: v, bookings: { ...(x.bookings || {}), invoice_pdf_url: v } }
                                      : x
                                  )
                                );
                              }}
                            />
                            {invUrl ? (
                              <>
                                <a href={invUrl} target="_blank" rel="noreferrer" className="btn btn-outline !py-1 !px-2" title="Lihat PDF">
                                  <Eye size={16} />
                                </a>
                                <a href={invUrl} download className="btn btn-outline !py-1 !px-2" title="Download PDF">
                                  <Download size={16} />
                                </a>
                                <button className="btn btn-outline !py-1 !px-2" title="Salin Link" onClick={() => navigator.clipboard.writeText(invUrl)}>
                                  <Copy size={16}/>
                                </button>
                                <a href={invUrl} target="_blank" rel="noreferrer" className="btn btn-outline !py-1 !px-2" title="Cetak">
                                  <Printer size={16}/>
                                </a>
                              </>
                            ) : (
                              <button
                                className="btn btn-outline !py-1 !px-2"
                                onClick={() => generateAndAttachInvoice({ ...r, status: "confirmed" })}
                                disabled={!canGenerate || genId === r.id}
                                title="Buat Invoice"
                              >
                                <FileText size={16} />
                              </button>
                            )}
                          </div>
                          {invNo && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">No: {invNo}</div>}
                        </td>
                      )}

                      {visibleCols.actions && (
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="btn btn-primary !py-1.5 !px-3"
                              onClick={() => saveRow({ ...r, invoice: invUrl })}
                              disabled={savingId === r.id}
                              title={columnLabel.save}
                            >
                              {savingId === r.id ? columnLabel.saving : (<><Save size={16} className="mr-1"/>{columnLabel.save}</>)}
                            </button>
                            {/* Tombol set confirmed/cancelled di kolom actions DIHAPUS sesuai permintaan */}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {processed.length === 0 && (
                  <tr>
                    <td className="p-4 text-slate-500" colSpan={11}>
                      {t("admin.common.empty", { defaultValue: "Tidak ada data." })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between text-sm">
        <div>
          {processed.length > 0 && (
            <span>
              Menampilkan{" "}
              <strong>
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, processed.length)}
              </strong>{" "}
              dari <strong>{processed.length}</strong> data
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="px-3 py-1.5 rounded-2xl border bg-white dark:bg-slate-900"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            title="Baris per halaman"
          >
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}/hal</option>)}
          </select>
          <button
            className="btn btn-outline !py-1 !px-3"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ‹ Prev
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            className="btn btn-outline !py-1 !px-3"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}
