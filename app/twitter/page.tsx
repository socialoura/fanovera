import JsonLd from "../components/JsonLd";
import { getMarketingMode, getEffectiveMarketingModeForSurface } from "../lib/marketingMode.server";
import { generateSurfaceMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";
import { MarketingModeProvider } from "../marketing/MarketingModeProvider";
import { surfaceModeToLegacy } from "../lib/marketingModeTypes";
import TwitterPageClient from "./TwitterPageClient";

export const generateMetadata = () => generateSurfaceMetadata("twitter", "twitter");

export default async function TwitterPage() {
  const locale = await getRequestLocale();
  const [marketingMode, surfaceMode] = await Promise.all([
    getMarketingMode(),
    getEffectiveMarketingModeForSurface("twitter", locale),
  ]);
  const legacyMode = surfaceModeToLegacy(surfaceMode);
  return (
    <MarketingModeProvider initialMode={legacyMode} initialSurfaceMode={surfaceMode}>
      <JsonLd data={productJsonLd("twitter", locale, marketingMode)} />
      <TwitterPageClient />
    </MarketingModeProvider>
  );
}
