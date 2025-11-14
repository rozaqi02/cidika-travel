// src/hooks/usePageSections.js
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient.js";

/**
 * Ambil konten kustom per-halaman dari:
 * - page_sections
 * - page_section_locales (join semua bahasa)
 */
export default function usePageSections(page, { live = true } = {}) {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];

  const [sections, setSections] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("page_sections")
      .select(`
        id, page, section_key, sort_index, data,
        page_section_locales (*)
      `)
      .eq("page", page)
      .order("sort_index", { ascending: true });

    if (error) {
      setError(error);
      setSections([]);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((s) => {
      const loc =
        s.page_section_locales?.find((l) => l.lang === lang) ||
        s.page_section_locales?.find((l) => l.lang === "en") ||
        s.page_section_locales?.[0] ||
        null;
      return { ...s, locale: loc };
    });

    setSections(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, lang]);

  useEffect(() => {
    if (!live) return;

    const channel = supabase
      .channel(`page_sections:${page}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "page_sections", filter: `page=eq.${page}` },
        fetchData
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "page_section_locales" },
        fetchData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page, live]);

  return { sections, loading, error, refetch: fetchData };
}
