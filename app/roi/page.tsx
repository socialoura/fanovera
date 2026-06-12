import type { Metadata } from "next";
import RoiCalculator from "../components/RoiCalculator";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Calculateur ROI | Fanovera",
  description:
    "Comparez le cout d'acquisition d'abonnes via Meta Ads avec un pack Fanovera equivalent. Methodologie publique, slider personnalisable.",
};

export default function RoiPage() {
  return (
    <>
      <Header />
      <main style={{ padding: "60px 20px", minHeight: "60vh" }}>
        <div className="container">
          <RoiCalculator ctaHref="/instagram-2" />
        </div>
      </main>
      <Footer />
    </>
  );
}
