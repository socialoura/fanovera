import { headers } from "next/headers";
import { getMarketingMode, getEffectiveMarketingModeForSurface } from "./marketingMode.server";
import { buildPageMetadata, normalizeRouteLocale, type PublicRouteId } from "./siteMetadata";
import type { MarketingSurface } from "./marketingModeTypes";

export async function generateLocalizedMetadata(routeId: PublicRouteId, extraPath = "") {
  const requestHeaders = await headers();
  const marketingMode = await getMarketingMode();
  return buildPageMetadata(routeId, requestHeaders.get("x-fanovera-locale"), extraPath, marketingMode);
}

/**
 * Surface-aware metadata generator. Uses per-surface mode from DB.
 * Overrides metaTitle/metaDescription and sets robots noindex for blackhat.
 */
export async function generateSurfaceMetadata(
  routeId: PublicRouteId,
  surface: MarketingSurface,
  extraPath = "",
) {
  const requestHeaders = await headers();
  const locale = normalizeRouteLocale(requestHeaders.get("x-fanovera-locale"));
  const marketingMode = await getMarketingMode();
  const surfaceMode = await getEffectiveMarketingModeForSurface(surface, locale);

  // Build base metadata using existing system
  const base = buildPageMetadata(routeId, locale, extraPath, marketingMode);

  // Blackhat → noindex, nofollow (metadata title/description stay unchanged)
  if (surfaceMode === "blackhat") {
    base.robots = { index: false, follow: false, googleBot: { index: false, follow: false } };
  }

  return base;
}

export async function getRequestLocale() {
  const requestHeaders = await headers();
  return normalizeRouteLocale(requestHeaders.get("x-fanovera-locale"));
}
