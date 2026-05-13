import { buildPageMetadata } from "../lib/siteMetadata";
import { getRequestLocale } from "../lib/metadata";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TrackLookupClient from "./TrackLookupClient";

export async function generateMetadata() {
  const locale = await getRequestLocale();
  return buildPageMetadata("track", locale);
}

export default function TrackPage() {
  return (
    <>
      <div className="paper-frame">
        <Header />
        <TrackLookupClient />
      </div>
      <Footer />
    </>
  );
}
