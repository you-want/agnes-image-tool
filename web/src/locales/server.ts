import "server-only";

import { cookies, headers } from "next/headers";
import { FALLBACK_LOCALE, isLocale, type Locale } from "@/locales";

export const LOCALE_COOKIE = "agnes-locale";

function localeFromAcceptLanguage(value: string | null): Locale | null {
  if (!value) return null;

  const candidates = value
    .split(",")
    .map((part, index) => {
      const [rawTag, ...parameters] = part.trim().toLowerCase().split(";");
      const quality = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const weight = quality ? Number(quality.trim().slice(2)) : 1;
      return { rawTag, weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter(({ rawTag, weight }) => rawTag && rawTag !== "*" && weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);

  for (const { rawTag } of candidates) {
    if (rawTag.startsWith("zh")) return "zh-CN";
    if (rawTag.startsWith("en")) return "en";
  }
  return null;
}

export async function getRequestLocale(): Promise<Locale> {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;
  return localeFromAcceptLanguage((await headers()).get("accept-language")) || FALLBACK_LOCALE;
}
