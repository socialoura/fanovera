import JsonLd from "../components/JsonLd";
import { getMarketingMode, getEffectiveMarketingModeForSurface } from "../lib/marketingMode.server";
import { generateSurfaceMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";
import { MarketingModeProvider } from "../marketing/MarketingModeProvider";
import { surfaceModeToLegacy } from "../lib/marketingModeTypes";
import { getCachedTt2PacksMode } from "../lib/tt2PacksExperiment.server";
import TiktokPageClient from "./TiktokPageClient";

export const generateMetadata = () => generateSurfaceMetadata("tiktok", "tiktok");

export default async function TiktokPage() {
  const locale = await getRequestLocale();
  const [marketingMode, surfaceMode, packsMode] = await Promise.all([
    getMarketingMode(),
    getEffectiveMarketingModeForSurface("tiktok", locale),
    getCachedTt2PacksMode(),
  ]);
  const legacyMode = surfaceModeToLegacy(surfaceMode);
  return (
    <MarketingModeProvider initialMode={legacyMode} initialSurfaceMode={surfaceMode}>
      <JsonLd data={productJsonLd("tiktok", locale, marketingMode)} />
      <TiktokPageClient packsMode={packsMode} />
    </MarketingModeProvider>
  );
}
