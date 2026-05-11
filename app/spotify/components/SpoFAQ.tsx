"use client";

import { useState } from "react";
import NetIcon from "../../components/NetIcon";
import SpoSprinkle from "./SpoSprinkle";

export default function SpoFAQ() {
  const [open, setOpen] = useState(0);
  const items = [
    {
      q: "Comment vos écoutes sont-elles générées ?",
      a: "Nos campagnes exposent votre morceau à une audience qualifiée qui correspond à votre genre musical, via des techniques de promotion ciblée. Les écoutes proviennent de vraies personnes qui écoutent réellement votre son. Aucun bot, aucune ferme à streams, aucune automation interdite.",
    },
    {
      q: "Est-ce que je dois vous donner mon mot de passe ?",
      a: "Jamais. On a uniquement besoin du lien Spotify public de votre morceau. Aucun accès à votre compte Spotify for Artists, aucun risque.",
    },
    {
      q: "Mon profil artiste risque-t-il d'être pénalisé ?",
      a: "Non. Notre méthode est conforme aux conditions d'utilisation de Spotify. La montée des écoutes reste progressive et naturelle, sans éveiller l'algo de détection de streaming artificiel.",
    },
    {
      q: "Les écoutes comptent-elles pour les royalties ?",
      a: "Oui, ce sont des écoutes réelles depuis de vrais comptes Spotify (gratuits ou Premium). Elles sont comptabilisées normalement par Spotify et remontent dans vos statistiques Spotify for Artists.",
    },
    {
      q: "En combien de temps les écoutes arrivent ?",
      a: "La campagne démarre sous quelques minutes après le paiement. Les premières écoutes arrivent sous 24h, puis la livraison s'étale sur 3 à 30 jours selon le pack, pour un rythme 100% naturel.",
    },
    {
      q: "Et si certaines écoutes disparaissent ?",
      a: "Garantie de résultats : si le compteur baisse significativement pendant la période de garantie, on relance une campagne complémentaire sans frais supplémentaires.",
    },
  ];
  return (
    <section id="faq" style={{ padding: "80px 0", background: "var(--frame)", position: "relative", overflow: "hidden" }}>
      <SpoSprinkle count={5} seed={5} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "white", color: "var(--spo-green-2)", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", borderRadius: 999, marginBottom: 20, textTransform: "uppercase", border: "1px solid var(--line)" }}>
            <NetIcon kind="spotify" color="var(--spo-green-2)" size={13} /> FAQ
          </div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.2vw, 56px)", margin: 0 }}>
            Vos questions, <span className="squiggle spo">nos réponses</span>.
          </h2>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {items.map((it, i) => (
            <div key={i} className={`faq-item spo ${open === i ? "open" : ""}`}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                <span>{it.q}</span>
                <span className="faq-icon">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
              <div className="faq-a">{it.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
