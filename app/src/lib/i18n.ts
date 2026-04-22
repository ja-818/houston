/**
 * i18next setup for the Houston desktop app.
 *
 * Source of truth for the user's locale = engine preference `locale`.
 * localStorage is only a boot-time cache so the first paint doesn't flash
 * English before the engine preference is read.
 *
 * Supported UI locales: en (filled), es (stub), pt (stub). Fallback = en.
 */

import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import commonEn from "../locales/en/common.json";
import setupEn from "../locales/en/setup.json";
import commonEs from "../locales/es/common.json";
import setupEs from "../locales/es/setup.json";
import commonPt from "../locales/pt/common.json";
import setupPt from "../locales/pt/setup.json";

export const SUPPORTED_LOCALES = ["en", "es", "pt"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Engine preference key for the user's chosen UI locale. */
export const LOCALE_PREF_KEY = "locale";

/**
 * Boot-time cache key in localStorage. Used ONLY to avoid flash-of-wrong-
 * language before the engine preference loads. Never the source of truth.
 */
const LOCALE_CACHE_KEY = "houston.locale.cache";

export function getCachedLocale(): SupportedLocale | null {
  try {
    const v = localStorage.getItem(LOCALE_CACHE_KEY);
    return isSupported(v) ? v : null;
  } catch {
    return null;
  }
}

export function setCachedLocale(locale: SupportedLocale): void {
  try {
    localStorage.setItem(LOCALE_CACHE_KEY, locale);
  } catch {
    /* ignore quota / disabled storage */
  }
}

export function isSupported(value: unknown): value is SupportedLocale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

/** Normalize a BCP-47 tag (`pt-BR`) to a supported locale (`pt`), or null. */
export function normalizeLocale(value: string | null | undefined): SupportedLocale | null {
  if (!value) return null;
  const base = value.toLowerCase().split(/[-_]/)[0];
  return isSupported(base) ? base : null;
}

const resources = {
  en: { common: commonEn, setup: setupEn },
  es: { common: commonEs, setup: setupEs },
  pt: { common: commonPt, setup: setupPt },
} as const;

// Pick an initial language: cached pref → navigator → 'en'.
const initialLng =
  getCachedLocale() ??
  normalizeLocale(
    typeof navigator !== "undefined" ? navigator.language : null,
  ) ??
  "en";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLng,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LOCALES as unknown as string[],
    nonExplicitSupportedLngs: true, // map pt-BR → pt, es-ES → es, etc.
    defaultNS: "common",
    ns: ["common", "setup"],
    interpolation: { escapeValue: false }, // react already escapes
    detection: {
      // Cache only — the engine preference is source of truth, applied by
      // `applyEngineLocale` once the engine handshake + pref are available.
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LOCALE_CACHE_KEY,
      caches: [],
    },
    react: { useSuspense: false },
  });

/**
 * Apply a locale coming from the engine preference. Pass `null` if the
 * preference is unset and the detector-picked value should stand.
 */
export async function applyEngineLocale(raw: string | null): Promise<void> {
  const locale = normalizeLocale(raw);
  if (!locale) return;
  if (i18n.language === locale) return;
  await i18n.changeLanguage(locale);
  setCachedLocale(locale);
}

/** Change the active locale AND remember it in the boot cache. */
export async function changeLocale(locale: SupportedLocale): Promise<void> {
  await i18n.changeLanguage(locale);
  setCachedLocale(locale);
}

export default i18n;
