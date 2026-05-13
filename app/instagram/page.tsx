import InstagramPageClient from "./InstagramPageClient";
import JsonLd from "../components/JsonLd";
import { getMarketingMode } from "../lib/marketingMode.server";
import { generateLocalizedMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";

export const generateMetadata = () => generateLocalizedMetadata("instagram");

export default async function InstagramPage() {
  const [locale, marketingMode] = await Promise.all([getRequestLocale(), getMarketingMode()]);
  return (
    <>
      <JsonLd data={productJsonLd("instagram", locale, marketingMode)} />
      <InstagramPageClient />
    </>
  );
}
