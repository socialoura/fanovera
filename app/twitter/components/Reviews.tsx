import NetIcon from "../../components/NetIcon";
import XSprinkle from "./XSprinkle";

export default function Reviews() {
  const reviews = [
    { n: "Julien D.", d: "il y a 2 jours", t: "Mon compte X a vraiment pris de l'ampleur, followers engagés.", r: 5 },
    { n: "Marie L.", d: "il y a 7 jours", t: "Campagne lancée en quelques minutes, premiers followers sous 48h.", r: 5 },
    { n: "Pierre F.", d: "il y a 5 jours", t: "Top, j'ai vu mes abonnés monter progressivement sur 3 semaines.", r: 5 },
    { n: "Lucie B.", d: "il y a 10 jours", t: "Première campagne X, c'est sérieux et le suivi est top.", r: 5 },
    { n: "Karim T.", d: "il y a 5 jours", t: "Excellent service, +8k followers sur 3 semaines, super naturel.", r: 5 },
    { n: "Léa M.", d: "il y a 12 jours", t: "Rien à redire, croissance comme annoncée, garantie respectée.", r: 5 },
    { n: "Philippe C.", d: "il y a 14 jours", t: "Service client réactif et résultats au rendez-vous sur 2 semaines.", r: 5 },
    { n: "Laurent M.", d: "il y a 15 jours", t: "Bonne progression continue, exactement ce qui était annoncé.", r: 5 },
  ];
  return (
    <section style={{ padding: "80px 0", position: "relative", overflow: "hidden" }}>
      <XSprinkle count={4} seed={3} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "var(--primary-soft)", color: "var(--x-ink)", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", borderRadius: 999, marginBottom: 20, textTransform: "uppercase" }}>
            <NetIcon kind="twitter" color="var(--x-ink)" size={13} /> Avis clients
          </div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.2vw, 56px)", margin: "0 0 12px" }}>
            <span className="squiggle x">2 348 avis</span> · 4,9/5
          </h2>
        </div>

        <div style={{ maxWidth: 520, margin: "0 auto 36px", background: "white", borderRadius: 22, padding: 24, border: "1px solid var(--line)", display: "flex", gap: 28, alignItems: "center" }}>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, color: "var(--x-ink)" }}>4,91</div>
            <div style={{ display: "flex", gap: 2, marginTop: 6, justifyContent: "center" }}>
              {[...Array(5)].map((_, j) => (
                <svg key={j} width="14" height="14" viewBox="0 0 14 14" fill="var(--yellow)">
                  <path d="M7 1l1.8 4 4.2.6-3 3 .7 4.2L7 10.8 3.3 12.8 4 8.6 1 5.6l4.2-.6z" />
                </svg>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4, fontWeight: 600 }}>2 348 avis</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            {[{ r: 5, n: 2048 }, { r: 4, n: 198 }, { r: 3, n: 65 }, { r: 2, n: 22 }, { r: 1, n: 15 }].map((b) => (
              <div key={b.r} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
                <div style={{ width: 10, fontWeight: 700 }}>{b.r}</div>
                <svg width="11" height="11" viewBox="0 0 14 14" fill="var(--yellow)">
                  <path d="M7 1l1.8 4 4.2.6-3 3 .7 4.2L7 10.8 3.3 12.8 4 8.6 1 5.6l4.2-.6z" />
                </svg>
                <div style={{ flex: 1, height: 6, background: "var(--paper-2)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: (b.n / 2048) * 100 + "%", background: "var(--yellow)", borderRadius: 3 }}></div>
                </div>
                <div style={{ width: 28, textAlign: "right", color: "var(--ink-3)" }}>{b.n}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="reviews-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {reviews.map((r, i) => (
            <div key={i} className="review-card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{r.n}</div>
                <div style={{ display: "flex", gap: 1 }}>
                  {[...Array(r.r)].map((_, j) => (
                    <svg key={j} width="11" height="11" viewBox="0 0 14 14" fill="var(--yellow)">
                      <path d="M7 1l1.8 4 4.2.6-3 3 .7 4.2L7 10.8 3.3 12.8 4 8.6 1 5.6l4.2-.6z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 10 }}>{r.d}</div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{r.t}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
