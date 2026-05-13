import type { Metadata } from "next";
import { headers } from "next/headers";
import { Plus_Jakarta_Sans, Caveat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PostHogProvider from "./PostHogProvider";
import ChatWidget from "./components/ChatWidget";
import JsonLd from "./components/JsonLd";
import { I18nProvider } from "./i18n/I18nProvider";
import { MarketingModeProvider } from "./marketing/MarketingModeProvider";
import { getMarketingMode } from "./lib/marketingMode.server";
import { DEFAULT_LOCALE, buildPageMetadata, organizationJsonLd, websiteJsonLd } from "./lib/siteMetadata";
import type { SupportedLocale } from "./i18n/types";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = buildPageMetadata("home", DEFAULT_LOCALE);

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const initialLocale = (requestHeaders.get("x-fanovera-locale") || DEFAULT_LOCALE) as SupportedLocale;
  const marketingMode = await getMarketingMode();

  return (
    <html lang={initialLocale} className={`${jakarta.variable} ${caveat.variable}`}>
      <body>
        <I18nProvider initialLocale={initialLocale}>
          <MarketingModeProvider initialMode={marketingMode}>
            <JsonLd data={organizationJsonLd()} />
            <JsonLd data={websiteJsonLd(initialLocale)} />
            <PostHogProvider>{children}</PostHogProvider>
            <ChatWidget />
            <Analytics />
            <SpeedInsights />
          </MarketingModeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
