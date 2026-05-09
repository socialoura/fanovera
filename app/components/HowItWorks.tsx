type StepKind = "analyze" | "target" | "growth";

function StepIcon({ kind }: { kind: StepKind }) {
  switch (kind) {
    case "analyze":
      return (
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="6" />
          <path d="M16 16l5 5" />
          <path d="M8 11h6M11 8v6" />
        </svg>
      );
    case "target":
      return (
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="14" cy="14" r="9" />
          <circle cx="14" cy="14" r="5" />
          <circle cx="14" cy="14" r="1.5" fill="white" />
        </svg>
      );
    case "growth":
      return (
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 22l6-6 4 4 8-10" />
          <path d="M16 10h6v6" />
        </svg>
      );
  }
}

export default function HowItWorks() {
  const steps: { num: string; title: string; body: string; icon: StepKind; color: string }[] = [
    {
      num: "01",
      title: "L'IA lit votre contenu",
      body: "Notre modèle analyse votre voix, votre niche, vos visuels. Il établit une fiche éditoriale unique pour comprendre exactement à qui vous parlez.",
      icon: "analyze",
      color: "var(--primary)",
    },
    {
      num: "02",
      title: "On trouve les bonnes audiences",
      body: "Sur les 8 plateformes, on identifie les vrais utilisateurs susceptibles d'aimer votre contenu. Centres d'intérêt, comportements, affinités.",
      icon: "target",
      color: "var(--orange)",
    },
    {
      num: "03",
      title: "Croissance naturelle, qui tient",
      body: "On expose votre contenu à ces audiences via les voies natives de chaque plateforme. La courbe monte en pente douce, et l'algorithme prend le relais.",
      icon: "growth",
      color: "var(--green)",
    },
  ];
  return (
    <section id="how" className="section">
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "var(--primary-soft)",
              color: "var(--primary)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              borderRadius: 999,
              marginBottom: 20,
              textTransform: "uppercase",
            }}
          >
            ★ Comment ça marche
          </div>
          <h2 className="display" style={{ fontSize: "clamp(36px, 4.6vw, 60px)", margin: 0 }}>
            Trois étapes pour des résultats <span className="squiggle">durables</span>.
          </h2>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}
          className="feat-grid"
        >
          {steps.map((s, i) => (
            <div key={i} className="step-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: s.color,
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <StepIcon kind={s.icon} />
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-caveat), Caveat, cursive",
                    fontSize: 26,
                    fontWeight: 600,
                    color: s.color,
                    opacity: 0.5,
                  }}
                >
                  {s.num}
                </div>
              </div>
              <h3
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  margin: "0 0 8px",
                  letterSpacing: "-0.01em",
                }}
              >
                {s.title}
              </h3>
              <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
