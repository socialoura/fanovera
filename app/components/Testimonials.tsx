import NetIcon from "./NetIcon";
import { NETWORKS, type NetworkId } from "../lib/networks";

export default function Testimonials() {
  const testimonials: { q: string; n: string; r: string; net: NetworkId }[] = [
    {
      q: "Mes écoutes mensuelles ont triplé en six semaines. De vraies oreilles, et j'ai signé avec un label indé un mois après.",
      n: "Léa Marchetti",
      r: "Musicienne · 312k auditeurs",
      net: "spotify",
    },
    {
      q: "On vendait à nos abonnés. Maintenant on rencontre des prospects qu'on n'aurait jamais touchés. CAC divisé par trois.",
      n: "Karim Tahar",
      r: "Fondateur, Barge Goods",
      net: "instagram",
    },
    {
      q: "On gère quatorze clients sur Fanovera. Ciblage fin, reporting limpide. C'est devenu notre socle de growth.",
      n: "Studio Métrique",
      r: "Agence créative, Paris",
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
            <span className="squiggle">2,4 millions</span> de créateurs
            <br />
            nous ont déjà fait confiance.
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
            { n: "+412%", l: "portée moyenne" },
            { n: "2,4M", l: "créateurs" },
            { n: "98,7%", l: "comptes réels" },
            { n: "14j", l: "délai médian" },
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
