import type { Metadata } from "next";
import SpotifyPageClient from "./SpotifyPageClient";

export const metadata: Metadata = {
  title: "Fanovera - Visibilite Spotify ciblee",
  description:
    "Campagnes de visibilite Spotify avec audience ciblee, deploiement progressif, paiement securise et aucun acces artiste demande.",
};

export default function SpotifyPage() {
  return <SpotifyPageClient />;
}
