import { SUPPORTED_LOCALES, type SupportedLocale } from "./types";

export const LOCALE_EVENT = "fanovera:locale-change";
export const LOCALE_KEY = "fanovera_locale";
export const LOCALE_MODE_KEY = "fanovera_locale_mode";

const COUNTRY_TO_LOCALE: Record<string, SupportedLocale> = {
  FR: "fr",
  BE: "fr",
  CH: "fr",
  LU: "fr",
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  UY: "es",
  PY: "es",
  BO: "es",
  EC: "es",
  VE: "es",
  CR: "es",
  PA: "es",
  DO: "es",
  GT: "es",
  HN: "es",
  NI: "es",
  SV: "es",
  US: "en",
  GB: "en",
  CA: "en",
  AU: "en",
  IE: "en",
  NZ: "en",
  PT: "pt",
  BR: "pt",
  DE: "de",
  AT: "de",
  IT: "it",
  TR: "tr",
};

const AMBIGUOUS_COUNTRIES = new Set(["BE", "CH", "CA"]);

export function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value.toLowerCase() as SupportedLocale);
}

export function normalizeLocale(value: string | null | undefined): SupportedLocale | null {
  if (!value) return null;
  const base = value.toLowerCase().split(/[-_]/)[0];
  return isSupportedLocale(base) ? base : null;
}

export function mapCountryToLocale(country: string | null | undefined): SupportedLocale {
  return COUNTRY_TO_LOCALE[(country || "").toUpperCase()] || "fr";
}

export function pickLocaleFromAcceptLanguage(value: string | null | undefined): SupportedLocale | null {
  if (!value) return null;

  for (const part of value.split(",")) {
    const candidate = normalizeLocale(part.trim().split(";")[0]);
    if (candidate) return candidate;
  }

  return null;
}

export function resolveLocale(input: {
  manual?: string | null;
  mode?: string | null;
  country?: string | null;
  acceptLanguage?: string | null;
}) {
  const manual = normalizeLocale(input.manual);
  if (input.mode === "manual" && manual) {
    return { locale: manual, source: "manual" as const };
  }

  const country = (input.country || "").toUpperCase();
  const browserLocale = pickLocaleFromAcceptLanguage(input.acceptLanguage);
  if (country && AMBIGUOUS_COUNTRIES.has(country) && browserLocale) {
    return { locale: browserLocale, source: "browser" as const };
  }

  if (country && COUNTRY_TO_LOCALE[country]) {
    return { locale: COUNTRY_TO_LOCALE[country], source: "country" as const };
  }

  if (browserLocale) {
    return { locale: browserLocale, source: "browser" as const };
  }

  // International visitor: neither a known country nor a supported browser
  // language. Default to English rather than French — these are almost always
  // foreign-language users (e.g. PL/HU/RO/GR/AR), for whom English is a far
  // better default than French. FR organic traffic is already caught upstream
  // by country/cookie, so it is unaffected by this fallback.
  return { locale: "en" as SupportedLocale, source: "fallback" as const };
}
