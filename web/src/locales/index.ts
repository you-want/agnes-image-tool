import zhCN from "./zh-CN.json";
import en from "./en.json";

export const translations = {
  "zh-CN": zhCN,
  en,
} as const;

export type Locale = keyof typeof translations;
export type TranslationParams = Record<string, string | number>;
export type Translate = (key: string, params?: TranslationParams) => string;

export const FALLBACK_LOCALE: Locale = "zh-CN";
export const SUPPORTED_LOCALES = Object.keys(translations) as Locale[];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && value in translations;
}

export function translate(locale: Locale, key: string, params?: TranslationParams): string {
  const localeData = translations[locale] || translations[FALLBACK_LOCALE];
  const fallbackData = translations[FALLBACK_LOCALE];
  const parts = key.split(".");

  const resolve = (data: unknown): unknown => {
    let value = data;
    for (const part of parts) {
      if (value && typeof value === "object" && part in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return value;
  };

  let value = resolve(localeData);
  if (typeof value !== "string" && locale !== FALLBACK_LOCALE) {
    value = resolve(fallbackData);
  }
  if (typeof value !== "string") return key;

  return params
    ? value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`))
    : value;
}
