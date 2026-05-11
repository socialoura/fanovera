"use client";

import { useState } from "react";
import NetIcon from "../../components/NetIcon";
import FbSprinkle from "./FbSprinkle";

export default function FbFAQ() {
  const [open, setOpen] = useState(0);
  const items = [
    {
      q: "Comment les likes de ma page sont-ils générés ?",
      a: "Nos campagnes exposent votre page Facebook à une audience qualifiée correspondant à votre thématique, via des techniques de promotion ciblée. Les likes proviennent de vraies personnes intéressées par votre activité. Aucun bot, aucune ferme à clics, aucune automation interdite.",
    },
    {
      q: "Est-ce que je dois vous donner mon mot de passe ?",
      a: "Jamais. On a uniquement besoin du lien public de votre page Facebook. Aucun accès au compte administrateur, aucun risque.",
    },
    {
      q: "Ma page risque-t-elle d'être pénalisée ?",
      a: "Non. Notre méthode est 100% conforme aux conditions d'utilisation de Facebook. Aucune automation interdite, aucune action sur votre compte. La montée des likes reste progressive et naturelle.",
    },
    {
      q: "En combien de temps les likes arrivent ?",
      a: "La campagne démarre sous quelques minutes après le paiement. Les premiers likes arrivent sous 24 à 48h, puis la campagne s'étale sur 7 à 30 jours selon le pack, pour un rythme 100% naturel.",
    },
    {
      q: "Et si je perds des likes après la campagne ?",
      a: "Garantie de résultats : si le compteur baisse significativement pendant la période de garantie, on relance une campagne complémentaire sans frais supplémentaires.",
    },
    {
      q: "Est-ce que ça booste la portée organique ?",
      a: "Oui indirectement : une page avec plus de likes et de followers est mieux distribuée par l'algorithme Facebook, ce qui augmente la portée organique de vos publications.",
    },
  ];
  return (
    <section id="faq" style={{ padding: "80px 0", background: "var(--frame)", position: "relative", overflow: "hidden" }}>
      <FbSprinkle count={5} seed={5} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "white", color: "var(--fb-blue)", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", borderRadius: 999, marginBottom: 20, textTransform: "uppercase", border: "1px solid var(--line)" }}>
            <NetIcon kind="facebook" color="var(--fb-blue)" size={13} /> FAQ
          </div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.2vw, 56px)", margin: 0 }}>
            Vos questions, <span className="squiggle fb">nos réponses</span>.
          </h2>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {items.map((it, i) => (
            <div key={i} className={`faq-item fb ${open === i ? "open" : ""}`}>
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
