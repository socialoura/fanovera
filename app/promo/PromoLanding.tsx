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

export default function PromoLanding({
  initialTargetedNetwork = null,
}: {
  // SSR-detected target so Hero renders the right featured-card variant
  // on first paint, avoiding the hydration flash when JS arrives late.
  initialTargetedNetwork?: NetworkId | null;
}) {
  return (
    <MarketingModeProvider initialMode="promo">
      <div data-i18n-skip>
        <div className="paper-frame">
          <Header />
          <main>
            <Hero initialTargetedNetwork={initialTargetedNetwork} />
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
