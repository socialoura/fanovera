import JsonLd from "../components/JsonLd";
import { getMarketingMode } from "../lib/marketingMode.server";
import { generateLocalizedMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";
import FacebookPageClient from "./FacebookPageClient";

export const generateMetadata = () => generateLocalizedMetadata("facebook");

export default async function FacebookPage() {
  const [locale, marketingMode] = await Promise.all([getRequestLocale(), getMarketingMode()]);
  return (
    <>
      <JsonLd data={productJsonLd("facebook", locale, marketingMode)} />
      <FacebookPageClient />
    </>
  );
}
