import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useTranslation } from "react-i18next";
import { mapLangToCurrency, mapLangToLocale } from "../utils/currency";

const Ctx = createContext(null);
export const useCurrency = () => useContext(Ctx);

export function CurrencyProvider({ children }) {
  const { i18n } = useTranslation();
  const [fx, setFx] = useState([]);
  const [currency, setCurrency] = useState(mapLangToCurrency(i18n.language || "en"));
  const [locale, setLocale] = useState(mapLangToLocale(i18n.language || "en"));

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("fx_rates").select("*");
      if (!error) setFx(data || []);
    })();
  }, []);

  useEffect(() => {
    const lng = i18n.language || "en";
    setCurrency(mapLangToCurrency(lng));
    setLocale(mapLangToLocale(lng));
  }, [i18n.language]);

  const value = useMemo(() => ({ fx, currency, setCurrency, locale }), [fx, currency, locale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
