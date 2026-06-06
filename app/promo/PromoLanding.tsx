"use client";

import { MarketingModeProvider } from "../marketing/MarketingModeProvider";
import Header from "../components/Header";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import CTABlock from "../components/CTABlock";
import Footer from "../components/Footer";
import type { NetworkId } from "../lib/networks";
import type { PromoFlowVariant } from "../lib/promoFlow";
import type { SupportedCurrency } from "../lib/pricingCurrency";

export default function PromoLanding({
  initialTargetedNetwork = null,
  promoFlowVariant = "control",
  initialCurrency,
  initialLocale,
  initialPriceLabels,
}: {
  // SSR-detected target so Hero renders the right featured-card variant
  // on first paint, avoiding the hydration flash when JS arrives late.
  initialTargetedNetwork?: NetworkId | null;
  // /promo username-first A/B variant (assigned in middleware, read SSR).
  promoFlowVariant?: PromoFlowVariant;
  // SSR-resolved currency/locale (geo header) → seeds the Hero price formatter
  // so prices paint in the visitor's currency, no EUR→£ flash on first load.
  initialCurrency?: SupportedCurrency;
  initialLocale?: string;
  // SSR real "from £X" anchors per network → no EUR-fallback → real-price jump.
  initialPriceLabels?: Record<NetworkId, string>;
}) {
  return (
    <MarketingModeProvider initialMode="promo">
      <div data-i18n-skip>
        <div className="paper-frame">
          <Header />
          <main>
            <Hero
              initialTargetedNetwork={initialTargetedNetwork}
              promoFlowVariant={promoFlowVariant}
              initialCurrency={initialCurrency}
              initialLocale={initialLocale}
              initialPriceLabels={initialPriceLabels}
            />
          </main>
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
