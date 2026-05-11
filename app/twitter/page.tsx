import type { Metadata } from "next";
import TwitterPageClient from "./TwitterPageClient";

export const metadata: Metadata = {
  title: "Fanovera — Followers X (Twitter) ciblés & whitehat",
  description:
    "Campagnes de promotion ciblée pour gagner de vrais followers X. Méthode conforme aux CGU, croissance progressive, sans mot de passe.",
};

export default function TwitterPage() {
  return <TwitterPageClient />;
}
