import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

const SUPPORTED_LANGS = ["id", "en", "ja"];

const getInitialLanguage = () => {
  const stored =
    typeof window !== "undefined"
      ? window.localStorage.getItem("i18nextLng")?.slice(0, 2).toLowerCase()
      : null;

  return SUPPORTED_LANGS.includes(stored) ? stored : "en";
};

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    lng: getInitialLanguage(),
    supportedLngs: SUPPORTED_LANGS,
    load: "languageOnly",
    backend: {
      loadPath: "/locales/{{lng}}/common.json",
    },
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });

export default i18n;
