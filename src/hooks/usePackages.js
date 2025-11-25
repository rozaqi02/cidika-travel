// src/hooks/usePackages.js
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient.js";

export default function usePackages({ live = true } = {}) {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];

  const [rows, setRows] = useState([]);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoad(true);
    setError(null);

const { data, error } = await supabase
  .from("packages")
  .select(`
    id, slug, is_active, default_image, created_at, destination_key, trip_type, 
    price_tiers ( pax, price_idr, audience ),
    locales:package_locales ( lang, title, summary, spots, itinerary, include, note )
    `)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      setError(error);
      setRows([]);
      setLoad(false);
      return;
    }

    const pickLocale = (L, code) => {
      const pick = (c) => L.find((l) => (l.lang || "").slice(0, 2) === c);
      const c = (code || "id").slice(0, 2);
      return pick(c) || pick("id") || pick("en") || L[0] || {};
    };

    const mapped = (data || []).map((p) => {
      const L = Array.isArray(p.locales) ? p.locales : [];
      const loc = pickLocale(L, lang);

      // Normalisasi tipe data tiers
      const tiers = Array.isArray(p.price_tiers)
        ? p.price_tiers.map((t) => ({
            pax: Number(t.pax),
            price_idr: Number(t.price_idr),
            audience: String(t.audience || "domestic"),
          }))
        : [];

      return {
        id: p.id,
        slug: p.slug,
        destination_key: p.destination_key, // REVISI: Pastikan ini dikembalikan ke component
        trip_type: p.trip_type,
        default_image: p.default_image,
        locales: L, // Raw locales jika butuh debug
        locale: loc, // Locale yang sudah dipilih sesuai bahasa
        price_tiers: tiers,
      };
    });

    setRows(mapped);
    setLoad(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    if (!live) return;
    const ch = supabase
      .channel("packages-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "packages" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "price_tiers" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "package_locales" }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [live]); // eslint-disable-line react-hooks/exhaustive-deps

  return { rows, loading, error, refetch: fetchData };
}