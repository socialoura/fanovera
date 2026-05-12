"use client";

import { useState } from "react";
import NetIcon from "../../components/NetIcon";
import TwSprinkle from "./TwSprinkle";

export default function TwFAQ() {
  const [open, setOpen] = useState(0);
  const items = [
    {
      q: "Comment fonctionne la mise en avant ?",
      a: "Nous preparons une campagne de visibilite autour de votre chaine Twitch et de votre thematique. L objectif est de presenter votre contenu a une audience plus pertinente, avec un rythme progressif et mesure.",
    },
    {
      q: "Est-ce que je dois vous donner mon mot de passe ?",
      a: "Jamais. On a uniquement besoin de votre nom de chaine Twitch public. Aucun acces au compte n est demande.",
    },
    {
      q: "Est-ce que vous agissez sur mon compte ?",
      a: "Non. Nous ne nous connectons pas a votre compte et nous ne publions rien a votre place. Le service s appuie sur une mise en avant externe et progressive.",
    },
    {
      q: "Quand la campagne demarre-t-elle ?",
      a: "La preparation demarre apres confirmation du paiement. Le deploiement est progressif et peut s etaler sur plusieurs jours selon le volume choisi.",
    },
    {
      q: "Que se passe-t-il si le volume n est pas atteint ?",
      a: "Notre support verifie la campagne et peut prolonger la mise en avant sans frais supplementaires lorsque le volume prevu n est pas atteint.",
    },
    {
      q: "Cela peut-il aider ma chaine Twitch ?",
      a: "Oui. Une campagne progressive peut renforcer les signaux de traction autour de votre chaine, en complement de votre contenu et de votre regularite de stream.",
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
            Vos questions, <span className="squiggle tw">nos reponses</span>.
          </h2>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {items.map((it, i) => (
            <div key={i} className={"faq-item tw" + (open === i ? " open" : "")}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                <span>{it.q}</span>
                <span className="faq-icon"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></span>
              </button>
              <div className="faq-a">{it.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}