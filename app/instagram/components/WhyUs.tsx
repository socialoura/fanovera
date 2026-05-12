import NetIcon from "../../components/NetIcon";
import IgSprinkle from "./IgSprinkle";

export default function WhyUs() {
  const items = [
    {
      i: "🎯",
      title: "Audience ciblée",
      body: "Notre IA aide à définir une audience cohérente avec votre niche et vos contenus.",
    },
    {
      i: "🛡",
      title: "Compte préservé",
      body: "Aucun accès au compte, aucune publication à votre place, aucune action directe sur votre profil.",
    },
    {
      i: "🔒",
      title: "Sans mot de passe",
      body: "Juste votre nom d'utilisateur public pour préparer la campagne de visibilité.",
    },
    {
      i: "↩",
      title: "Suivi inclus",
      body: "Si le volume prévu n'est pas atteint, notre support vérifie et prolonge la campagne.",
    },
  ];
  return (
    <section
      style={{
        padding: "clamp(48px, 7vw, 80px) 0",
        background: "var(--frame)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <IgSprinkle count={5} seed={1} />
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
            <NetIcon kind="instagram" color="var(--ig-2)" size={13} /> Pourquoi Fanovera
          </div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.2vw, 56px)", margin: 0 }}>
            Une croissance Instagram
            <br />
            <span className="squiggle ig">progressive</span> et soignée.
          </h2>
        </div>
        <div
          className="why-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}
        >
          {items.map((it, i) => (
            <div key={i} className="why-card" style={{ padding: 20 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background:
                    "linear-gradient(135deg, rgba(250,126,30,0.15), rgba(214,41,118,0.15))",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                  marginBottom: 12,
                }}
              >
                {it.i}
              </div>
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                }}
              >
                {it.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "var(--ink-2)",
                  lineHeight: 1.5,
                }}
              >
                {it.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
