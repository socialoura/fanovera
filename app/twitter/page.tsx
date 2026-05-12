import type { Metadata } from "next";
import TwitterPageClient from "./TwitterPageClient";

export const metadata: Metadata = {
  title: "Fanovera - Visibilite X ciblee",
  description:
    "Campagnes de visibilite X avec audience ciblee, deploiement progressif, paiement securise et aucun acces au compte demande.",
};

export default function TwitterPage() {
  return <TwitterPageClient />;
}
