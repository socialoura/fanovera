import type { MetadataRoute } from "next";
import { INDEXABLE_ROUTE_IDS, PUBLIC_ROUTES, SITE_URL, alternateLanguages, localizedUrl, type PublicRouteId } from "./lib/siteMetadata";
import { SUPPORTED_LOCALES, type SupportedLocale } from "./i18n/types";
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

// Captured once at module load, not on each request. Search engines treat
// `lastModified` as a signal: if every URL claims to have just updated on
// every crawl, the signal is meaningless and the bot may discount it. With
// ISR (revalidate below), this refreshes each deploy/revalidation cycle.
const BUILD_TIMESTAMP = new Date();

// Marketing/utility pages that exist as standalone routes (no PUBLIC_ROUTES
// entry, because they ship their own metadata) but should still be indexable
// and translated across all locales via the middleware-driven /:locale/path
// rewrite. Listed here so they appear in the sitemap with proper hreflang.
type ExtraRoute = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const EXTRA_LOCALIZED_ROUTES: ExtraRoute[] = [
  { path: "promo", changeFrequency: "weekly", priority: 0.7 },
  { path: "roi", changeFrequency: "monthly", priority: 0.6 },
  { path: "contact", changeFrequency: "yearly", priority: 0.4 },
];

function buildLocalizedUrl(locale: SupportedLocale, path: string) {
  return `${SITE_URL}/${locale}/${path}`;
}

function buildAlternateLanguages(path: string): Record<string, string> {
  const entries: [string, string][] = SUPPORTED_LOCALES.map((locale) => [
    locale,
    buildLocalizedUrl(locale, path),
  ]);
  entries.push(["x-default", buildLocalizedUrl("fr", path)]);
  return Object.fromEntries(entries);
}

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
        lastModified: BUILD_TIMESTAMP,
        changeFrequency: (PUBLIC_ROUTES[routeId].pageType === "home" ? "weekly" : "monthly") as MetadataRoute.Sitemap[number]["changeFrequency"],
        priority: PUBLIC_ROUTES[routeId].pageType === "home" ? 1 : PUBLIC_ROUTES[routeId].pageType === "legal" ? 0.35 : 0.8,
        alternates: {
          languages: alternateLanguages(routeId),
        },
      })),
    );

  const extraRoutes: MetadataRoute.Sitemap = EXTRA_LOCALIZED_ROUTES.flatMap((route) =>
    SUPPORTED_LOCALES.map((locale) => ({
      url: buildLocalizedUrl(locale, route.path),
      lastModified: BUILD_TIMESTAMP,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages: buildAlternateLanguages(route.path) },
    })),
  );

  // Comparison long-tail SEO pages — one URL per competitor. Static priority
  // a notch below product pages: they target lower-intent keywords but also
  // capture much less competition. Single-locale (FR), so no hreflang.
  const comparerRoutes: MetadataRoute.Sitemap = COMPETITOR_SLUGS.map((slug) => ({
    url: `${SITE_URL}/comparer/${slug}`,
    lastModified: BUILD_TIMESTAMP,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...baseRoutes, ...extraRoutes, ...comparerRoutes];
}

// Cache the sitemap response for 1h at the edge. Blackhat-mode toggling is
// the only dynamic input and a 1h staleness window is acceptable; saves a DB
// round-trip on every Googlebot ping.
export const revalidate = 3600;
export const metadataBase = new URL(SITE_URL);
