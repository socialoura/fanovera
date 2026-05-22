"use client";

import dynamic from "next/dynamic";
import { MarketingModeProvider } from "../marketing/MarketingModeProvider";
import Header from "../components/Header";
import Hero from "../components/Hero";

// Sections below the fold: load only when the user scrolls them into view (or
// when the browser is idle). Cuts the initial JS bundle parsed before LCP by
// shipping these as separate chunks. `ssr: true` keeps the HTML available for
// SEO; only the JS execution is deferred.
const HowItWorks = dynamic(() => import("../components/HowItWorks"), { ssr: true });
const Testimonials = dynamic(() => import("../components/Testimonials"), { ssr: true });
const FAQ = dynamic(() => import("../components/FAQ"), { ssr: true });
const CTABlock = dynamic(() => import("../components/CTABlock"), { ssr: true });
const Footer = dynamic(() => import("../components/Footer"), { ssr: true });

export default function PromoLanding() {
  return (
    <MarketingModeProvider initialMode="promo">
      <div data-i18n-skip>
        <div className="paper-frame">
          <Header />
          <main>
            <Hero />
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
