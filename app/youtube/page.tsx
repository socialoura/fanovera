import type { Metadata } from "next";
import YoutubePageClient from "./YoutubePageClient";

export const metadata: Metadata = {
  title: "Fanovera - Visibilite YouTube ciblee",
  description:
    "Campagnes de visibilite YouTube avec audience ciblee, deploiement progressif, paiement securise et aucun acces au compte demande.",
};

export default function YoutubePage() {
  return <YoutubePageClient />;
}
