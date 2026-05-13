import JsonLd from "../components/JsonLd";
import { getMarketingMode } from "../lib/marketingMode.server";
import { generateLocalizedMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";
import SpotifyPageClient from "./SpotifyPageClient";

export const generateMetadata = () => generateLocalizedMetadata("spotify");

export default async function SpotifyPage() {
  const [locale, marketingMode] = await Promise.all([getRequestLocale(), getMarketingMode()]);
  return (
    <>
      <JsonLd data={productJsonLd("spotify", locale, marketingMode)} />
      <SpotifyPageClient />
    </>
  );
}
