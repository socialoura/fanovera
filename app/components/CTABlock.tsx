"use client";

import NetIcon from "./NetIcon";
import { useI18n } from "../i18n/I18nProvider";
import { useMarketingMode } from "../marketing/MarketingModeProvider";
import { NETWORKS } from "../lib/networks";
import { getPublicCopy } from "./publicCopy";

export default function CTABlock() {
  const { locale } = useI18n();
  const { mode, surfaceMode } = useMarketingMode();
  const copy = getPublicCopy(locale, mode, surfaceMode).cta;
  return (
    <section id="start" style={{ padding: "clamp(56px, 8vw, 100px) 0", position: "relative" }}>
      <div className="container">
        <div
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--primary-2))",
            borderRadius: 28,
            padding: "60px 48px",
            color: "white",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="dot-pattern" style={{ position: "absolute", inset: 0, opacity: 0.2 }}></div>
          <div style={{ position: "relative" }}>
            <h2
              className="display"
              style={{
                fontSize: "clamp(36px, 4.6vw, 60px)",
                margin: "0 0 16px",
                color: "white",
              }}
            >
              {copy.titleBefore}<span style={{ color: "var(--yellow)" }}>{copy.titleHighlight}</span>{copy.titleAfter}
            </h2>
            <p
              style={{
                maxWidth: 540,
                margin: "0 auto 32px",
                fontSize: 17,
                opacity: 0.9,
              }}
            >
              {copy.body}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 28,
              }}
            >
              {NETWORKS.map((n) => (
                <a
                  key={n.id}
                  href={`/${n.id}`}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "white",
                    display: "grid",
                    placeItems: "center",
                    transition: "transform .25s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-4px) rotate(-3deg)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
                >
                  <NetIcon kind={n.icon} color={n.color} size={26} />
                </a>
              ))}
            </div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              {copy.footer}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
