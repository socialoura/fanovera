import type { Metadata } from "next";
import FacebookPageClient from "./FacebookPageClient";

export const metadata: Metadata = {
  title: "Fanovera - Visibilite Facebook ciblee",
  description:
    "Campagnes de visibilite Facebook avec audience ciblee, deploiement progressif, paiement securise et aucun acces administrateur demande.",
};

export default function FacebookPage() {
  return <FacebookPageClient />;
}
