// src/pages/admin/Orderan.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useTranslation } from "react-i18next";
import {
  Search, Filter, ArrowUpDown, Download, RotateCcw, FileText, Save,
  CheckCircle2, XCircle, ChevronDown, CheckSquare, Square, Calendar as CalendarIcon,
  MoreHorizontal, FileDown, Loader2
} from "lucide-react";
import ReactCountryFlag from "react-country-flag"; 

/* =========================
   DATE PICKER HELPERS
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
  const firstDay = (month.getDay() + (startOnMonday ? 6 : 0)) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const prevMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const nextMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    const dt = new Date(month.getFullYear(), month.getMonth(), 0 - (firstDay - 1 - i));
    cells.push({ dt, outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dt: new Date(month.getFullYear(), month.getMonth(), d), outside: false });
  }
  while (cells.length % 7 !== 0) {
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
          return (
            <button
              key={i}
              onClick={() => !outside && onSelect(formatYMD(dt))}
              disabled={outside}
              className={`py-1.5 rounded-xl border text-sm ${outside ? "border-transparent text-slate-400/60" : "border-slate-200 dark:border-slate-700"} ${isSel ? "bg-sky-100 text-sky-800" : "bg-white dark:bg-slate-900"}`}
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
      <button className="w-full px-3 py-2 rounded-2xl border flex items-center justify-between gap-2 bg-white dark:bg-slate-900" onClick={() => setOpen((v) => !v)} type="button">
        <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><CalendarIcon size={16} /> {label}</span>
        <span className="text-xs text-slate-500">{value || "—"}</span>
      </button>
      {open && <div className="absolute z-20 mt-1 right-0 bg-white dark:bg-slate-900 border rounded-2xl shadow-smooth p-2"><Calendar value={value} onSelect={(d) => { onChange(d); setOpen(false); }} /></div>}
    </div>
  );
}

/* =========================
   INVOICE DICTIONARY
   ========================= */
const INVOICE_LANG = {
  id: {
    title: "INVOICE", billedTo: "DITAGIH KEPADA", details: "DETAIL PESANAN", invNo: "Nomor Invoice", issueDate: "Tanggal Terbit", tourDate: "Tanggal Tour",
    desc: "Deskripsi", qty: "Pax", price: "Harga Satuan", subtotal: "Subtotal", total: "TOTAL PEMBAYARAN", status: "STATUS", confirmed: "LUNAS", pending: "BELUM LUNAS",
    footer1: "Terima kasih telah mempercayakan perjalanan Anda kepada Cidika Travel.", footer2: "Simpan dokumen ini sebagai bukti pembayaran yang sah.", contact: "Butuh bantuan? Hubungi WhatsApp kami."
  },
  en: {
    title: "INVOICE", billedTo: "BILLED TO", details: "ORDER DETAILS", invNo: "Invoice Number", issueDate: "Issue Date", tourDate: "Tour Date",
    desc: "Description", qty: "Pax", price: "Unit Price", subtotal: "Subtotal", total: "TOTAL AMOUNT", status: "STATUS", confirmed: "PAID", pending: "UNPAID",
    footer1: "Thank you for choosing Cidika Travel for your journey.", footer2: "Please keep this document as valid proof of payment.", contact: "Need help? Contact our WhatsApp."
  },
  ja: {
    title: "INVOICE", billedTo: "BILLED TO", details: "ORDER DETAILS", invNo: "Invoice Number", issueDate: "Issue Date", tourDate: "Tour Date",
    desc: "Description", qty: "Pax", price: "Unit Price", subtotal: "Subtotal", total: "TOTAL AMOUNT", status: "STATUS", confirmed: "PAID", pending: "UNPAID",
    footer1: "Thank you for choosing Cidika Travel.", footer2: "Please keep this invoice safe.", contact: "Contact our WhatsApp for support."
  }
};

/* =========================
   MAIN COMPONENT
   ========================= */
const STATUS_OPTIONS = ["pending", "confirmed"];

