import type { Metadata } from "next";
import TwitchPageClient from "./TwitchPageClient";

export const metadata: Metadata = {
  title: "Fanovera - Visibilite Twitch ciblee",
  description:
    "Campagnes de visibilite Twitch avec audience ciblee, deploiement progressif, paiement securise et aucun acces au compte demande.",
};

export default function TwitchPage() {
  return <TwitchPageClient />;
}
