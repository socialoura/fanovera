import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import CTABlock from "./components/CTABlock";
import Footer from "./components/Footer";

export default function Page() {
  return (
    <>
      <div className="paper-frame">
        <Hero />
      </div>
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <CTABlock />
      <Footer />
    </>
  );
}
