import { headers } from "next/headers";
import { getMarketingMode } from "./marketingMode.server";
import { buildPageMetadata, normalizeRouteLocale, type PublicRouteId } from "./siteMetadata";

export async function generateLocalizedMetadata(routeId: PublicRouteId, extraPath = "") {
  const requestHeaders = await headers();
  const marketingMode = await getMarketingMode();
  return buildPageMetadata(routeId, requestHeaders.get("x-fanovera-locale"), extraPath, marketingMode);
}

export async function getRequestLocale() {
  const requestHeaders = await headers();
  return normalizeRouteLocale(requestHeaders.get("x-fanovera-locale"));
}
