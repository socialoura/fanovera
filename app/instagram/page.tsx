import { cookies } from "next/headers";
import InstagramPageClient from "./InstagramPageClient";
import JsonLd from "../components/JsonLd";
import { getMarketingMode, getEffectiveMarketingModeForSurface } from "../lib/marketingMode.server";
import { generateSurfaceMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";
import { MarketingModeProvider } from "../marketing/MarketingModeProvider";
import { surfaceModeToLegacy } from "../lib/marketingModeTypes";
import { CHECKOUT_FLOW_COOKIE, resolveCheckoutFlowVariant } from "../lib/checkoutFlow";
import { getCachedCheckoutFlowMode } from "../lib/checkoutFlow.server";

export const generateMetadata = () => generateSurfaceMetadata("instagram", "instagram");

export default async function InstagramPage() {
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
      <InstagramPageClient checkoutFlowVariant={checkoutFlowVariant} />
    </MarketingModeProvider>
  );
}
