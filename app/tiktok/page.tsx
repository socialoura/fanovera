import JsonLd from "../components/JsonLd";
import { getMarketingMode } from "../lib/marketingMode.server";
import { generateLocalizedMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";
import TiktokPageClient from "./TiktokPageClient";

export const generateMetadata = () => generateLocalizedMetadata("tiktok");

export default async function TiktokPage() {
  const [locale, marketingMode] = await Promise.all([getRequestLocale(), getMarketingMode()]);
  return (
    <>
      <JsonLd data={productJsonLd("tiktok", locale, marketingMode)} />
      <TiktokPageClient />
    </>
  );
}
