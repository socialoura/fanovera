"use client";

import { useState } from "react";
import NetIcon from "../../components/NetIcon";
import YtSprinkle from "./YtSprinkle";

export default function YtFAQ() {
  const [open, setOpen] = useState(0);
  const items = [
    {
      q: "Comment vos vues sont-elles générées ?",
      a: "Nos campagnes exposent votre vidéo YouTube à une audience qualifiée correspondant à votre thématique, via des techniques de promotion ciblée. Les vues sont issues de vraies personnes qui regardent réellement votre contenu. Aucun bot, aucune ferme à clics, aucune automation interdite.",
    },
    {
      q: "Est-ce que je dois vous donner mon mot de passe ?",
      a: "Jamais. On a uniquement besoin du lien public de votre vidéo YouTube. Aucun accès au compte, aucun risque.",
    },
    {
      q: "Ma vidéo ou ma chaîne risque-t-elle d'être pénalisée ?",
      a: "Non. Notre méthode est 100% conforme aux conditions d'utilisation de YouTube. Aucune automation interdite, aucune action sur votre compte. La montée des vues reste progressive et naturelle, sans éveiller l'algo.",
    },
    {
      q: "En combien de temps les vues arrivent ?",
      a: "La campagne démarre sous quelques minutes après le paiement. Les premières vues arrivent généralement sous 24h, puis la livraison s'étale sur 3 à 30 jours selon le pack, pour un rythme 100% naturel.",
    },
    {
      q: "Et si certaines vues disparaissent après ?",
      a: "Garantie de résultats : si le compteur de vues baisse de manière significative pendant la période de garantie, on relance une campagne complémentaire sans frais supplémentaires.",
    },
    {
      q: "Puis-je commander plusieurs campagnes ?",
      a: "Oui. Beaucoup de créateurs enchaînent les campagnes par paliers pour une croissance encore plus régulière et naturelle dans le temps.",
    },
  ];
  return (
    <section id="faq" style={{ padding: "80px 0", background: "var(--frame)", position: "relative", overflow: "hidden" }}>
      <YtSprinkle count={5} seed={5} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: "white",
              color: "var(--yt-red)",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.06em",
              borderRadius: 999,
              marginBottom: 20,
              textTransform: "uppercase",
              border: "1px solid var(--line)",
            }}
          >
            <NetIcon kind="youtube" color="var(--yt-red)" size={13} /> FAQ
          </div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.2vw, 56px)", margin: 0 }}>
            Vos questions, <span className="squiggle yt">nos réponses</span>.
          </h2>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {items.map((it, i) => (
            <div key={i} className={`faq-item yt ${open === i ? "open" : ""}`}>
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
