import JsonLd from "../components/JsonLd";
import { getMarketingMode } from "../lib/marketingMode.server";
import { generateLocalizedMetadata, getRequestLocale } from "../lib/metadata";
import { productJsonLd } from "../lib/siteMetadata";
import LinkedinPageClient from "./LinkedinPageClient";

export const generateMetadata = () => generateLocalizedMetadata("linkedin");

export default async function LinkedinPage() {
  const [locale, marketingMode] = await Promise.all([getRequestLocale(), getMarketingMode()]);
  return (
    <>
      <JsonLd data={productJsonLd("linkedin", locale, marketingMode)} />
      <LinkedinPageClient />
    </>
  );
}
