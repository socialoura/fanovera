"use client";

import { useState } from "react";
import NetIcon from "../../components/NetIcon";
import FbSprinkle from "./FbSprinkle";
import { useFacebookCopy } from "../i18n";

export default function FbFAQ() {
  const [open, setOpen] = useState(0);
  const t = useFacebookCopy().faq;

  return (
    <section data-i18n-skip id="faq" style={{ padding: "80px 0", background: "var(--frame)", position: "relative", overflow: "hidden" }}>
      <FbSprinkle count={5} seed={5} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "white", color: "var(--fb-blue)", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", borderRadius: 999, marginBottom: 20, textTransform: "uppercase", border: "1px solid var(--line)" }}>
            <NetIcon kind="facebook" color="var(--fb-blue)" size={13} /> FAQ
          </div>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4.2vw, 56px)", margin: 0 }}>
            {t.titleBefore} <span className="squiggle fb">{t.titleFocus}</span>.
          </h2>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {t.items.map(([q, a], i) => (
            <div key={q} className={"faq-item fb" + (open === i ? " open" : "")}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                <span>{q}</span>
                <span className="faq-icon"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></span>
              </button>
              <div className="faq-a">{a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
