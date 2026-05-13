import JsonLd from "../components/JsonLd";
import { getMarketingMode } from "../lib/marketingMode.server";
import { generateLocalizedMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";
import TwitchPageClient from "./TwitchPageClient";

export const generateMetadata = () => generateLocalizedMetadata("twitch");

export default async function TwitchPage() {
  const [locale, marketingMode] = await Promise.all([getRequestLocale(), getMarketingMode()]);
  return (
    <>
      <JsonLd data={productJsonLd("twitch", locale, marketingMode)} />
      <TwitchPageClient />
    </>
  );
}
