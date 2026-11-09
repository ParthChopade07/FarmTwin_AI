import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Static bundled fallbacks for fast first paint, with dynamic extension
import en from "../public/locales/en.json";
import hi from "../public/locales/hi.json";
import mr from "../public/locales/mr.json";
import gu from "../public/locales/gu.json";
import pa from "../public/locales/pa.json";
import te from "../public/locales/te.json";
import kn from "../public/locales/kn.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "EN", full: "English", bhashiniCode: "en", speechCode: "en-IN" },
  { code: "hi", label: "हिं", full: "हिंदी", bhashiniCode: "hi", speechCode: "hi-IN" },
  { code: "mr", label: "म", full: "मराठी", bhashiniCode: "mr", speechCode: "mr-IN" },
  { code: "gu", label: "ગુ", full: "ગુજરાતી", bhashiniCode: "gu", speechCode: "gu-IN" },
  { code: "pa", label: "ਪੰ", full: "ਪੰਜਾਬੀ", bhashiniCode: "pa", speechCode: "pa-IN" },
  { code: "te", label: "తె", full: "తెలుగు", bhashiniCode: "te", speechCode: "te-IN" },
  { code: "kn", label: "ಕ", full: "ಕನ್ನಡ", bhashiniCode: "kn", speechCode: "kn-IN" },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
      gu: { translation: gu },
      pa: { translation: pa },
      te: { translation: te },
      kn: { translation: kn },
    },
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
