import type { SupportedLocale } from "../i18n/types";

export const MARKETING_MODES = ["clean", "performance", "promo"] as const;

export type MarketingMode = (typeof MARKETING_MODES)[number];

export function isMarketingMode(value: unknown): value is MarketingMode {
  return typeof value === "string" && MARKETING_MODES.includes(value as MarketingMode);
}

export function getEffectiveMarketingMode(locale: SupportedLocale, mode: MarketingMode): MarketingMode {
  if (mode === "promo" && (locale === "fr" || locale === "en")) return "promo";
  return mode === "performance" && (locale === "fr" || locale === "en") ? "performance" : "clean";
}
