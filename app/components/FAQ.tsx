"use client";

import { useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { useMarketingMode } from "../marketing/MarketingModeProvider";
import { getPublicCopy } from "./publicCopy";

export default function FAQ() {
  const { locale } = useI18n();
  const { mode, surfaceMode } = useMarketingMode();
  const copy = getPublicCopy(locale, mode, surfaceMode).faq;
  const [open, setOpen] = useState(0);
  const items = copy.items;
  return (
    <section id="faq" style={{ background: "var(--frame)", padding: "clamp(56px, 8vw, 100px) 0" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 32px" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "6px 14px",
              background: "white",
              color: "var(--primary)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              borderRadius: 999,
              marginBottom: 20,
              textTransform: "uppercase",
              border: "1px solid var(--line)",
            }}
          >
            {copy.eyebrow}
          </div>
          <h2 className="display" style={{ fontSize: "clamp(36px, 4.6vw, 60px)", margin: 0 }}>
            {copy.titleBefore}<span className="squiggle">{copy.titleHighlight}</span>{copy.titleAfter}
          </h2>
        </div>

        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {items.map((it, i) => (
            <div key={i} className={`faq-item ${open === i ? "open" : ""}`}>
              <button
                className="faq-q"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
                <span>{it.q}</span>
                <span className="faq-icon">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M6 2v8M2 6h8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </button>
              <div className="faq-a">{it.a}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 32,
            fontSize: 14,
            color: "var(--ink-2)",
          }}
        >
          {copy.contactText} ·{" "}
          <a
            href="mailto:support@fanovera.com"
            style={{ color: "var(--primary)", fontWeight: 600 }}
          >
            support@fanovera.com
          </a>
        </div>
      </div>
    </section>
  );
}
