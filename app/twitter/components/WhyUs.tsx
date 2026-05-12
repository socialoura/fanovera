import NetIcon from "../../components/NetIcon";
import XSprinkle from "./XSprinkle";

export default function WhyUs() {
  const items = [
    { i: "ðŸŽ¯", title: "Audience ciblÃ©e", body: "Notre IA expose votre profil X Ã  une audience qualifiÃ©e qui interagit avec votre thÃ©matique." },
    { i: "ðŸ›¡", title: "Compte preserve", body: "Aucun acces au compte, aucune publication a votre place, aucune action directe sur votre profil." },
    { i: "ðŸ”’", title: "Sans mot de passe", body: "Juste votre @ public. Aucun acces au compte n'est demande." },
    { i: "â†©", title: "RÃ©sultats garantis", body: "Si l'objectif n'est pas atteint, on prolonge la campagne gratuitement. Remboursement sous 30 jours." },
  ];
  return (
    <section style={{ padding: "clamp(48px, 7vw, 80px) 0", background: "var(--frame)", position: "relative", overflow: "hidden" }}>
      <XSprinkle count={5} seed={1} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "white", color: "var(--x-ink)", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", borderRadius: 999, marginBottom: 20, textTransform: "uppercase", border: "1px solid var(--line)" }}>
            <NetIcon kind="twitter" color="var(--x-ink)" size={13} /> Pourquoi Fanovera
          </div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.2vw, 56px)", margin: 0 }}>
            Une croissance X<br /><span className="squiggle x">progressive</span> et soignee.
          </h2>
        </div>
        <div className="why-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {items.map((it, i) => (
            <div key={i} className="why-card" style={{ padding: 20 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, rgba(0,0,0,0.08), rgba(29,155,240,0.18))", display: "grid", placeItems: "center", fontSize: 18, marginBottom: 12 }}>
                {it.i}
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>{it.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
