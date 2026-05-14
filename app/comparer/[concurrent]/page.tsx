import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { COMPETITORS, COMPETITOR_SLUGS, getCompetitorBySlug } from "../../lib/comparerData";
import ComparerClient from "./ComparerClient";
import { SITE_URL, normalizeRouteLocale } from "../../lib/siteMetadata";
import { getRequestLocale } from "../../lib/metadata";

/** Pre-render every comparer page at build time so they ship as static HTML
 *  (max SEO juice + zero render cost on visit). */
export function generateStaticParams() {
  return COMPETITOR_SLUGS.map((concurrent) => ({ concurrent }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ concurrent: string }>;
}): Promise<Metadata> {
  const { concurrent } = await params;
  const competitor = getCompetitorBySlug(concurrent);
  if (!competitor) return {};

  const localeRaw = await getRequestLocale();
  const locale = normalizeRouteLocale(localeRaw);
  const lang = locale === "en" ? "en" : "fr";

  const title =
    lang === "fr"
      ? `Fanovera vs ${competitor.name} : comparatif honnête (${new Date().getFullYear()})`
      : `Fanovera vs ${competitor.name}: an honest comparison (${new Date().getFullYear()})`;
  const description =
    lang === "fr"
      ? `Comparatif détaillé entre Fanovera et ${competitor.name}. Prix, délais, qualité, paiement, conformité — voyez quel service correspond à votre besoin.`
      : `In-depth comparison between Fanovera and ${competitor.name}. Pricing, speed, quality, payment, compliance — see which service fits your need.`;
  const canonical = `${SITE_URL}/comparer/${competitor.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: "Fanovera",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function ComparerPage({
  params,
}: {
  params: Promise<{ concurrent: string }>;
}) {
  const { concurrent } = await params;
  const competitor = getCompetitorBySlug(concurrent);
  if (!competitor) notFound();

  const localeRaw = await getRequestLocale();
  const locale = normalizeRouteLocale(localeRaw);
  const lang: "fr" | "en" = locale === "en" ? "en" : "fr";

  const all = COMPETITORS.map((c) => ({ slug: c.slug, name: c.name }));

  // JSON-LD structured data — gives Google clear signals about the
  // comparison entity. We use SoftwareApplication as the closest match
  // (the actual schema.org/Service is too generic for product/competitor
  // comparisons).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      lang === "fr"
        ? `Fanovera vs ${competitor.name} : comparatif`
        : `Fanovera vs ${competitor.name}: comparison`,
    description: competitor.description[lang],
    author: { "@type": "Organization", name: "Fanovera" },
    publisher: { "@type": "Organization", name: "Fanovera" },
    mainEntityOfPage: `${SITE_URL}/comparer/${competitor.slug}`,
    datePublished: new Date().toISOString().slice(0, 10),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="paper-frame">
        <Header />
        <ComparerClient competitor={competitor} otherCompetitors={all.filter((c) => c.slug !== competitor.slug)} lang={lang} />
      </div>
      <Footer />
    </>
  );
}
