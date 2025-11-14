export const mapLangToCurrency = (lng) =>
  lng?.startsWith("ja") ? "JPY" : lng?.startsWith("en") ? "USD" : "IDR";

export const mapLangToLocale = (lng) =>
  lng?.startsWith("id") ? "id-ID" : lng?.startsWith("ja") ? "ja-JP" : "en-US";

export function formatMoneyFromIDR(idr, currency, fx, locale) {
  const rateRow = (fx || []).find((r) => r.currency === currency);
  const rate = Number(rateRow?.idr_per_unit || 1);
  const value = Number(idr) / (rate || 1);
  return new Intl.NumberFormat(locale || "en-US", {
    style: "currency",
    currency,
  }).format(value);
}
