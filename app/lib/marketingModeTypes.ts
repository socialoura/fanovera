import type { SupportedLocale } from "../i18n/types";

export const MARKETING_MODES = ["clean", "performance", "promo"] as const;

export type MarketingMode = (typeof MARKETING_MODES)[number];

export function isMarketingMode(value: unknown): value is MarketingMode {
  return typeof value === "string" && MARKETING_MODES.includes(value as MarketingMode);
}

/**
 * Locales allowed to render non-whitehat marketing copy (performance/promo and
 * the per-surface greyhat/blackhat modes). Every other locale is always forced
 * to whitehat. The greyhat/blackhat copy exists for these locales in
 * performanceCopy.ts.
 */
export const MODE_ELIGIBLE_LOCALES: readonly SupportedLocale[] = ["fr", "en", "es", "it"];

export function isModeEligibleLocale(locale: SupportedLocale): boolean {
  return MODE_ELIGIBLE_LOCALES.includes(locale);
}

export function getEffectiveMarketingMode(locale: SupportedLocale, mode: MarketingMode): MarketingMode {
  const eligible = isModeEligibleLocale(locale);
  if (mode === "promo" && eligible) return "promo";
  return mode === "performance" && eligible ? "performance" : "clean";
}

// ── Per-surface marketing modes (whitehat / greyhat / blackhat) ──

export const SURFACE_MARKETING_MODES = ["whitehat", "greyhat", "blackhat"] as const;
export type SurfaceMarketingMode = (typeof SURFACE_MARKETING_MODES)[number];

export const MARKETING_SURFACES = [
  "home", "promo", "instagram", "tiktok", "twitter",
  "twitch", "youtube", "spotify", "facebook", "linkedin",
] as const;
export type MarketingSurface = (typeof MARKETING_SURFACES)[number];

export function isSurfaceMarketingMode(value: unknown): value is SurfaceMarketingMode {
  return typeof value === "string" && SURFACE_MARKETING_MODES.includes(value as SurfaceMarketingMode);
}

export function isMarketingSurface(value: unknown): value is MarketingSurface {
  return typeof value === "string" && MARKETING_SURFACES.includes(value as MarketingSurface);
}

export const SURFACE_PATH_MAP: Record<MarketingSurface, string> = {
  home: "/",
  promo: "/promo",
  instagram: "/instagram",
  tiktok: "/tiktok",
  twitter: "/twitter",
  twitch: "/twitch",
  youtube: "/youtube",
  spotify: "/spotify",
  facebook: "/facebook",
  linkedin: "/linkedin",
};

/**
 * Map per-surface mode to the legacy MarketingMode consumed by client components.
 * whitehat → "clean", greyhat/blackhat → "performance"
 */
export function surfaceModeToLegacy(surfaceMode: SurfaceMarketingMode): MarketingMode {
  return surfaceMode === "whitehat" ? "clean" : "performance";
}

export const SURFACE_LABELS: Record<MarketingSurface, string> = {
  home: "Home",
  promo: "Promo",
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "X / Twitter",
  twitch: "Twitch",
  youtube: "YouTube",
  spotify: "Spotify",
  facebook: "Facebook",
  linkedin: "LinkedIn",
};
