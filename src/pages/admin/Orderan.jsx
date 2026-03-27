import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useTranslation } from "react-i18next";
import {
  ArrowUpDown,
  BadgeCheck,
  Calendar as CalendarIcon,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  CircleAlert,
  Download,
  Eye,
  FileDown,
  Hash,
  Loader2,
  Mail,
  Package2,
  Phone,
  RotateCcw,
  Save,
  Search,
  Square,
  Users,
  X,
  XCircle,
} from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import { toast } from "react-hot-toast";

function formatYMD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseYMD(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

const UI_COPY = {
  id: {
    dateLocale: "id-ID",
    weekdays: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
    search: "Cari kode booking, nama, email, atau paket",
    allStatus: "Semua status",
    from: "Mulai",
    to: "Sampai",
    reset: "Reset",
    refresh: "Muat ulang",
    exportCsv: "Export CSV",
    confirmSelected: "Konfirmasi",
    cancelSelected: "Batalkan",
    totalOrders: "Total order",
    pendingOrders: "Menunggu",
    confirmedOrders: "Terkonfirmasi",
    selectedOrders: "Terpilih",
    confirmedRevenue: "Omzet confirmed",
    loading: "Memuat order...",
    noData: "Belum ada order yang cocok dengan filter ini.",
    showRows: "Baris",
    prev: "Sebelumnya",
    next: "Berikutnya",
    details: "Detail",
    close: "Tutup",
    date: "Tanggal",
    customer: "Pelanggan",
    pax: "Pax",
    total: "Total",
    status: "Status",
    invoice: "Invoice",
    actions: "Aksi",
    package: "Paket",
    audience: "Audiens",
    notes: "Catatan",
    lineItems: "Item booking",
    invoiceNumber: "Nomor invoice",
    bookingCode: "Kode booking",
    createdAt: "Dibuat",
    tourDate: "Tanggal tour",
    customerInfo: "Informasi pelanggan",
    unitPrice: "Harga satuan",
    qty: "Qty",
    save: "Simpan",
    saving: "Menyimpan...",
    saveSuccess: "Perubahan order tersimpan.",
    saveFailed: "Gagal menyimpan order.",
    download: "Download",
    chooseLanguage: "Pilih bahasa invoice",
    confirmFirst: "Konfirmasi dulu",
    downloadFailed: "Gagal membuat invoice.",
    bulkConfirmed: "Order terpilih berhasil dikonfirmasi.",
    bulkCancelled: "Order terpilih berhasil dibatalkan.",
    exportReady: "CSV berhasil dibuat.",
    exportEmpty: "Tidak ada data untuk diexport.",
    loadFailed: "Gagal memuat data order.",
    pageSummary: "Halaman {{page}} dari {{total}}",
    defaultPackage: "Paket wisata",
    audienceDomestic: "Domestik",
    audienceForeign: "Mancanegara",
    audienceUnknown: "Tidak diketahui",
    statusPending: "Pending",
    statusConfirmed: "Confirmed",
    statusCancelled: "Cancelled",
    languageIndonesia: "Indonesia",
    languageEnglish: "English",
    languageJapanese: "Japanese",
    noNotes: "Tidak ada catatan tambahan.",
    noPhone: "Nomor telepon belum diisi",
    noEmail: "Email belum diisi",
    clearDate: "Kosong",
  },
  en: {
    dateLocale: "en-US",
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    search: "Search booking code, customer, email, or package",
    allStatus: "All status",
    from: "From",
    to: "To",
    reset: "Reset",
    refresh: "Refresh",
    exportCsv: "Export CSV",
    confirmSelected: "Confirm",
    cancelSelected: "Cancel",
    totalOrders: "Total orders",
    pendingOrders: "Pending",
    confirmedOrders: "Confirmed",
    selectedOrders: "Selected",
    confirmedRevenue: "Confirmed revenue",
    loading: "Loading orders...",
    noData: "No orders match the current filters.",
    showRows: "Rows",
    prev: "Prev",
    next: "Next",
    details: "Details",
    close: "Close",
    date: "Date",
    customer: "Customer",
    pax: "Pax",
    total: "Total",
    status: "Status",
    invoice: "Invoice",
    actions: "Actions",
    package: "Package",
    audience: "Audience",
    notes: "Notes",
    lineItems: "Booking items",
    invoiceNumber: "Invoice number",
    bookingCode: "Booking code",
    createdAt: "Created at",
    tourDate: "Tour date",
    customerInfo: "Customer info",
    unitPrice: "Unit price",
    qty: "Qty",
    save: "Save",
    saving: "Saving...",
    saveSuccess: "Order changes saved.",
    saveFailed: "Failed to save the order.",
    download: "Download",
    chooseLanguage: "Invoice language",
    confirmFirst: "Confirm booking first",
    downloadFailed: "Failed to generate invoice.",
    bulkConfirmed: "Selected orders have been confirmed.",
    bulkCancelled: "Selected orders have been cancelled.",
    exportReady: "CSV export is ready.",
    exportEmpty: "There is no data to export.",
    loadFailed: "Failed to load orders.",
    pageSummary: "Page {{page}} of {{total}}",
    defaultPackage: "Tour package",
    audienceDomestic: "Domestic",
    audienceForeign: "Foreign",
    audienceUnknown: "Unknown",
    statusPending: "Pending",
    statusConfirmed: "Confirmed",
    statusCancelled: "Cancelled",
    languageIndonesia: "Indonesia",
    languageEnglish: "English",
    languageJapanese: "Japanese",
    noNotes: "No extra notes.",
    noPhone: "Phone number not provided",
    noEmail: "Email not provided",
    clearDate: "Clear",
  },
  ja: {
    dateLocale: "ja-JP",
    weekdays: ["日", "月", "火", "水", "木", "金", "土"],
    search: "予約コード、氏名、メール、またはパッケージ名で検索",
    allStatus: "すべてのステータス",
    from: "開始日",
    to: "終了日",
    reset: "リセット",
    refresh: "再読み込み",
    exportCsv: "CSV出力",
    confirmSelected: "確定",
    cancelSelected: "キャンセル",
    totalOrders: "注文数",
    pendingOrders: "保留中",
    confirmedOrders: "確定済み",
    selectedOrders: "選択中",
    confirmedRevenue: "確定売上",
    loading: "注文を読み込み中...",
    noData: "条件に一致する注文はありません。",
    showRows: "表示件数",
    prev: "前へ",
    next: "次へ",
    details: "詳細",
    close: "閉じる",
    date: "日時",
    customer: "顧客",
    pax: "人数",
    total: "合計",
    status: "ステータス",
    invoice: "請求書",
    actions: "操作",
    package: "パッケージ",
    audience: "対象",
    notes: "メモ",
    lineItems: "予約項目",
    invoiceNumber: "請求書番号",
    bookingCode: "予約コード",
    createdAt: "作成日時",
    tourDate: "ツアー日",
    customerInfo: "顧客情報",
    unitPrice: "単価",
    qty: "数量",
    save: "保存",
    saving: "保存中...",
    saveSuccess: "注文内容を保存しました。",
    saveFailed: "注文の保存に失敗しました。",
    download: "ダウンロード",
    chooseLanguage: "請求書の言語",
    confirmFirst: "先に確定してください",
    downloadFailed: "請求書の生成に失敗しました。",
    bulkConfirmed: "選択した注文を確定しました。",
    bulkCancelled: "選択した注文をキャンセルしました。",
    exportReady: "CSVを出力しました。",
    exportEmpty: "出力できるデータがありません。",
    loadFailed: "注文の読み込みに失敗しました。",
    pageSummary: "{{total}}ページ中 {{page}}ページ",
    defaultPackage: "ツアーパッケージ",
    audienceDomestic: "国内",
    audienceForeign: "海外",
    audienceUnknown: "不明",
    statusPending: "保留",
    statusConfirmed: "確定",
    statusCancelled: "キャンセル",
    languageIndonesia: "Indonesia",
    languageEnglish: "English",
    languageJapanese: "Japanese",
    noNotes: "追加メモはありません。",
    noPhone: "電話番号は未登録です",
    noEmail: "メールは未登録です",
    clearDate: "クリア",
  },
};

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled"];

const INVOICE_LANG = {
  id: {
    title: "INVOICE",
    billedTo: "DITAGIH KEPADA",
    details: "DETAIL PESANAN",
    invNo: "Nomor Invoice",
    issueDate: "Tanggal Terbit",
    tourDate: "Tanggal Tour",
    desc: "Deskripsi",
    qty: "Pax",
    price: "Harga Satuan",
    subtotal: "Subtotal",
    total: "TOTAL PEMBAYARAN",
    confirmed: "LUNAS",
    pending: "BELUM LUNAS",
    cancelled: "DIBATALKAN",
    footer1: "Terima kasih telah mempercayakan perjalanan Anda kepada Cidika Travel.",
    contact: "Butuh bantuan? Hubungi WhatsApp kami.",
  },
  en: {
    title: "INVOICE",
    billedTo: "BILLED TO",
    details: "ORDER DETAILS",
    invNo: "Invoice Number",
    issueDate: "Issue Date",
    tourDate: "Tour Date",
    desc: "Description",
    qty: "Pax",
    price: "Unit Price",
    subtotal: "Subtotal",
    total: "TOTAL AMOUNT",
    confirmed: "PAID",
    pending: "UNPAID",
    cancelled: "CANCELLED",
    footer1: "Thank you for choosing Cidika Travel for your journey.",
    contact: "Need help? Contact our WhatsApp.",
  },
  ja: {
    title: "請求書",
    billedTo: "請求先",
    details: "注文詳細",
    invNo: "請求書番号",
    issueDate: "発行日",
    tourDate: "ツアー日",
    desc: "内容",
    qty: "人数",
    price: "単価",
    subtotal: "小計",
    total: "合計金額",
    confirmed: "支払済",
    pending: "未払い",
    cancelled: "キャンセル",
    footer1: "Cidika Travel をご利用いただきありがとうございます。",
    contact: "サポートが必要な場合は WhatsApp までご連絡ください。",
  },
};

function getLocaleKey(language) {
  const short = language?.slice(0, 2);
  return UI_COPY[short] ? short : "en";
}

function chooseTripTitle(titles, language, fallback) {
  return (
    titles?.[language] ||
    titles?.en ||
    titles?.id ||
    Object.values(titles || {}).find(Boolean) ||
    fallback
  );
}

function normalizeItems(items, row, language, fallback) {
  if (Array.isArray(items) && items.length > 0) {
    return items.map((item) => ({
      id: item.id,
      item_name: item.item_name || chooseTripTitle(row.trip_titles, language, fallback),
      qty: Number(item.qty || 1),
      price_idr: Number(item.price_idr || 0),
      total_idr: Number(item.total_idr || 0),
    }));
  }

  const pax = Math.max(1, Number(row.pax || 1));
  const total = Number(row.total_idr || 0);
  return [
    {
      id: `fallback-${row.id}`,
      item_name: chooseTripTitle(row.trip_titles, language, fallback),
      qty: pax,
      price_idr: Math.round(total / pax),
      total_idr: total,
    },
  ];
}

function formatDateLabel(value, locale) {
  const parsed = parseYMD(value);
  if (!parsed) return "";
  return parsed.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Calendar({ locale, weekdays, value, onSelect }) {
  const selected = parseYMD(value);
  const [month, setMonth] = useState(() => (selected ? new Date(selected) : new Date()));
  month.setDate(1);

  const firstDay = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < firstDay; index += 1) {
    const date = new Date(month.getFullYear(), month.getMonth(), 0 - (firstDay - 1 - index));
    cells.push({ date, outside: true });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(month.getFullYear(), month.getMonth(), day), outside: false });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), outside: true });
  }

  return (
    <div className="w-[280px] select-none">
      <div className="flex items-center justify-between p-2">
        <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="btn btn-outline !py-1 !px-2">
          {"<"}
        </button>
        <div className="text-sm font-semibold">
          {month.toLocaleString(locale, { month: "long", year: "numeric" })}
        </div>
        <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="btn btn-outline !py-1 !px-2">
          {">"}
        </button>
      </div>
      <div className="grid grid-cols-7 px-2 text-center text-xs text-slate-500 dark:text-slate-400">
        {weekdays.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 p-2">
        {cells.map(({ date, outside }, index) => {
          const isSelected = selected && !outside && date.toDateString() === selected.toDateString();
          return (
            <button
              key={`${date.toISOString()}-${index}`}
              type="button"
              onClick={() => !outside && onSelect(formatYMD(date))}
              disabled={outside}
              className={[
                "rounded-xl border py-1.5 text-sm",
                outside ? "border-transparent text-slate-400/60" : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                isSelected ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200" : "",
              ].join(" ")}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DatePicker({ copy, label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" className="flex w-full items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" onClick={() => setOpen((current) => !current)}>
        <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <CalendarIcon size={16} />
          {label}
        </span>
        <span className="text-xs text-slate-500">{value ? formatDateLabel(value, copy.dateLocale) : copy.clearDate}</span>
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 flex justify-end">
            <button type="button" className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200" onClick={() => { onChange(""); setOpen(false); }}>
              {copy.clearDate}
            </button>
          </div>
          <Calendar locale={copy.dateLocale} weekdays={copy.weekdays} value={value} onSelect={(nextValue) => { onChange(nextValue); setOpen(false); }} />
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "slate" }) {
  const toneClass = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        </div>
        <div className={`rounded-2xl p-3 ${toneClass[tone] || toneClass.slate}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function statusTone(status) {
  if (status === "confirmed") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200";
  if (status === "cancelled") return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200";
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200";
}

function escapeCsvValue(value) {
  return `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
}

export default function Orderan() {
  const { i18n } = useTranslation();
  const language = getLocaleKey(i18n.language);
  const copy = UI_COPY[language];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [bulkAction, setBulkAction] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(() => new Set());
  const [detailId, setDetailId] = useState(null);

  const formatCurrency = useCallback((value) => Number(value || 0).toLocaleString("id-ID"), []);
  const formatDateTime = useCallback(
    (value, withTime = false) => {
      if (!value) return "-";
      const date = new Date(value);
      return date.toLocaleString(copy.dateLocale, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
    },
    [copy.dateLocale]
  );

  const getAudienceLabel = useCallback(
    (audience) => {
      if (audience === "domestic") return copy.audienceDomestic;
      if (audience === "foreign") return copy.audienceForeign;
      return copy.audienceUnknown;
    },
    [copy]
  );

  const getStatusLabel = useCallback(
    (status) => {
      if (status === "confirmed") return copy.statusConfirmed;
      if (status === "cancelled") return copy.statusCancelled;
      return copy.statusPending;
    },
    [copy]
  );

  const insideDateRange = useCallback(
    (value) => {
      if (!value) return true;
      const timestamp = new Date(value).setHours(0, 0, 0, 0);
      const fromOk = dateFrom ? timestamp >= new Date(dateFrom).setHours(0, 0, 0, 0) : true;
      const toOk = dateTo ? timestamp <= new Date(dateTo).setHours(0, 0, 0, 0) : true;
      return fromOk && toOk;
    },
    [dateFrom, dateTo]
  );

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        id, public_code, created_at, status, package_id, customer_name, email, phone, pax, audience,
        total_idr, date, notes, invoice_no, invoice_pdf_url,
        booking_items ( id, item_name, qty, price_idr, total_idr ),
        packages ( package_locales ( title, lang ) )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error(copy.loadFailed);
      setRows([]);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((row) => {
      const pkg = Array.isArray(row.packages) ? row.packages[0] : row.packages;
      const locales = Array.isArray(pkg?.package_locales) ? pkg.package_locales : [];
      const tripTitles = locales.reduce((acc, localeRow) => {
        if (localeRow?.lang && localeRow?.title) acc[localeRow.lang] = localeRow.title;
        return acc;
      }, {});
      const baseRow = {
        ...row,
        name: row.customer_name,
        trip_titles: tripTitles,
        trip_name: chooseTripTitle(tripTitles, language, copy.defaultPackage),
      };
      return {
        ...baseRow,
        items: normalizeItems(row.booking_items, baseRow, language, copy.defaultPackage),
      };
    });

    setRows(mapped);
    setSelected(new Set());
    setLoading(false);
  }, [copy.defaultPackage, copy.loadFailed, language]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, dateFrom, dateTo, pageSize]);

  const processed = useMemo(() => {
    const text = query.trim().toLowerCase();
    const filtered = (rows || []).filter((row) => {
      const inStatus = statusFilter ? row.status === statusFilter : true;
      const inText =
        !text ||
        [row.public_code, row.name, row.email, row.phone, row.invoice_no, row.trip_name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(text));
      return inStatus && inText && insideDateRange(row.date);
    });

    filtered.sort((left, right) => {
      const direction = sortDir === "asc" ? 1 : -1;
      const read = (row) => {
        if (sortBy === "created_at") return new Date(row.created_at).getTime();
        if (sortBy === "date") return new Date(row.date || row.created_at).getTime();
        if (sortBy === "total_idr") return Number(row.total_idr || 0);
        if (sortBy === "name") return row.name || "";
        return row[sortBy] ?? "";
      };
      const a = read(left);
      const b = read(right);
      const comparison = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), copy.dateLocale);
      return comparison * direction;
    });

    return filtered;
  }, [copy.dateLocale, insideDateRange, query, rows, sortBy, sortDir, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = processed.slice((page - 1) * pageSize, page * pageSize);
  const detailRow = rows.find((row) => row.id === detailId) || null;
  const currentPageAllSelected = pageRows.length > 0 && pageRows.every((row) => selected.has(row.id));

  const stats = useMemo(() => {
    const confirmedRows = processed.filter((row) => row.status === "confirmed");
    return {
      total: processed.length,
      pending: processed.filter((row) => row.status === "pending").length,
      confirmed: confirmedRows.length,
      selected: selected.size,
      revenue: confirmedRows.reduce((sum, row) => sum + Number(row.total_idr || 0), 0),
    };
  }, [processed, selected.size]);

  const setRowField = (id, patch) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const toggleSelect = (id) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllCurrent = () => {
    const ids = pageRows.map((row) => row.id);
    setSelected((current) => {
      const next = new Set(current);
      const allSelected = ids.every((id) => next.has(id));
      ids.forEach((id) => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const makeInvoiceNo = (row) => {
    if (row?.invoice_no) return row.invoice_no;
    const date = new Date(row.created_at);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    const tail = String(row.id).replace(/-/g, "").slice(0, 6).toUpperCase();
    return `INV/${year}${month}${day}/${tail}`;
  };

  const getInvoiceItems = useCallback(
    (row, invoiceLanguage) => normalizeItems(row.items, row, invoiceLanguage, copy.defaultPackage),
    [copy.defaultPackage]
  );

  const buildInvoicePdfBlob = async (row, invoiceLanguage) => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const text = INVOICE_LANG[invoiceLanguage] || INVOICE_LANG.en;
    const items = getInvoiceItems(row, invoiceLanguage);
    const dateLocale = invoiceLanguage === "id" ? "id-ID" : invoiceLanguage === "ja" ? "ja-JP" : "en-US";
    let activeFont = "helvetica";

    if (invoiceLanguage === "ja") {
      try {
        const response = await fetch("/NotoSansJP-Regular.ttf");
        if (response.ok) {
          const blob = await response.blob();
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          pdf.addFileToVFS("NotoSansJP.ttf", String(base64).split(",")[1]);
          pdf.addFont("NotoSansJP.ttf", "NotoSansJP", "normal");
          activeFont = "NotoSansJP";
          pdf.setFont(activeFont);
        }
      } catch (error) {
        console.error("Failed to load Japanese font", error);
      }
    }

    const invoiceNo = makeInvoiceNo(row);
    const statusText = row.status === "confirmed" ? text.confirmed : row.status === "cancelled" ? text.cancelled : text.pending;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const brandColor = "#0ea5e9";

    pdf.setFillColor(brandColor);
    pdf.rect(0, 0, pageWidth, 10, "F");
    pdf.setTextColor(30, 41, 59);
    pdf.setFont(activeFont, "normal");
    pdf.setFontSize(28);
    pdf.text(text.title, pageWidth - margin, 50, { align: "right" });
    pdf.setFontSize(12);
    pdf.setTextColor(row.status === "confirmed" ? "#10b981" : row.status === "cancelled" ? "#ef4444" : "#f59e0b");
    pdf.text(statusText, pageWidth - margin, 70, { align: "right" });

    let y = 135;
    const rightColumnX = pageWidth / 2 + 20;
    pdf.setFontSize(9);
    pdf.setTextColor(148, 163, 184);
    pdf.text(text.billedTo, margin, 125);
    pdf.setFontSize(11);
    pdf.setTextColor(30, 41, 59);
    pdf.text(row.name || "-", margin, 142);
    pdf.setFontSize(10);
    pdf.setTextColor(71, 85, 105);
    pdf.text(row.email || "-", margin, 158);
    if (row.phone) pdf.text(row.phone, margin, 174);

    pdf.setFontSize(9);
    pdf.setTextColor(148, 163, 184);
    pdf.text(text.invNo, rightColumnX, y);
    pdf.setFontSize(10);
    pdf.setTextColor(30, 41, 59);
    pdf.text(invoiceNo, pageWidth - margin, y, { align: "right" });
    y += 20;
    pdf.setFontSize(9);
    pdf.setTextColor(148, 163, 184);
    pdf.text(text.issueDate, rightColumnX, y);
    pdf.setFontSize(10);
    pdf.setTextColor(30, 41, 59);
    pdf.text(new Date(row.created_at).toLocaleDateString(dateLocale), pageWidth - margin, y, { align: "right" });
    y += 20;
    pdf.setFontSize(9);
    pdf.setTextColor(148, 163, 184);
    pdf.text(text.tourDate, rightColumnX, y);
    pdf.setFontSize(10);
    pdf.setTextColor(30, 41, 59);
    pdf.text(new Date(row.date || row.created_at).toLocaleDateString(dateLocale), pageWidth - margin, y, { align: "right" });

    autoTable(pdf, {
      startY: 220,
      head: [[text.desc, text.qty, `${text.price} (IDR)`, `${text.subtotal} (IDR)`]],
      body: items.map((item) => [
        item.item_name,
        String(item.qty || 1),
        Number(item.price_idr || 0).toLocaleString(dateLocale),
        Number(item.total_idr || 0).toLocaleString(dateLocale),
      ]),
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 10, textColor: 50, font: activeFont },
      headStyles: { fillColor: [248, 250, 252], textColor: 100, fontStyle: "normal", lineColor: 230, lineWidth: { bottom: 1 }, font: activeFont },
      bodyStyles: { lineColor: 240, lineWidth: { bottom: 1 } },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } },
      margin: { left: margin, right: margin },
    });

    const finalY = pdf.lastAutoTable.finalY + 20;
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(pageWidth - margin - 320, finalY, 320, 40, 4, 4, "F");
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(10);
    pdf.text(text.total, pageWidth - margin - 300, finalY + 25);
    pdf.setFontSize(14);
    pdf.setTextColor(brandColor);
    pdf.text(`IDR ${Number(row.total_idr || 0).toLocaleString(dateLocale)}`, pageWidth - margin - 20, finalY + 25, { align: "right" });

    const footerY = pageHeight - 60;
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, footerY, pageWidth - margin, footerY);
    pdf.setFontSize(9);
    pdf.setTextColor(148, 163, 184);
    pdf.text(text.footer1, pageWidth / 2, footerY + 20, { align: "center" });
    pdf.text(text.contact, pageWidth / 2, footerY + 34, { align: "center" });
    return pdf.output("blob");
  };

  const uploadInvoiceBlob = async (blob, row, invoiceNo) => {
    const path = `invoices/${invoiceNo.replace(/[^\w/-]/g, "_")}-${row.id}.pdf`;
    const { error } = await supabase.storage.from("assets").upload(path, blob, { cacheControl: "3600", upsert: true, contentType: "application/pdf" });
    if (error) throw error;
    const { data } = supabase.storage.from("assets").getPublicUrl(path);
    return data?.publicUrl;
  };

  const ensureInvoiceExists = async (row) => {
    const invoiceNo = makeInvoiceNo(row);
    const blob = await buildInvoicePdfBlob(row, "id");
    const url = await uploadInvoiceBlob(blob, row, invoiceNo);
    const { error } = await supabase.from("bookings").update({ invoice_no: invoiceNo, invoice_pdf_url: url }).eq("id", row.id);
    if (error) throw error;
    return { invoiceNo, url };
  };

  const saveRow = async (row) => {
    setSavingId(row.id);
    try {
      const { error } = await supabase.from("bookings").update({ status: row.status }).eq("id", row.id);
      if (error) throw error;
      if (row.status === "confirmed" && !row.invoice_pdf_url) await ensureInvoiceExists(row);
      toast.success(copy.saveSuccess);
      await load();
    } catch (error) {
      console.error(error);
      toast.error(copy.saveFailed);
    } finally {
      setSavingId(null);
    }
  };

  const handleDownload = async (row, invoiceLanguage) => {
    setDownloadingId(row.id);
    try {
      if (!row.invoice_no && row.status === "confirmed") await ensureInvoiceExists(row);
      const blob = await buildInvoicePdfBlob(row, invoiceLanguage);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Invoice-${makeInvoiceNo(row)}-${invoiceLanguage.toUpperCase()}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error(copy.downloadFailed);
    } finally {
      setDownloadingId(null);
    }
  };

  const bulkConfirm = async () => {
    if (selected.size === 0) return;
    setBulkAction("confirmed");
    try {
      const ids = Array.from(selected);
      const { error } = await supabase.from("bookings").update({ status: "confirmed" }).in("id", ids);
      if (error) throw error;
      for (const row of rows.filter((item) => ids.includes(item.id) && !item.invoice_pdf_url)) {
        await ensureInvoiceExists({ ...row, status: "confirmed" });
      }
      toast.success(copy.bulkConfirmed);
      await load();
    } catch (error) {
      console.error(error);
      toast.error(copy.saveFailed);
    } finally {
      setBulkAction("");
    }
  };

  const bulkCancel = async () => {
    if (selected.size === 0) return;
    setBulkAction("cancelled");
    try {
      const ids = Array.from(selected);
      const { error } = await supabase.from("bookings").update({ status: "cancelled" }).in("id", ids);
      if (error) throw error;
      toast.success(copy.bulkCancelled);
      await load();
    } catch (error) {
      console.error(error);
      toast.error(copy.saveFailed);
    } finally {
      setBulkAction("");
    }
  };

  const exportCsv = () => {
    const source = processed.filter((row) => selected.size === 0 || selected.has(row.id));
    if (source.length === 0) {
      toast.error(copy.exportEmpty);
      return;
    }
    const header = [copy.bookingCode, copy.date, copy.customer, copy.package, copy.audience, copy.pax, copy.total, copy.status, copy.invoiceNumber];
    const lines = source.map((row) => [row.public_code || "", row.date || row.created_at || "", row.name || "", row.trip_name || "", getAudienceLabel(row.audience), row.pax || "", row.total_idr || 0, getStatusLabel(row.status), makeInvoiceNo(row)]);
    const csv = [header, ...lines].map((line) => line.map(escapeCsvValue).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "orders.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success(copy.exportReady);
  };

  const InvoiceDropdown = ({ row }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const handleClick = (event) => {
        if (ref.current && !ref.current.contains(event.target)) setOpen(false);
      };
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    if (row.status !== "confirmed") {
      return <span className="text-xs italic text-slate-400">{copy.confirmFirst}</span>;
    }

    return (
      <div className="relative" ref={ref}>
        <button type="button" onClick={() => setOpen((current) => !current)} className="btn btn-outline inline-flex items-center gap-2 !px-3 !py-1.5 text-sm" disabled={downloadingId === row.id}>
          {downloadingId === row.id ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          <span>{copy.download}</span>
          <ChevronDown size={14} />
        </button>
        {open ? (
          <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:bg-slate-800">{copy.chooseLanguage}</div>
            <button type="button" onClick={() => { handleDownload(row, "id"); setOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
              <ReactCountryFlag countryCode="ID" svg />
              {copy.languageIndonesia}
            </button>
            <button type="button" onClick={() => { handleDownload(row, "en"); setOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
              <ReactCountryFlag countryCode="US" svg />
              {copy.languageEnglish}
            </button>
            <button type="button" onClick={() => { handleDownload(row, "ja"); setOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
              <ReactCountryFlag countryCode="JP" svg />
              {copy.languageJapanese}
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="container mt-3 space-y-4">
      <div>
        <div className="glass rounded-2xl border border-slate-200/60 px-3 py-3 shadow-smooth backdrop-blur-md dark:border-slate-800/60 sm:px-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">{copy.totalOrders}</h1>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-200">{rows.length}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn btn-outline !px-3 !py-1.5" onClick={load}>
                  <RotateCcw size={16} />
                  <span>{copy.refresh}</span>
                </button>
                <button type="button" className="btn btn-outline !px-3 !py-1.5" onClick={exportCsv}>
                  <Download size={16} />
                  <span>{copy.exportCsv}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 lg:grid-cols-5">
              <div className="relative lg:col-span-2">
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-10 pr-3 dark:border-slate-700 dark:bg-slate-900" />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full bg-transparent py-2 outline-none">
                  <option value="">{copy.allStatus}</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
              <DatePicker copy={copy} label={copy.from} value={dateFrom} onChange={setDateFrom} />
              <DatePicker copy={copy} label={copy.to} value={dateTo} onChange={setDateTo} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn btn-outline !px-3 !py-1.5" onClick={() => { setQuery(""); setStatusFilter(""); setDateFrom(""); setDateTo(""); }}>
                  {copy.reset}
                </button>
                <button type="button" className="btn btn-outline !px-3 !py-1.5" onClick={bulkConfirm} disabled={selected.size === 0 || bulkAction === "confirmed"}>
                  {bulkAction === "confirmed" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  <span>{copy.confirmSelected}</span>
                </button>
                <button type="button" className="btn btn-outline !px-3 !py-1.5" onClick={bulkCancel} disabled={selected.size === 0 || bulkAction === "cancelled"}>
                  {bulkAction === "cancelled" ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  <span>{copy.cancelSelected}</span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span>{copy.showRows}</span>
                <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
                  {[10, 20, 50].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Package2} label={copy.totalOrders} value={stats.total} tone="slate" />
        <StatCard icon={CircleAlert} label={copy.pendingOrders} value={stats.pending} tone="amber" />
        <StatCard icon={BadgeCheck} label={copy.confirmedOrders} value={stats.confirmed} tone="emerald" />
        <StatCard icon={Users} label={copy.selectedOrders} value={stats.selected} tone="sky" />
        <StatCard icon={CalendarDays} label={copy.confirmedRevenue} value={`IDR ${formatCurrency(stats.revenue)}`} tone="rose" />
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="card p-10 text-center text-slate-500">{copy.loading}</div>
        ) : pageRows.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">{copy.noData}</div>
        ) : (
          pageRows.map((row) => (
            <div key={row.id} className="card space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <button type="button" className="rounded-lg border border-slate-200 p-2 dark:border-slate-700" onClick={() => toggleSelect(row.id)}>
                  {selected.has(row.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500">{row.public_code || row.id.slice(0, 8)}</div>
                  <div className="font-semibold text-slate-900 dark:text-white">{row.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{row.trip_name}</div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusTone(row.status)}`}>{getStatusLabel(row.status)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
                  <div className="text-xs text-slate-500">{copy.date}</div>
                  <div className="mt-1 font-medium">{formatDateTime(row.date || row.created_at)}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
                  <div className="text-xs text-slate-500">{copy.total}</div>
                  <div className="mt-1 font-medium">IDR {formatCurrency(row.total_idr)}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
                  <div className="text-xs text-slate-500">{copy.pax}</div>
                  <div className="mt-1 font-medium">{row.pax}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
                  <div className="text-xs text-slate-500">{copy.audience}</div>
                  <div className="mt-1 font-medium">{getAudienceLabel(row.audience)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select value={row.status} onChange={(event) => setRowField(row.id, { status: event.target.value })} className={`w-full rounded-xl px-3 py-2 text-sm font-medium ${statusTone(row.status)}`}>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-primary !px-3 !py-2" onClick={() => saveRow(row)} disabled={savingId === row.id}>
                  {savingId === row.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button type="button" className="btn btn-outline !px-3 !py-1.5" onClick={() => setDetailId(row.id)}>
                  <Eye size={16} />
                  <span>{copy.details}</span>
                </button>
                <InvoiceDropdown row={row} />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card hidden md:block">
        <div className="max-h-[70vh] overflow-auto">
          {loading ? (
            <div className="p-10 text-center text-slate-500">{copy.loading}</div>
          ) : (
            <table className="min-w-full table-fixed border-collapse text-sm [&_td]:align-top [&_td]:border-b [&_th]:border-b [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase border-slate-200 dark:border-slate-800">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-800/95">
                <tr>
                  <th className="w-12 p-3 text-left">
                    <button type="button" onClick={toggleSelectAllCurrent}>
                      {currentPageAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </th>
                  <th className="w-36 cursor-pointer p-3 text-left text-slate-700 dark:text-slate-200" onClick={() => { setSortBy("created_at"); setSortDir((current) => (current === "asc" ? "desc" : "asc")); }}>
                    {copy.date} <ArrowUpDown size={12} className="inline" />
                  </th>
                  <th className="p-3 text-left text-slate-700 dark:text-slate-200">{copy.customer}</th>
                  <th className="w-20 p-3 text-left text-slate-700 dark:text-slate-200">{copy.pax}</th>
                  <th className="w-36 cursor-pointer p-3 text-left text-slate-700 dark:text-slate-200" onClick={() => { setSortBy("total_idr"); setSortDir((current) => (current === "asc" ? "desc" : "asc")); }}>
                    {copy.total} <ArrowUpDown size={12} className="inline" />
                  </th>
                  <th className="w-36 p-3 text-left text-slate-700 dark:text-slate-200">{copy.status}</th>
                  <th className="w-44 p-3 text-center text-slate-700 dark:text-slate-200">{copy.invoice}</th>
                  <th className="w-40 p-3 text-right text-slate-700 dark:text-slate-200">{copy.actions}</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id} className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => setDetailId(row.id)}>
                    <td className="p-3" onClick={(event) => event.stopPropagation()}>
                      <button type="button" onClick={() => toggleSelect(row.id)}>
                        {selected.has(row.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{formatDateTime(row.date || row.created_at)}</div>
                      <div className="text-xs text-slate-500">{formatDateTime(row.created_at, true)}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900 dark:text-white">{row.name}</div>
                      <div className="text-xs text-slate-500">
                        {row.email || copy.noEmail}
                        {row.phone ? ` - ${row.phone}` : ""}
                      </div>
                      <div className="mt-2 inline-flex max-w-[220px] rounded-full bg-slate-100 px-2 py-1 text-[11px] text-sky-700 dark:bg-slate-800 dark:text-sky-300">
                        {row.trip_name}
                      </div>
                    </td>
                    <td className="p-3">{row.pax}</td>
                    <td className="p-3 font-medium">IDR {formatCurrency(row.total_idr)}</td>
                    <td className="p-3" onClick={(event) => event.stopPropagation()}>
                      <select className={`w-full rounded-xl px-3 py-2 text-xs font-medium ${statusTone(row.status)}`} value={row.status} onChange={(event) => setRowField(row.id, { status: event.target.value })}>
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {getStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-center" onClick={(event) => event.stopPropagation()}>
                      <InvoiceDropdown row={row} />
                      <div className="mt-1 text-[10px] font-mono text-slate-400">{row.invoice_no || makeInvoiceNo(row)}</div>
                    </td>
                    <td className="p-3" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" className="btn btn-outline !px-3 !py-1.5" onClick={() => setDetailId(row.id)}>
                          <Eye size={16} />
                        </button>
                        <button type="button" className="btn btn-primary !px-3 !py-1.5" onClick={() => saveRow(row)} disabled={savingId === row.id}>
                          {savingId === row.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-500">
                      {copy.noData}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="text-slate-500 dark:text-slate-400">
          {copy.pageSummary.replace("{{page}}", String(page)).replace("{{total}}", String(totalPages))}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline !px-3 !py-1.5" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
            {copy.prev}
          </button>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs dark:bg-slate-800">
            {page} / {totalPages}
          </span>
          <button type="button" className="btn btn-outline !px-3 !py-1.5" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>
            {copy.next}
          </button>
        </div>
      </div>

      {detailRow ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm" onClick={() => setDetailId(null)}>
          <aside className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{copy.details}</div>
                <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{detailRow.name}</h2>
                <div className="mt-1 text-sm text-slate-500">{detailRow.trip_name}</div>
              </div>
              <button type="button" className="rounded-xl border border-slate-200 p-2 dark:border-slate-700" onClick={() => setDetailId(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Hash size={14} />
                  {copy.bookingCode}
                </div>
                <div className="mt-2 font-semibold">{detailRow.public_code || detailRow.id}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <FileDown size={14} />
                  {copy.invoiceNumber}
                </div>
                <div className="mt-2 font-semibold">{makeInvoiceNo(detailRow)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CalendarDays size={14} />
                  {copy.createdAt}
                </div>
                <div className="mt-2 font-semibold">{formatDateTime(detailRow.created_at, true)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CalendarDays size={14} />
                  {copy.tourDate}
                </div>
                <div className="mt-2 font-semibold">{formatDateTime(detailRow.date || detailRow.created_at)}</div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">{copy.customerInfo}</div>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 text-slate-400" />
                  <div>{detailRow.email || copy.noEmail}</div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={16} className="mt-0.5 text-slate-400" />
                  <div>{detailRow.phone || copy.noPhone}</div>
                </div>
                <div className="flex items-start gap-3">
                  <Users size={16} className="mt-0.5 text-slate-400" />
                  <div>
                    {copy.pax}: {detailRow.pax} · {copy.audience}: {getAudienceLabel(detailRow.audience)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">{copy.lineItems}</div>
              <div className="mt-3 space-y-3">
                {detailRow.items.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
                    <div className="font-medium text-slate-900 dark:text-white">{item.item_name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {copy.qty}: {item.qty} · {copy.unitPrice}: IDR {formatCurrency(item.price_idr)}
                    </div>
                    <div className="mt-2 font-semibold">IDR {formatCurrency(item.total_idr)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{copy.status}</div>
                  <div className="mt-1 text-xs text-slate-500">{copy.notes}</div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone(detailRow.status)}`}>{getStatusLabel(detailRow.status)}</span>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-900">{detailRow.notes || copy.noNotes}</div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{copy.total}</div>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">IDR {formatCurrency(detailRow.total_idr)}</div>
              </div>
              <InvoiceDropdown row={detailRow} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button type="button" className="btn btn-outline !px-3 !py-2" onClick={() => setDetailId(null)}>
                {copy.close}
              </button>
              <button type="button" className="btn btn-primary !px-3 !py-2" onClick={() => saveRow(detailRow)} disabled={savingId === detailRow.id}>
                {savingId === detailRow.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{savingId === detailRow.id ? copy.saving : copy.save}</span>
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
