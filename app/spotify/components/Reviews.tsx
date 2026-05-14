import NetIcon from "../../components/NetIcon";
import SpoSprinkle from "./SpoSprinkle";
import { useSpotifyCopy } from "../i18n";
import { withDynamicReviewCount } from "../../lib/reviewCount";

const names = ["Leo M.", "Sarah B.", "Thomas R.", "Ines D.", "Hugo K.", "Lea C.", "Karim S.", "Manon F."];

export default function Reviews() {
  const t = useSpotifyCopy().reviews;

  return (
    <section data-i18n-skip style={{ padding: "80px 0", position: "relative", overflow: "hidden" }}>
      <SpoSprinkle count={4} seed={3} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "var(--primary-soft)", color: "var(--spo-green-2)", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", borderRadius: 999, marginBottom: 20, textTransform: "uppercase" }}>
            <NetIcon kind="spotify" color="var(--spo-green-2)" size={13} /> {t.eyebrow}
          </div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.2vw, 56px)", margin: "0 0 12px" }}>
            <span className="squiggle spo">{withDynamicReviewCount(t.rating)}</span> · 4,9/5
          </h2>
        </div>
        <div className="reviews-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {t.texts.map((text, i) => (
            <div key={i} className="review-card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{names[i]}</div>
                <div style={{ display: "flex", gap: 1 }}>
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} width="11" height="11" viewBox="0 0 14 14" fill="var(--yellow)">
                      <path d="M7 1l1.8 4 4.2.6-3 3 .7 4.2L7 10.8 3.3 12.8 4 8.6 1 5.6l4.2-.6z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 10 }}>{t.dates[i]}</div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
