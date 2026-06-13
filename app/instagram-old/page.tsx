import type { Metadata } from "next";
import { cookies } from "next/headers";
import InstagramOldPageClient from "./InstagramOldPageClient";
import JsonLd from "../components/JsonLd";
import { getMarketingMode, getEffectiveMarketingModeForSurface } from "../lib/marketingMode.server";
import { generateSurfaceMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";
import { MarketingModeProvider } from "../marketing/MarketingModeProvider";
import { surfaceModeToLegacy } from "../lib/marketingModeTypes";
import { CHECKOUT_FLOW_COOKIE, resolveCheckoutFlowVariant } from "../lib/checkoutFlow";
import { getCachedCheckoutFlowMode } from "../lib/checkoutFlow.server";

// Parked previous Instagram flow (3-step + merged-checkout A/B). Kept reachable
// at /instagram-old for reference/rollback only — force noindex so it never
// competes with the canonical /instagram in search.
export const generateMetadata = async (): Promise<Metadata> => {
  const base = await generateSurfaceMetadata("instagram", "instagram");
  return { ...base, robots: { index: false, follow: false, googleBot: { index: false, follow: false } } };
};

export default async function InstagramOldPage() {
  const locale = await getRequestLocale();
  const [marketingMode, surfaceMode, checkoutFlowMode, cookieStore] = await Promise.all([
    getMarketingMode(),
    getEffectiveMarketingModeForSurface("instagram", locale),
    getCachedCheckoutFlowMode(),
    cookies(),
  ]);
  const legacyMode = surfaceModeToLegacy(surfaceMode);
  // Resolve the merged-checkout A/B variant SSR (admin mode + sticky bucket
  // cookie) so the client renders the right flow with no post-hydration flip.
  const checkoutFlowVariant = resolveCheckoutFlowVariant(
    checkoutFlowMode,
    cookieStore.get(CHECKOUT_FLOW_COOKIE)?.value,
  );
  return (
    <MarketingModeProvider initialMode={legacyMode} initialSurfaceMode={surfaceMode}>
      <JsonLd data={productJsonLd("instagram", locale, marketingMode)} />
      <InstagramOldPageClient checkoutFlowVariant={checkoutFlowVariant} />
    </MarketingModeProvider>
  );
}
