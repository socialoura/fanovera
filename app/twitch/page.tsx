import JsonLd from "../components/JsonLd";
import { getMarketingMode, getEffectiveMarketingModeForSurface } from "../lib/marketingMode.server";
import { generateSurfaceMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";
import { MarketingModeProvider } from "../marketing/MarketingModeProvider";
import { surfaceModeToLegacy } from "../lib/marketingModeTypes";
import TwitchPageClient from "./TwitchPageClient";

export const generateMetadata = () => generateSurfaceMetadata("twitch", "twitch");

export default async function TwitchPage() {
  const locale = await getRequestLocale();
  const [marketingMode, surfaceMode] = await Promise.all([
    getMarketingMode(),
    getEffectiveMarketingModeForSurface("twitch", locale),
  ]);
  const legacyMode = surfaceModeToLegacy(surfaceMode);
  return (
    <MarketingModeProvider initialMode={legacyMode} initialSurfaceMode={surfaceMode}>
      <JsonLd data={productJsonLd("twitch", locale, marketingMode)} />
      <TwitchPageClient />
    </MarketingModeProvider>
  );
}
