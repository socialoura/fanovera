import type { Metadata } from "next";
import InstagramPageClient from "./InstagramPageClient";

export const metadata: Metadata = {
  title: "Fanovera — Abonnés Instagram réels & actifs",
  description:
    "Abonnés Instagram 100% réels et actifs : croissance progressive, livraison en 60 secondes, garantie à vie. Sans mot de passe, conforme RGPD.",
};

export default function InstagramPage() {
  return <InstagramPageClient />;
}
