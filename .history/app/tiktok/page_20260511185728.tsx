import type { Metadata } from "next";
import TiktokPageClient from "./TiktokPageClient";

export const metadata: Metadata = {
  title: "Fanovera — Croissance TikTok ciblée & whitehat",
  description:
    "Campagnes de promotion ciblée pour gagner de vrais abonnés TikTok. Méthode 100% conforme aux CGU, croissance progressive, sans mot de passe.",
};

export default function TiktokPage() {
  return <TiktokPageClient />;
}
