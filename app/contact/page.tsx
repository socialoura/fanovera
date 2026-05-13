import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getRequestLocale } from "../lib/metadata";
import { SITE_URL } from "../lib/siteMetadata";
import ContactClient from "./ContactClient";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const isFr = locale === "fr";
  const title = isFr
    ? "Contact - Fanovera"
    : "Contact - Fanovera";
  const description = isFr
    ? "Une question, une commande à suivre ou un partenariat ? Notre équipe vous répond en moins de 24 h."
    : "A question, an order to track or a partnership? Our team gets back to you in under 24 h.";

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: `${SITE_URL}/${locale}/contact` },
    openGraph: {
      type: "website",
      siteName: "Fanovera",
      locale,
      title,
      description,
      url: `${SITE_URL}/${locale}/contact`,
    },
    robots: { index: true, follow: true },
  };
}

export default function ContactPage() {
  return (
    <>
      <div className="paper-frame">
        <Header />
        <ContactClient />
      </div>
      <Footer />
    </>
  );
}
