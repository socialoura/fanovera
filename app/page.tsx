import Header from "./components/Header";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import CTABlock from "./components/CTABlock";
import Footer from "./components/Footer";
import { generateSurfaceMetadata, getRequestLocale } from "./lib/metadata";
import { getEffectiveMarketingModeForSurface } from "./lib/marketingMode.server";
import { MarketingModeProvider } from "./marketing/MarketingModeProvider";
import { surfaceModeToLegacy } from "./lib/marketingModeTypes";

export const generateMetadata = () => generateSurfaceMetadata("home", "home");

export default async function Page() {
  const locale = await getRequestLocale();
  const surfaceMode = await getEffectiveMarketingModeForSurface("home", locale);
  const legacyMode = surfaceModeToLegacy(surfaceMode);

  return (
    <MarketingModeProvider initialMode={legacyMode} initialSurfaceMode={surfaceMode}>
      <div data-i18n-skip>
        <div className="paper-frame">
          <Header />
          <Hero />
        </div>
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <CTABlock />
        <Footer />
      </div>
    </MarketingModeProvider>
  );
}
