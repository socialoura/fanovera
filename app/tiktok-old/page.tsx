import type { Metadata } from "next";
import JsonLd from "../components/JsonLd";
import { getMarketingMode, getEffectiveMarketingModeForSurface } from "../lib/marketingMode.server";
import { generateSurfaceMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";
import { MarketingModeProvider } from "../marketing/MarketingModeProvider";
import { surfaceModeToLegacy } from "../lib/marketingModeTypes";
import TiktokOldPageClient from "./TiktokOldPageClient";

// Parked previous TikTok flow (3-step, losing A/B variant). Kept reachable at
// /tiktok-old for reference/rollback only — force noindex so it never competes
// with the canonical /tiktok in search.
export const generateMetadata = async (): Promise<Metadata> => {
  const base = await generateSurfaceMetadata("tiktok", "tiktok");
  return { ...base, robots: { index: false, follow: false, googleBot: { index: false, follow: false } } };
};

export default async function TiktokOldPage() {
  const locale = await getRequestLocale();
  const [marketingMode, surfaceMode] = await Promise.all([
    getMarketingMode(),
    getEffectiveMarketingModeForSurface("tiktok", locale),
  ]);
  const legacyMode = surfaceModeToLegacy(surfaceMode);
  return (
    <MarketingModeProvider initialMode={legacyMode} initialSurfaceMode={surfaceMode}>
      <JsonLd data={productJsonLd("tiktok", locale, marketingMode)} />
      <TiktokOldPageClient />
    </MarketingModeProvider>
  );
}
