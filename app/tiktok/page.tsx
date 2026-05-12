import type { Metadata } from "next";
import TiktokPageClient from "./TiktokPageClient";

export const metadata: Metadata = {
  title: "Fanovera - Visibilite TikTok ciblee",
  description:
    "Campagnes de visibilite TikTok avec audience ciblee, deploiement progressif, paiement securise et aucun acces au compte demande.",
};

export default function TiktokPage() {
  return <TiktokPageClient />;
}
