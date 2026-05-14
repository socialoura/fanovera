import type { MetadataRoute } from "next";
import { INDEXABLE_ROUTE_IDS, PUBLIC_ROUTES, SITE_URL, alternateLanguages, localizedUrl, type PublicRouteId } from "./lib/siteMetadata";
import { SUPPORTED_LOCALES } from "./i18n/types";
import { COMPETITOR_SLUGS } from "./lib/comparerData";
import { getAllSurfaceMarketingModes } from "./lib/marketingMode.server";
import type { MarketingSurface } from "./lib/marketingModeTypes";

// Map PublicRouteId → MarketingSurface for blackhat exclusion
const ROUTE_TO_SURFACE: Partial<Record<PublicRouteId, MarketingSurface>> = {
  home: "home",
  instagram: "instagram",
  tiktok: "tiktok",
  youtube: "youtube",
  spotify: "spotify",
  twitch: "twitch",
  facebook: "facebook",
  linkedin: "linkedin",
  twitter: "twitter",
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let blackhatSurfaces: Set<string> = new Set();
  try {
    const modes = await getAllSurfaceMarketingModes();
    blackhatSurfaces = new Set(
      (Object.entries(modes) as [string, string][])
        .filter(([, mode]) => mode === "blackhat")
        .map(([surface]) => surface),
    );
  } catch {
    // If DB is unavailable, include all routes (safe default)
  }

  const baseRoutes = INDEXABLE_ROUTE_IDS
    .filter((routeId) => {
      const surface = ROUTE_TO_SURFACE[routeId];
      return !surface || !blackhatSurfaces.has(surface);
    })
    .flatMap((routeId) =>
      SUPPORTED_LOCALES.map((locale) => ({
        url: localizedUrl(locale, routeId),
        lastModified: new Date(),
        changeFrequency: (PUBLIC_ROUTES[routeId].pageType === "home" ? "weekly" : "monthly") as MetadataRoute.Sitemap[number]["changeFrequency"],
        priority: PUBLIC_ROUTES[routeId].pageType === "home" ? 1 : PUBLIC_ROUTES[routeId].pageType === "legal" ? 0.35 : 0.8,
        alternates: {
          languages: alternateLanguages(routeId),
        },
      })),
    );

  // Comparison long-tail SEO pages — one URL per competitor. Static priority
  // a notch below product pages: they target lower-intent keywords but also
  // capture much less competition.
  const comparerRoutes: MetadataRoute.Sitemap = COMPETITOR_SLUGS.map((slug) => ({
    url: `${SITE_URL}/comparer/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...baseRoutes, ...comparerRoutes];
}

export const dynamic = "force-dynamic";
export const metadataBase = new URL(SITE_URL);