export default function Orderan() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Filters
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

  // UI Labels
  const columnLabel = useMemo(() => {
    const L = {
      id: { invoice: "Invoice", actions: "Aksi", search: "Cari...", allStatus: "Semua Status", exportCsv: "CSV", save: "Simpan", saving: "..." },
      en: { invoice: "Invoice", actions: "Actions", search: "Search...", allStatus: "All Status", exportCsv: "CSV", save: "Save", saving: "..." },
      ja: { invoice: "インボイス", actions: "操作", search: "検索...", allStatus: "すべて", exportCsv: "CSV", save: "保存", saving: "..." },
    };
    return L[i18n.language?.slice(0, 2)] || L.en;
  }, [i18n.language]);

  // Load Data - UPDATED: Fetch Package Title via Relation
  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id, created_at, status, invoice:invoice_pdf_url, package_id, name:customer_name, email, phone, pax, total_idr, date, notes, invoice_no, invoice_pdf_url,
        packages (
          package_locales ( title, lang )
        )
      `)
      .order("created_at", { ascending: false });

    if (!error) {
      // Process data to extract clean trip name
      const formattedData = (data || []).map(item => {
        let tripTitle = "Tour Package"; // Default fallback
        if (item.packages?.package_locales?.length > 0) {
           const locs = item.packages.package_locales;
           // Prioritize ID, then EN, then whatever is first
           const found = locs.find(l => l.lang === 'id') || locs.find(l => l.lang === 'en') || locs[0];
           if (found?.title) tripTitle = found.title;
        }
        return { ...item, trip_name: tripTitle };
      });
      setRows(formattedData);
    } else {
      console.error(error);
    }
    
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => { load(); }, [i18n.language]);

  // Helpers
  const fmtIDR = (n) => (Number(n || 0)).toLocaleString("id-ID");
  const insideDateRange = (iso) => {
    if (!iso) return true;
    const d = new Date(iso).setHours(0,0,0,0);
    const fromOk = dateFrom ? d >= new Date(dateFrom).setHours(0,0,0,0) : true;
    const toOk   = dateTo   ? d <= new Date(dateTo).setHours(0,0,0,0)   : true;
    return fromOk && toOk;
  };
  
  // Data Processing
  const processed = useMemo(() => {
    const text = q.trim().toLowerCase();
    let arr = (rows || []).filter((r) => {
      const inStatus = statusFilter ? r.status === statusFilter : true;
      const inText = !text || [r.name, r.email, r.phone, r.package_id, r.invoice_no, r.trip_name].filter(Boolean).some((v) => String(v).toLowerCase().includes(text));
      return inStatus && inText && insideDateRange(r.date);
    });
    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const val = (row, by) => {
        if(by === "created_at") return new Date(row.created_at).getTime();
        if(by === "date") return new Date(row.date || row.created_at).getTime();
        if(by === "total_idr") return (row.total_idr || 0);
        return row[by] ?? "";
      };
      const va = val(a, sortBy), vb = val(b, sortBy);
      return (typeof va === "number" ? va - vb : String(va).localeCompare(String(vb))) * dir;
    });
    return arr;
  }, [rows, q, statusFilter, dateFrom, dateTo, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const pageRows = processed.slice((page - 1) * pageSize, page * pageSize);
  const setRowField = (id, patch) => setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const toggleSelect = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAllCurrent = () => {
    const ids = pageRows.map((r) => r.id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => { const n = new Set(prev); ids.forEach((id) => (allSelected ? n.delete(id) : n.add(id))); return n; });
  };

  // ===== INVOICE GENERATOR ENGINE =====
  const makeInvoiceNo = (r) => {
    if (r?.invoice_no) return r.invoice_no;
    const d = new Date(r.created_at);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    const tail = String(r.id).replace(/-/g, "").slice(0, 6).toUpperCase();
    return `INV/${y}${m}${day}/${tail}`;
  };

  const fetchBookingItems = async (bookingId) => {
    const { data } = await supabase.from("booking_items").select("*").eq("booking_id", bookingId);
    return data || [];
  };

  const buildInvoicePdfBlob = async (orderRow, items, langCode) => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    
    // Force EN for Japanese to safely render text without custom font
    const usedLang = langCode === 'ja' ? 'en' : (INVOICE_LANG[langCode] ? langCode : 'en');
    const txt = INVOICE_LANG[usedLang];
    
    // Load Logo
    let logoBase64 = null;
    try {
      const res = await fetch('/biru.png');
      const blob = await res.blob();
      logoBase64 = await new Promise(r => { const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(blob); });
    } catch {}

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const brandColor = "#0ea5e9";

    doc.setFillColor(brandColor);
    doc.rect(0, 0, pageWidth, 10, "F");
    if (logoBase64) doc.addImage(logoBase64, 'PNG', margin, 30, 100, 50);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(30, 41, 59);
    doc.text(txt.title, pageWidth - margin, 50, { align: "right" });

    doc.setFontSize(12);
    doc.setTextColor(orderRow.status === "confirmed" ? "#10b981" : "#ef4444");
    doc.text(orderRow.status === "confirmed" ? txt.confirmed : txt.pending, pageWidth - margin, 70, { align: "right" });

    let y = 110;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 25;

    const col2X = pageWidth / 2 + 20;
    // Customer Info
    doc.setFontSize(9); doc.setTextColor(148, 163, 184);
    doc.text(txt.billedTo, margin, y);
    y += 15;
    doc.setFontSize(11); doc.setTextColor(30, 41, 59);
    doc.text(orderRow.name || "-", margin, y);
    y += 14;
    doc.setFontSize(10); doc.setTextColor(71, 85, 105);
    doc.text(orderRow.email || "-", margin, y);
    if(orderRow.phone) { y += 14; doc.text(orderRow.phone, margin, y); }

    // Invoice Meta
    y = 135;
    doc.setFontSize(9); doc.setTextColor(148, 163, 184);
    doc.text(txt.invNo, col2X, y);
    doc.setFontSize(10); doc.setTextColor(30, 41, 59);
    const invoiceNo = makeInvoiceNo(orderRow);
    doc.text(invoiceNo, pageWidth - margin, y, { align: "right" });

    y += 20;
    doc.setFontSize(9); doc.setTextColor(148, 163, 184);
    doc.text(txt.issueDate, col2X, y);
    doc.setFontSize(10); doc.setTextColor(30, 41, 59);
    // Format date based on invoice language (or fallback to US for consistency in EN invoices)
    const dateLocale = usedLang === 'id' ? 'id-ID' : 'en-US';
    doc.text(new Date(orderRow.created_at).toLocaleDateString(dateLocale), pageWidth - margin, y, { align: "right" });

    y += 20;
    doc.setFontSize(9); doc.setTextColor(148, 163, 184);
    doc.text(txt.tourDate, col2X, y);
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(new Date(orderRow.date || "").toLocaleDateString(dateLocale, { dateStyle: 'medium' }), pageWidth - margin, y, { align: "right" });

    y += 40;
    const fmt = (n) => (Number(n || 0)).toLocaleString(dateLocale);
    
    // Use Trip Name if items is generic or empty
    const rowBody = (items?.length ? items : [{ 
        // FALLBACK: Use trip_name we fetched in load()
        item_name: orderRow.trip_name || "Tour Package", 
        qty: orderRow.pax, 
        price_idr: orderRow.total_idr/Math.max(1, orderRow.pax), 
        total_idr: orderRow.total_idr 
    }]).map(it => [
        String(it.item_name || orderRow.trip_name || "-"), 
        String(it.qty||1), 
        fmt(it.price_idr), 
        fmt(it.total_idr)
    ]);

    autoTable(doc, {
      startY: y,
      head: [[txt.desc, txt.qty, `${txt.price} (IDR)`, `${txt.subtotal} (IDR)`]],
      body: rowBody,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 10, textColor: 50 },
      headStyles: { fillColor: [248, 250, 252], textColor: 100, fontStyle: 'bold', lineColor: 230, lineWidth: { bottom: 1 } },
      bodyStyles: { lineColor: 240, lineWidth: { bottom: 1 } },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } },
      margin: { left: margin, right: margin },
    });

    let finalY = doc.lastAutoTable.finalY + 20;
    doc.setFillColor(248, 250, 252);
    // Increased width to avoid text overlap
    doc.roundedRect(pageWidth - margin - 240, finalY, 240, 40, 4, 4, "F");
    
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 41, 59);
    // Shift Label to Left
    doc.text(txt.total, pageWidth - margin - 220, finalY + 25);
    
    doc.setFontSize(14); doc.setTextColor(brandColor);
    doc.text(`IDR ${fmt(orderRow.total_idr)}`, pageWidth - margin - 20, finalY + 25, { align: "right" });

    const footerY = pageHeight - 60;
    doc.setDrawColor(226, 232, 240); doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(148, 163, 184);
    doc.text(txt.footer1, pageWidth / 2, footerY + 20, { align: "center" });
    doc.text(txt.contact, pageWidth / 2, footerY + 34, { align: "center" });
    
    return doc.output("blob");
  };

  const uploadInvoiceBlob = async (blob, orderRow, invoiceNo) => {
    const path = `invoices/${invoiceNo.replace(/[^\w\-\/]/g, "_")}-${orderRow.id}.pdf`;
    const { error } = await supabase.storage.from("assets").upload(path, blob, { cacheControl: "3600", upsert: true, contentType: "application/pdf" });
    if (error) throw error;
    const { data } = supabase.storage.from("assets").getPublicUrl(path);
    return data?.publicUrl;
  };

  const ensureInvoiceExists = async (r) => {
    const items = await fetchBookingItems(r.id);
    const blob = await buildInvoicePdfBlob(r, items, "id");
    const invoiceNo = makeInvoiceNo(r);
    const url = await uploadInvoiceBlob(blob, r, invoiceNo);
    
    await supabase.from("bookings").update({ invoice_no: invoiceNo, invoice_pdf_url: url }).eq("id", r.id);
    return { url, invoiceNo };
  };

  const saveRow = async (r) => {
    setSavingId(r.id);
    try {
      await supabase.from("bookings").update({ status: r.status }).eq("id", r.id);
      if (r.status === "confirmed" && !r.invoice_pdf_url) {
        await ensureInvoiceExists(r);
      }
      await load();
      alert(t("admin.orders.saved", { defaultValue: "Tersimpan" }));
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan");
    } finally { setSavingId(null); }
  };

  const handleDownload = async (row, lang) => {
    setDownloadingId(row.id);
    try {
      let invNo = row.invoice_no;
      if (!invNo && row.status === 'confirmed') {
         const res = await ensureInvoiceExists(row);
         invNo = res.invoiceNo;
      }
      if (!invNo) invNo = makeInvoiceNo(row);

      const items = await fetchBookingItems(row.id);
      // Pass the clean trip name from row to generator
      const blob = await buildInvoicePdfBlob(row, items, lang);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invNo}-${lang.toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Gagal download invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  const InvoiceDropdown = ({ row }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
      document.addEventListener('mousedown', fn);
      return () => document.removeEventListener('mousedown', fn);
    }, []);

    if (row.status !== 'confirmed') return <span className="text-xs text-slate-400 italic">Confirm first</span>;

    return (
      <div className="relative" ref={ref}>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="btn btn-outline !py-1.5 !px-3 inline-flex items-center gap-2 text-sm"
          disabled={downloadingId === row.id}
        >
           {downloadingId === row.id ? <Loader2 className="animate-spin" size={16}/> : <FileDown size={16}/>}
           <span>Download</span>
           <ChevronDown size={14}/>
        </button>
        
        {isOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800">
              Pilih Bahasa
            </div>
            <button onClick={() => { handleDownload(row, 'id'); setIsOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-sm">
              <ReactCountryFlag countryCode="ID" svg /> Indonesia
            </button>
            <button onClick={() => { handleDownload(row, 'en'); setIsOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-sm">
              <ReactCountryFlag countryCode="US" svg /> English
            </button>
            <button onClick={() => { handleDownload(row, 'ja'); setIsOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-sm">
              <ReactCountryFlag countryCode="JP" svg /> Japan
            </button>
          </div>
        )}
      </div>
    )
  }

  const bulkConfirm = async () => {
    if (selected.size===0) return;
    const ids = Array.from(selected);
    await supabase.from("bookings").update({ status: "confirmed" }).in("id", ids);
    const target = rows.filter(r => ids.includes(r.id) && !r.invoice_pdf_url);
    for(const r of target) await ensureInvoiceExists({ ...r, status: 'confirmed' });
    await load();
  };
  const bulkCancel = async () => {
    if (selected.size===0) return;
    const ids = Array.from(selected);
    await supabase.from("bookings").update({ status: "cancelled" }).in("id", ids);
    await load();
  };

  const exportCsv = () => {
     const header = ["Date", "Invoice", "Name", "Trip", "Total", "Status"];
     const src = rows.filter(r => selected.size===0 || selected.has(r.id));
     const lines = src.map(r => [r.created_at, r.invoice_no||'', r.name, r.trip_name, r.total_idr, r.status]);
     const csv = [header, ...lines].map(r => r.join(",")).join("\n");
     const url = URL.createObjectURL(new Blob([csv], {type: "text/csv"}));
     const a = document.createElement('a'); a.href=url; a.download="orders.csv"; a.click();
  };

  return (
    <div className="container mt-3 space-y-4">
      <div className="sticky top-16 z-[5]">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md px-3 py-2 glass shadow-smooth">
           <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">{t("admin.orders.title", { defaultValue: "Orderan" })}</h1>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">{rows.length}</span>
              </div>
              <div className="flex items-center gap-2">
                 <button className="btn btn-outline !py-1.5 !px-3" onClick={load}><RotateCcw size={16}/></button>
                 <button className="btn btn-outline !py-1.5 !px-3" onClick={exportCsv}><Download size={16}/></button>
              </div>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 mt-2">
              <div className="relative lg:col-span-2">
                 <input value={q} onChange={e => setQ(e.target.value)} placeholder={columnLabel.search} className="w-full pl-9 pr-3 py-2 rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"/>
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              </div>
              <div className="flex items-center gap-2">
                 <Filter size={16} className="text-slate-500"/>
                 <select className="px-3 py-2 rounded-2xl border w-full bg-white dark:bg-slate-900" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">{columnLabel.allStatus}</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
              <DatePicker label="Start" value={dateFrom} onChange={setDateFrom} />
              <DatePicker label="End" value={dateTo} onChange={setDateTo} />
           </div>
           <div className="flex items-center justify-between mt-2">
              <div className="flex gap-2">
                 <button className="btn btn-outline !py-1 !px-3" onClick={() => { setQ(""); setStatusFilter(""); }}>Reset</button>
                 <button className="btn btn-outline !py-1 !px-3" onClick={bulkConfirm} disabled={selected.size===0}><CheckCircle2 size={16}/> Confirm</button>
                 <button className="btn btn-outline !py-1 !px-3" onClick={bulkCancel} disabled={selected.size===0}><XCircle size={16}/> Cancel</button>
              </div>
           </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-auto max-h-[70vh]">
          {loading ? <div className="p-10 text-center text-slate-500">Loading...</div> : (
            <table className="min-w-full table-fixed text-sm border-collapse [&_th]:text-xs [&_th]:uppercase [&_th]:font-semibold [&_th]:text-slate-700 dark:[&_th]:text-slate-200 [&_td]:align-top [&_th]:border-b [&_td]:border-b border-slate-200 dark:border-slate-800">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/90 backdrop-blur">
                <tr>
                  <th className="p-3 w-10"><button onClick={toggleSelectAllCurrent}>{pageRows.every(r => selected.has(r.id)) ? <CheckSquare size={16}/> : <Square size={16}/>}</button></th>
                  <th className="p-3 w-28" onClick={() => { setSortBy('created_at'); setSortDir(d=>d==='asc'?'desc':'asc'); }}>Date <ArrowUpDown size={12} className="inline"/></th>
                  <th className="p-3">Name / Contact</th>
                  <th className="p-3 w-24">Pax</th>
                  <th className="p-3 w-32">Total</th>
                  <th className="p-3 w-32">Status</th>
                  <th className="p-3 w-40 text-center">Invoice</th>
                  <th className="p-3 w-24 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3"><button onClick={() => toggleSelect(r.id)}>{selected.has(r.id) ? <CheckSquare size={16}/> : <Square size={16}/>}</button></td>
                    <td className="p-3">
                      <div className="font-medium">{new Date(r.created_at).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900 dark:text-white">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.email} • {r.phone}</div>
                      <div className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded inline-block mt-1 truncate max-w-[150px] text-sky-700 dark:text-sky-300">
                        {r.trip_name}
                      </div>
                    </td>
                    <td className="p-3">{r.pax}</td>
                    <td className="p-3 font-medium">{fmtIDR(r.total_idr)}</td>
                    <td className="p-3">
                       <div className="flex items-center gap-2">
                          <select 
                            className={`text-xs px-2 py-1 rounded-lg border-none outline-none cursor-pointer font-medium ${
                              r.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                              r.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 
                              'bg-amber-100 text-amber-700'
                            }`}
                            value={r.status}
                            onChange={(e) => setRowField(r.id, { status: e.target.value })}
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                       </div>
                    </td>
                    
                    <td className="p-3 text-center">
                       <InvoiceDropdown row={r} />
                       {r.invoice_no && <div className="text-[10px] text-slate-400 mt-1 font-mono">{r.invoice_no}</div>}
                    </td>

                    <td className="p-3 text-right">
                       <button 
                         className="btn btn-primary !py-1.5 !px-3" 
                         onClick={() => saveRow(r)} 
                         disabled={savingId === r.id}
                       >
                         {savingId === r.id ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                       </button>
                    </td>
                  </tr>
                ))}
                {processed.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-500">No data found.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
         <div>Show {pageSize} rows</div>
         <div className="flex gap-2">
            <button className="btn btn-outline !px-2" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Prev</button>
            <span>{page} / {totalPages}</span>
            <button className="btn btn-outline !px-2" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}>Next</button>
         </div>
      </div>
    </div>
  );
}