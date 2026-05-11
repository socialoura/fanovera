import type { Metadata } from "next";
import TwitchPageClient from "./TwitchPageClient";

export const metadata: Metadata = {
  title: "Fanovera — Followers Twitch ciblés & whitehat",
  description:
    "Campagnes de promotion ciblée pour gagner de vrais followers Twitch. Méthode conforme aux CGU, croissance progressive, sans mot de passe.",
};

export default function TwitchPage() {
  return <TwitchPageClient />;
}
