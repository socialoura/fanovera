import JsonLd from "../components/JsonLd";
import { getMarketingMode } from "../lib/marketingMode.server";
import { generateLocalizedMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";
import TwitterPageClient from "./TwitterPageClient";

export const generateMetadata = () => generateLocalizedMetadata("twitter");

export default async function TwitterPage() {
  const [locale, marketingMode] = await Promise.all([getRequestLocale(), getMarketingMode()]);
  return (
    <>
      <JsonLd data={productJsonLd("twitter", locale, marketingMode)} />
      <TwitterPageClient />
    </>
  );
}
