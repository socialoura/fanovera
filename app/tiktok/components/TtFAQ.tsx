"use client";

import { useState } from "react";
import NetIcon from "../../components/NetIcon";
import TtSprinkle from "./TtSprinkle";

export default function TtFAQ() {
  const [open, setOpen] = useState(0);
  const items = [
    { q: "Les followers sont-ils réels ?", a: "Oui, à 100%. Notre IA identifie de vrais utilisateurs TikTok susceptibles d'aimer votre contenu et leur expose votre profil. Aucun bot, aucune ferme à clics." },
    { q: "Est-ce que je dois vous donner mon mot de passe ?", a: "Jamais. On a uniquement besoin de votre @ TikTok public. Aucun accès au compte, aucun risque." },
    { q: "Mon compte risque-t-il d'être suspendu ?", a: "Non. La croissance est progressive et naturelle, conforme aux conditions d'utilisation de TikTok. Plus de 2,4M de comptes accompagnés depuis 2022." },
    { q: "En combien de temps les followers arrivent ?", a: "Le démarrage est instantané (sous 60 secondes). La livraison complète s'étale sur 1 à 7 jours selon le pack, pour un effet 100% naturel." },
    { q: "Que se passe-t-il en cas de chute ?", a: "Garantie à vie : on recharge gratuitement et automatiquement si vous perdez des followers issus de notre service, sans limite de temps." },
    { q: "Est-ce que ça booste mes vues TikTok ?", a: "Oui indirectement : un compte avec plus de followers est plus poussé par l'algo TikTok, ce qui augmente la portée organique de vos vidéos." },
  ];
  return (
    <section id="faq" style={{ padding: "80px 0", background: "var(--frame)", position: "relative", overflow: "hidden" }}>
      <TtSprinkle count={5} seed={5} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "white", color: "var(--tt-red)", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", borderRadius: 999, marginBottom: 20, textTransform: "uppercase", border: "1px solid var(--line)" }}>
            <NetIcon kind="tiktok" color="var(--tt-red)" size={13} /> FAQ
          </div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.2vw, 56px)", margin: 0 }}>
            Vos questions, <span className="squiggle tt">nos réponses</span>.
          </h2>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {items.map((it, i) => (
            <div key={i} className={`faq-item tt ${open === i ? "open" : ""}`}>
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
