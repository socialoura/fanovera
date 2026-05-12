import type { Metadata } from "next";
import InstagramPageClient from "./InstagramPageClient";

export const metadata: Metadata = {
  title: "Fanovera — Croissance Instagram ciblée",
  description:
    "Campagnes de visibilité Instagram avec audience ciblée, déploiement progressif, paiement sécurisé et aucun accès au compte demandé.",
};

export default function InstagramPage() {
  return <InstagramPageClient />;
}
