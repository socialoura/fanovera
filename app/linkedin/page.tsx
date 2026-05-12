import type { Metadata } from "next";
import LinkedinPageClient from "./LinkedinPageClient";

export const metadata: Metadata = {
  title: "Fanovera - Visibilite LinkedIn ciblee",
  description:
    "Campagnes de visibilite LinkedIn avec audience ciblee, deploiement progressif, paiement securise et aucun acces au compte demande.",
};

export default function LinkedinPage() {
  return <LinkedinPageClient />;
}
