import type { Metadata } from "next";
import FacebookPageClient from "./FacebookPageClient";

export const metadata: Metadata = {
  title: "Fanovera — Likes Facebook ciblés & whitehat",
  description:
    "Campagnes de promotion ciblée pour gagner de vrais likes sur votre page Facebook. Méthode conforme aux CGU, croissance progressive, sans mot de passe.",
};

export default function FacebookPage() {
  return <FacebookPageClient />;
}
