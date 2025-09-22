// src/pages/admin/Orderan.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useTranslation } from "react-i18next";

const STATUS_OPTIONS = ["pending", "success", "cancelled"];

export default function Orderan() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState([]);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, created_at, status, invoice,
        booking_id, package_id, name, email, phone, pax,
        bookings:booking_id ( total_idr, customer_name, date )
      `)
      .order("created_at", { ascending: false });

    if (!error) setRows(data || []);
    else console.error(error);
  };

  useEffect(() => { load(); }, [i18n.language]);

  const saveRow = async (r) => {
    setSavingId(r.id);
    try {
      const { error } = await supabase.from("orders").update({ status: r.status, invoice: r.invoice }).eq("id", r.id);
      if (error) throw error;
      await load();
      alert(t("admin.orders.saved", { defaultValue: "Tersimpan" }));
    } catch (e) {
      console.error(e);
      alert(t("admin.orders.updateFailed", { defaultValue: "Gagal menyimpan" }));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="container mt-6">
      <h1 className="text-2xl font-bold mb-3">{t("admin.orders.title")}</h1>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-3">{t("admin.orders.table.date")}</th>
              <th>{t("admin.orders.table.package")}</th>
              <th>{t("admin.orders.table.name")}</th>
              <th>{t("admin.orders.table.contact")}</th>
              <th>{t("admin.orders.table.pax")}</th>
              <th>{t("admin.orders.table.totalIDR")}</th>
              <th>{t("admin.orders.table.status")}</th>
              <th>{t("admin.orders.table.invoice")}</th>
              <th>{t("admin.orders.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const total = r.bookings?.total_idr || 0;
              const date = r.bookings?.date ? new Date(r.bookings.date).toLocaleDateString() : "-";
              return (
                <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-3">
                    <div className="text-[13px]">{new Date(r.created_at).toLocaleString()}</div>
                    <div className="text-[12px] text-slate-500">{date}</div>
                  </td>
                  <td className="max-w-[220px] break-all">{r.package_id}</td>
                  <td>
                    <div className="font-medium">{r.name || r.bookings?.customer_name}</div>
                  </td>
                  <td>
                    <div>{r.phone || "-"}</div>
                    <div className="text-[12px] text-slate-500">{r.email || "-"}</div>
                  </td>
                  <td>{r.pax}</td>
                  <td>{total.toLocaleString("id-ID")}</td>

                  <td>
                    <select
                      className="border rounded-xl px-2 py-1 dark:bg-slate-900"
                      value={r.status}
                      onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: e.target.value } : x)))}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="min-w-[220px]">
                    <input
                      className="w-full border rounded-xl px-2 py-1 dark:bg-slate-900"
                      placeholder={t("admin.orders.invoicePlaceholder", { defaultValue: "No. / link invoice" })}
                      value={r.invoice || ""}
                      onChange={(e) => setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, invoice: e.target.value } : x)))}
                    />
                  </td>

                  <td>
                    <button
                      className="btn btn-outline !py-1 !px-3"
                      onClick={() => saveRow(r)}
                      disabled={savingId === r.id}
                    >
                      {savingId === r.id ? t("admin.orders.saving", { defaultValue: "Menyimpan..." }) : t("admin.orders.save", { defaultValue: "Simpan" })}
                    </button>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-slate-500" colSpan={9}>
                  {t("admin.common.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
