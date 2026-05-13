import Header from "./components/Header";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import CTABlock from "./components/CTABlock";
import Footer from "./components/Footer";
import { generateLocalizedMetadata } from "./lib/metadata";

export const generateMetadata = () => generateLocalizedMetadata("home");

export default function Page() {
  return (
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
  );
}
