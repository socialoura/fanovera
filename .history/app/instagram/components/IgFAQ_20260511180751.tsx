"use client";

import { useState } from "react";
import NetIcon from "../../components/NetIcon";
import IgSprinkle from "./IgSprinkle";

export default function IgFAQ() {
  const [open, setOpen] = useState(0);
  const items = [
    {
      q: "Comment vos abonnés sont-ils générés ?",
      a: "Nos campagnes exposent votre profil Instagram à une audience qualifiée correspondant à votre niche, via des techniques de promotion ciblée. Les abonnés gagnés sont de vraies personnes, intéressées par votre contenu. Aucun bot, aucune ferme à clics, aucune automation interdite.",
    },
    {
      q: "Est-ce que je dois vous donner mon mot de passe ?",
      a: "Jamais. On a uniquement besoin de votre nom d'utilisateur Instagram public. Aucun accès au compte, aucun risque.",
    },
    {
      q: "Mon compte risque-t-il d'être suspendu ?",
      a: "Non. Notre méthode est 100% conforme aux conditions d'utilisation d'Instagram. Aucune automation interdite, aucune action sur votre compte. La croissance reste progressive et naturelle.",
    },
    {
      q: "En combien de temps les premiers résultats arrivent ?",
      a: "La campagne démarre sous quelques minutes après le paiement. Les premiers abonnés arrivent généralement sous 24 à 48h, puis la campagne s'étale sur 7 à 30 jours selon le pack, pour une croissance 100% naturelle.",
    },
    {
      q: "Et si je perds des abonnés après la campagne ?",
      a: "Garantie de résultats : si votre nombre d'abonnés baisse de manière significative pendant la période de garantie, on relance une campagne complémentaire sans frais supplémentaires.",
    },
    {
      q: "Puis-je commander plusieurs campagnes ?",
      a: "Oui. Beaucoup de clients enchaînent les campagnes par paliers pour une croissance encore plus régulière et naturelle dans le temps.",
    },
  ];
  return (
    <section
      id="faq"
      style={{
        padding: "80px 0",
        background: "var(--frame)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <IgSprinkle count={5} seed={5} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: "white",
              color: "var(--ig-2)",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.06em",
              borderRadius: 999,
              marginBottom: 20,
              textTransform: "uppercase",
              border: "1px solid var(--line)",
            }}
          >
            <NetIcon kind="instagram" color="var(--ig-2)" size={13} /> FAQ
          </div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.2vw, 56px)", margin: 0 }}>
            Vos questions, <span className="squiggle ig">nos réponses</span>.
          </h2>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {items.map((it, i) => (
            <div
              key={i}
              className={`faq-item ig ${open === i ? "open" : ""}`}
            >
              <button
                className="faq-q"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                <span>{it.q}</span>
                <span className="faq-icon">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M6 2v8M2 6h8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
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
