import type { Metadata } from "next";
import TiktokPageClient from "./TiktokPageClient";

export const metadata: Metadata = {
  title: "Fanovera — Abonnés TikTok réels & actifs",
  description:
    "Followers TikTok 100% réels et actifs : croissance progressive, livraison en 60 secondes, garantie à vie. Sans mot de passe, conforme RGPD.",
};

export default function TiktokPage() {
  return <TiktokPageClient />;
}
