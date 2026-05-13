import JsonLd from "../components/JsonLd";
import { getMarketingMode } from "../lib/marketingMode.server";
import { generateLocalizedMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";
import YoutubePageClient from "./YoutubePageClient";

export const generateMetadata = () => generateLocalizedMetadata("youtube");

export default async function YoutubePage() {
  const [locale, marketingMode] = await Promise.all([getRequestLocale(), getMarketingMode()]);
  return (
    <>
      <JsonLd data={productJsonLd("youtube", locale, marketingMode)} />
      <YoutubePageClient />
    </>
  );
}
