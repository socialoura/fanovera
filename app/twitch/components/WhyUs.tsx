import NetIcon from "../../components/NetIcon";
import TwSprinkle from "./TwSprinkle";
import { useTwitchCopy } from "../i18n";

export default function WhyUs() {
  const t = useTwitchCopy();
  return (
    <section data-i18n-skip style={{ padding: "clamp(48px, 7vw, 80px) 0", background: "var(--frame)", position: "relative", overflow: "hidden" }}>
      <TwSprinkle count={5} seed={1} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "white", color: "var(--tw-purple)", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", borderRadius: 999, marginBottom: 20, textTransform: "uppercase", border: "1px solid var(--line)" }}>
            <NetIcon kind="twitch" color="var(--tw-purple)" size={13} /> {t.why.eyebrow}
          </div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.2vw, 56px)", margin: 0 }}>
            {t.why.title1}<br /><span className="squiggle tw">{t.why.title2}</span> {t.why.title3}
          </h2>
        </div>
        <div className="why-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {t.why.items.map(([title, body], i) => (
            <div key={title} className="why-card" style={{ padding: 20 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, rgba(145,70,255,0.18), rgba(125,49,227,0.15))", display: "grid", placeItems: "center", fontSize: 18, marginBottom: 12 }}>{["*", "+", "#", "✓"][i]}</div>
              <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
