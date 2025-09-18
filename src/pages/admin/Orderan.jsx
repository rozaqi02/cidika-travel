import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useTranslation } from "react-i18next";

export default function Orderan() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);

  const load = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("id, created_at, package_id, customer_name, email, phone, pax, status, total_idr")
      .order("created_at", { ascending: false });
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);

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
              <th>{t("admin.orders.table.status")}</th>
              <th>{t("admin.orders.table.totalIDR")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                <td>{r.package_id}</td>
                <td>{r.customer_name}</td>
                <td>{r.phone || r.email}</td>
                <td>{r.pax}</td>
                <td>{r.status}</td>
                <td>{r.total_idr.toLocaleString("id-ID")}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-slate-500" colSpan={7}>{t("admin.common.empty")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
