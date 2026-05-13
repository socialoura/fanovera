import type { MetadataRoute } from "next";
import { INDEXABLE_ROUTE_IDS, PUBLIC_ROUTES, SITE_URL, alternateLanguages, localizedUrl } from "./lib/siteMetadata";
import { SUPPORTED_LOCALES } from "./i18n/types";

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_ROUTE_IDS.flatMap((routeId) =>
    SUPPORTED_LOCALES.map((locale) => ({
      url: localizedUrl(locale, routeId),
      lastModified: new Date(),
      changeFrequency: PUBLIC_ROUTES[routeId].pageType === "home" ? "weekly" : "monthly",
      priority: PUBLIC_ROUTES[routeId].pageType === "home" ? 1 : 0.8,
      alternates: {
        languages: alternateLanguages(routeId),
      },
    })),
  );
}

export const dynamic = "force-static";
export const metadataBase = new URL(SITE_URL);
