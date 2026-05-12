import NetIcon from "./NetIcon";
import { NETWORKS, type NetworkId } from "../lib/networks";

export default function Testimonials() {
  const testimonials: { q: string; n: string; r: string; net: NetworkId }[] = [
    {
      q: "Fanovera m'a aidee a clarifier ma ligne editoriale et a organiser mes sorties sans courir apres les chiffres.",
      n: "Lea Marchetti",
      r: "Musicienne · strategie de lancement",
      net: "spotify",
    },
    {
      q: "L'audit etait concret : quoi publier, quand le publier, et comment mieux raconter mon travail.",
      n: "Thomas Durand",
      r: "Photographe · calendrier contenu",
      net: "instagram",
    },
    {
      q: "On a pose une vraie methode autour de mes formats courts. Le suivi est simple, lisible et utile.",
      n: "Sofia Ramos",
      r: "Creatrice · accompagnement TikTok",
      net: "tiktok",
    },
  ];
  return (
    <section id="proof" className="section">
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <div
            style={{
              display: "inline-flex",
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
            ★ Ils nous font confiance
          </div>
          <h2 className="display" style={{ fontSize: "clamp(36px, 4.6vw, 60px)", margin: 0 }}>
            Ils nous font <span className="squiggle">confiance</span>.
          </h2>
        </div>

        {/* Stats inline bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "16px 32px",
            padding: "20px 28px",
            marginBottom: 40,
            background: "white",
            border: "1px solid var(--line)",
            borderRadius: 18,
            maxWidth: 900,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {[
            { n: "32", l: "points d'audit" },
            { n: "8", l: "plateformes couvertes" },
            { n: "4,9/5", l: "note moyenne" },
            { n: "30j", l: "plan d'action" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.n}
              </span>
              <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{s.l}</span>
            </div>
          ))}
        </div>

        {/* Cards */}
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}
          className="test-grid"
        >
          {testimonials.map((t, i) => {
            const net = NETWORKS.find((n) => n.id === t.net)!;
            return (
              <article
                key={i}
                style={{
                  background: "white",
                  borderRadius: 18,
                  padding: 22,
                  border: "1px solid var(--line)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", gap: 3 }}>
                    {[...Array(5)].map((_, j) => (
                      <svg
                        key={j}
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="var(--yellow)"
                      >
                        <path d="M7 1l1.8 4 4.2.6-3 3 .7 4.2L7 10.8 3.3 12.8 4 8.6 1 5.6l4.2-.6z" />
                      </svg>
                    ))}
                  </div>
                  <NetIcon kind={net.icon} color={net.color} size={20} />
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.5, margin: "0 0 18px", color: "var(--ink)" }}>
                  &ldquo;{t.q}&rdquo;
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${net.color}, var(--primary))`,
                      display: "grid",
                      placeItems: "center",
                      color: "white",
                      fontWeight: 800,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {t.n[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{t.n}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{t.r}</div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
