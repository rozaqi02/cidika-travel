// src/hooks/usePackages.js
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient.js";

export default function usePackages({ live = true } = {}) {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];

  const [rows, setRows]     = useState([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState(null);

  const fetchData = async () => {
    setLoad(true);
    setError(null);

    const { data, error } = await supabase
      .from("packages")
      .select(`
        id, slug, is_active, default_image,
        price_tiers ( pax, price_idr, audience ),
        package_locales ( lang, title, summary, spots, itinerary, include, note )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      setError(error);
      setRows([]);
      setLoad(false);
      return;
    }

    const mapped = (data || []).map((p) => {
      const loc =
        p.package_locales?.find((l) => l.lang === lang) ||
        p.package_locales?.find((l) => l.lang === "en") ||
        p.package_locales?.[0] ||
        null;

      // default audience: domestic
      const tiers = (p.price_tiers || []).filter((t) => (t.audience || "domestic") === "domestic");

      return {
        id: p.id,
        slug: p.slug,
        default_image: p.default_image,
        locale: loc,
        price_tiers: tiers,
      };
    });

    setRows(mapped);
    setLoad(false);
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [lang]);

  useEffect(() => {
    if (!live) return;
    const ch = supabase
      .channel("packages-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "packages" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "price_tiers" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "package_locales" }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [live]);

  return { rows, loading, error, refetch: fetchData };
}
