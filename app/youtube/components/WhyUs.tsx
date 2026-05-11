import NetIcon from "../../components/NetIcon";
import YtSprinkle from "./YtSprinkle";

export default function WhyUs() {
  const items = [
    {
      i: "🎯",
      title: "Audience ciblée",
      body: "Notre IA expose votre vidéo YouTube à une audience qualifiée intéressée par votre thématique.",
    },
    {
      i: "🛡",
      title: "Conforme aux CGU",
      body: "Aucune automation interdite, aucun bot. Méthode 100% conforme aux conditions d'utilisation de YouTube.",
    },
    {
      i: "🔒",
      title: "Sans mot de passe",
      body: "Juste le lien public de votre vidéo. Aucun accès au compte, aucun risque pour votre chaîne.",
    },
    {
      i: "↩",
      title: "Résultats garantis",
      body: "Si l'objectif n'est pas atteint, on prolonge la campagne gratuitement. Remboursement sous 30 jours.",
    },
  ];
  return (
    <section style={{ padding: "clamp(48px, 7vw, 80px) 0", background: "var(--frame)", position: "relative", overflow: "hidden" }}>
      <YtSprinkle count={5} seed={1} />
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
            <NetIcon kind="youtube" color="var(--yt-red)" size={13} /> Pourquoi Fanovera
          </div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.2vw, 56px)", margin: 0 }}>
            Des vues YouTube
            <br />
            <span className="squiggle yt">whitehat</span>, sans triche.
          </h2>
        </div>
        <div className="why-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {items.map((it, i) => (
            <div key={i} className="why-card" style={{ padding: 20 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, rgba(255,0,0,0.15), rgba(204,0,0,0.15))",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                  marginBottom: 12,
                }}
              >
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
