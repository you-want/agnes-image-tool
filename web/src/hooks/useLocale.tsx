"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  FALLBACK_LOCALE,
  isLocale,
  translate,
  type Locale,
  type Translate,
  type TranslationParams,
} from "@/locales";

export type SupportedLocale = Locale;

interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: Translate;
}

const STORAGE_KEY = "agnes-locale";
const LocaleContext = createContext<LocaleContextValue | null>(null);

function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator === "undefined") return FALLBACK_LOCALE;
  return navigator.languages.some((language) => language.toLowerCase().startsWith("zh"))
    ? "zh-CN"
    : "en";
}

export function LocaleProvider({
  children,
  initialLocale = FALLBACK_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: SupportedLocale;
}) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initial = isLocale(stored) ? stored : initialLocale || detectBrowserLocale();
    document.documentElement.lang = initial;
    setLocaleState(initial);
  }, [initialLocale]);

  const setLocale = useCallback((nextLocale: SupportedLocale) => {
    localStorage.setItem(STORAGE_KEY, nextLocale);
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = nextLocale;
    setLocaleState(nextLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}

export function useTranslations(): Translate {
  return useLocale().t;
}
