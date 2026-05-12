import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Caveat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PostHogProvider from "./PostHogProvider";
import ChatWidget from "./components/ChatWidget";
import { I18nProvider } from "./i18n/I18nProvider";
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

export const metadata: Metadata = {
  title: "Fanovera - Presence en ligne accompagnee par IA",
  description:
    "Fanovera aide a structurer votre presence en ligne avec audit, strategie, calendrier de contenu et suivi clair.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${caveat.variable}`}>
      <body>
        <I18nProvider>
          <PostHogProvider>{children}</PostHogProvider>
          <ChatWidget />
          <Analytics />
          <SpeedInsights />
        </I18nProvider>
      </body>
    </html>
  );
}
