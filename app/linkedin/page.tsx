import JsonLd from "../components/JsonLd";
import { getMarketingMode, getEffectiveMarketingModeForSurface } from "../lib/marketingMode.server";
import { generateSurfaceMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";
import { MarketingModeProvider } from "../marketing/MarketingModeProvider";
import { surfaceModeToLegacy } from "../lib/marketingModeTypes";
import LinkedinPageClient from "./LinkedinPageClient";

export const generateMetadata = () => generateSurfaceMetadata("linkedin", "linkedin");

export default async function LinkedinPage() {
  const locale = await getRequestLocale();
  const [marketingMode, surfaceMode] = await Promise.all([
    getMarketingMode(),
    getEffectiveMarketingModeForSurface("linkedin", locale),
  ]);
  const legacyMode = surfaceModeToLegacy(surfaceMode);
  return (
    <MarketingModeProvider initialMode={legacyMode} initialSurfaceMode={surfaceMode}>
      <JsonLd data={productJsonLd("linkedin", locale, marketingMode)} />
      <LinkedinPageClient />
    </MarketingModeProvider>
  );
}
