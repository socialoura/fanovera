import JsonLd from "../components/JsonLd";
import { getMarketingMode, getEffectiveMarketingModeForSurface } from "../lib/marketingMode.server";
import { generateSurfaceMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";
import { MarketingModeProvider } from "../marketing/MarketingModeProvider";
import { surfaceModeToLegacy } from "../lib/marketingModeTypes";
import SpotifyPageClient from "./SpotifyPageClient";

export const generateMetadata = () => generateSurfaceMetadata("spotify", "spotify");

export default async function SpotifyPage() {
  const locale = await getRequestLocale();
  const [marketingMode, surfaceMode] = await Promise.all([
    getMarketingMode(),
    getEffectiveMarketingModeForSurface("spotify", locale),
  ]);
  const legacyMode = surfaceModeToLegacy(surfaceMode);
  return (
    <MarketingModeProvider initialMode={legacyMode} initialSurfaceMode={surfaceMode}>
      <JsonLd data={productJsonLd("spotify", locale, marketingMode)} />
      <SpotifyPageClient />
    </MarketingModeProvider>
  );
}
