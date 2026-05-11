import type { Metadata } from "next";
import LinkedinPageClient from "./LinkedinPageClient";

export const metadata: Metadata = {
  title: "Fanovera — Followers LinkedIn ciblés & whitehat",
  description:
    "Campagnes de promotion ciblée pour gagner de vrais followers LinkedIn. Méthode conforme aux CGU, croissance progressive, sans mot de passe.",
};

export default function LinkedinPage() {
  return <LinkedinPageClient />;
}
