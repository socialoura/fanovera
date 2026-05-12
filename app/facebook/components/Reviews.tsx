"use client";

import NetIcon from "../../components/NetIcon";
import FbSprinkle from "./FbSprinkle";
import { useFacebookCopy } from "../i18n";

const names = ["Julien D.", "Marie L.", "Pierre F.", "Lucie B.", "Karim T.", "Lea M.", "Philippe C.", "Laurent M."];

export default function Reviews() {
  const t = useFacebookCopy().reviews;
  const reviews = t.texts.map((text, i) => ({ n: names[i], d: t.dates[i], text, r: 5 }));

  return (
    <section data-i18n-skip style={{ padding: "80px 0", position: "relative", overflow: "hidden" }}>
      <FbSprinkle count={4} seed={3} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "var(--primary-soft)", color: "var(--fb-blue)", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", borderRadius: 999, marginBottom: 20, textTransform: "uppercase" }}>
            <NetIcon kind="facebook" color="var(--fb-blue)" size={13} /> {t.eyebrow}
          </div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.2vw, 56px)", margin: "0 0 12px" }}>
            <span className="squiggle fb">{t.rating}</span> - 4,9/5
          </h2>
        </div>

        <div style={{ maxWidth: 520, margin: "0 auto 36px", background: "white", borderRadius: 22, padding: 24, border: "1px solid var(--line)", display: "flex", gap: 28, alignItems: "center" }}>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, color: "var(--fb-blue)" }}>4,91</div>
            <div style={{ display: "flex", gap: 2, marginTop: 6, justifyContent: "center" }}>
              {[...Array(5)].map((_, j) => <svg key={j} width="14" height="14" viewBox="0 0 14 14" fill="var(--yellow)"><path d="M7 1l1.8 4 4.2.6-3 3 .7 4.2L7 10.8 3.3 12.8 4 8.6 1 5.6l4.2-.6z" /></svg>)}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4, fontWeight: 600 }}>{t.rating}</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            {[{ r: 5, n: 2048 }, { r: 4, n: 198 }, { r: 3, n: 65 }, { r: 2, n: 22 }, { r: 1, n: 15 }].map((b) => (
              <div key={b.r} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
                <div style={{ width: 10, fontWeight: 700 }}>{b.r}</div><svg width="11" height="11" viewBox="0 0 14 14" fill="var(--yellow)"><path d="M7 1l1.8 4 4.2.6-3 3 .7 4.2L7 10.8 3.3 12.8 4 8.6 1 5.6l4.2-.6z" /></svg>
                <div style={{ flex: 1, height: 6, background: "var(--paper-2)", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: (b.n / 2048) * 100 + "%", background: "var(--yellow)", borderRadius: 3 }}></div></div>
                <div style={{ width: 28, textAlign: "right", color: "var(--ink-3)" }}>{b.n}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="reviews-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {reviews.map((r) => (
            <div key={r.n} className="review-card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{r.n}</div>
                <div style={{ display: "flex", gap: 1 }}>{[...Array(r.r)].map((_, j) => <svg key={j} width="11" height="11" viewBox="0 0 14 14" fill="var(--yellow)"><path d="M7 1l1.8 4 4.2.6-3 3 .7 4.2L7 10.8 3.3 12.8 4 8.6 1 5.6l4.2-.6z" /></svg>)}</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 10 }}>{r.d}</div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
