import type { Metadata } from "next";
import YoutubePageClient from "./YoutubePageClient";

export const metadata: Metadata = {
  title: "Fanovera — Croissance YouTube ciblée & whitehat",
  description:
    "Campagnes de promotion ciblée pour gagner de vrais abonnés YouTube. Méthode 100% conforme aux CGU, croissance progressive, sans mot de passe.",
};

export default function YoutubePage() {
  return <YoutubePageClient />;
}
