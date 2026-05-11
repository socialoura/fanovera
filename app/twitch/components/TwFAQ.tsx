"use client";

import { useState } from "react";
import NetIcon from "../../components/NetIcon";
import TwSprinkle from "./TwSprinkle";

export default function TwFAQ() {
  const [open, setOpen] = useState(0);
  const items = [
    {
      q: "Comment vos followers sont-ils générés ?",
      a: "Nos campagnes exposent votre chaîne Twitch à une audience qualifiée de gamers et streamers correspondant à votre niche, via des techniques de promotion ciblée. Les followers gagnés sont de vrais comptes Twitch. Aucun bot, aucune automation interdite.",
    },
    {
      q: "Est-ce que je dois vous donner mon mot de passe ?",
      a: "Jamais. On a uniquement besoin de votre nom de chaîne Twitch (twitch.tv/votrechaine). Aucun accès au compte, aucun risque.",
    },
    {
      q: "Ma chaîne risque-t-elle d'être bannie ?",
      a: "Non. Notre méthode est 100% conforme aux conditions d'utilisation de Twitch. Aucune automation interdite, aucune action sur votre compte. La croissance reste progressive et naturelle, sans déclencher les systèmes anti-inflation.",
    },
    {
      q: "Cela m'aide-t-il à devenir Affilié ou Partenaire ?",
      a: "Oui. Le palier Affilié requiert 50 followers (entre autres critères) — un pack peut aider à franchir ce seuil rapidement. Pour le Partenariat, les followers comptent aussi comme signal de traction pour Twitch.",
    },
    {
      q: "En combien de temps les followers arrivent ?",
      a: "La campagne démarre sous quelques minutes après le paiement. Les premiers followers arrivent sous 24 à 48h, puis la livraison s'étale sur 7 à 30 jours selon le pack, pour un rythme 100% naturel.",
    },
    {
      q: "Et si je perds des followers après ?",
      a: "Garantie de résultats : si votre nombre de followers baisse significativement pendant la période de garantie, on relance une campagne complémentaire sans frais supplémentaires.",
    },
  ];
  return (
    <section id="faq" style={{ padding: "80px 0", background: "var(--frame)", position: "relative", overflow: "hidden" }}>
      <TwSprinkle count={5} seed={5} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "white", color: "var(--tw-purple)", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", borderRadius: 999, marginBottom: 20, textTransform: "uppercase", border: "1px solid var(--line)" }}>
            <NetIcon kind="twitch" color="var(--tw-purple)" size={13} /> FAQ
          </div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.2vw, 56px)", margin: 0 }}>
            Vos questions, <span className="squiggle tw">nos réponses</span>.
          </h2>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {items.map((it, i) => (
            <div key={i} className={`faq-item tw ${open === i ? "open" : ""}`}>
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
