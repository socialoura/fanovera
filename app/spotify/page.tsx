import type { Metadata } from "next";
import SpotifyPageClient from "./SpotifyPageClient";

export const metadata: Metadata = {
  title: "Fanovera — Écoutes Spotify ciblées & whitehat",
  description:
    "Campagnes de promotion ciblée pour gagner de vraies écoutes Spotify. Méthode conforme aux CGU, croissance progressive, sans mot de passe.",
};

export default function SpotifyPage() {
  return <SpotifyPageClient />;
}
