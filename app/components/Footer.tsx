"use client";

import { Logo } from "./Header";
import NetIcon from "./NetIcon";
import { useI18n } from "../i18n/I18nProvider";
import { useMarketingMode } from "../marketing/MarketingModeProvider";
import { NETWORKS } from "../lib/networks";
import { getPublicCopy } from "./publicCopy";

/**
 * Trust strip surfaced in the footer just above the legal line: lock icon +
 * "Paiement sécurisé via Stripe" on one side, card-brand wordmarks on the
 * other. Inline SVG so it adds zero network requests; brand marks are kept
 * minimal (wordmarks + standard MC interlock) which is the common practice
 * for "we accept" trust footers and stays well inside fair-use trademark
 * territory.
 */
function TrustStrip() {
  return (
    <div
      className="trust-strip"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        padding: "16px 0",
        marginTop: 4,
        borderTop: "1px solid var(--line)",
        color: "var(--ink-3)",
        fontSize: 12,
      }}
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <rect x="3" y="6.5" width="8" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 6.5V4.5a2 2 0 0 1 4 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span>Paiement sécurisé · SSL · via Stripe</span>
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
        aria-label="Moyens de paiement acceptés"
      >
        {/* Visa */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 24,
            background: "white",
            border: "1px solid var(--line)",
            borderRadius: 4,
            fontFamily: "var(--font-sans, sans-serif)",
            fontWeight: 800,
            fontStyle: "italic",
            fontSize: 11,
            color: "#1A1F71",
            letterSpacing: "-0.02em",
          }}
        >
          VISA
        </div>
        {/* Mastercard */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 24,
            background: "white",
            border: "1px solid var(--line)",
            borderRadius: 4,
          }}
        >
          <svg width="28" height="18" viewBox="0 0 28 18" aria-hidden>
            <circle cx="11" cy="9" r="7" fill="#EB001B" />
            <circle cx="17" cy="9" r="7" fill="#F79E1B" />
            <path
              d="M14 3.6a6.98 6.98 0 0 0 0 10.8 6.98 6.98 0 0 0 0-10.8z"
              fill="#FF5F00"
            />
          </svg>
        </div>
        {/* Amex */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 24,
            background: "#006FCF",
            borderRadius: 4,
            fontFamily: "var(--font-sans, sans-serif)",
            fontWeight: 800,
            fontSize: 9,
            color: "white",
            letterSpacing: "0.02em",
          }}
        >
          AMEX
        </div>
        {/* Apple Pay */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            width: 46,
            height: 24,
            background: "black",
            borderRadius: 4,
            color: "white",
            fontFamily: "var(--font-sans, sans-serif)",
            fontWeight: 600,
            fontSize: 10,
          }}
        >
          <svg width="10" height="12" viewBox="0 0 14 16" fill="white" aria-hidden>
            <path d="M11.4 8.3c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2.1-1.5 2.5-.4 6.2 1 8.3.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.7 1.1 0 1.8-1 2.5-2 .8-1.2 1.1-2.3 1.1-2.4-.1 0-2.2-.8-2.2-3.3zM9.4 2.3c.6-.7 1-1.7.9-2.7-.8 0-1.8.5-2.4 1.2-.5.6-1 1.6-.9 2.6.9 0 1.8-.5 2.4-1.1z" />
          </svg>
          Pay
        </div>
        {/* Google Pay */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            width: 46,
            height: 24,
            background: "white",
            border: "1px solid var(--line)",
            borderRadius: 4,
            fontFamily: "var(--font-sans, sans-serif)",
            fontWeight: 700,
            fontSize: 10,
          }}
        >
          <span style={{ color: "#4285F4" }}>G</span>
          <span style={{ color: "#34A853", marginLeft: 1 }}>P</span>
          <span style={{ color: "#FBBC04" }}>a</span>
          <span style={{ color: "#EA4335" }}>y</span>
        </div>
      </div>
    </div>
  );
}

function FootCol({
  title,
  links,
}: {
  title: string;
  links: { l: string; h: string }[];
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          marginBottom: 16,
          minHeight: 16,
        }}
      >
        {title}
      </div>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {links.map((l, i) => (
          <li key={i}>
            <a href={l.h} style={{ fontSize: 14, color: "var(--ink-2)" }}>
              {l.l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { locale } = useI18n();
  const { mode, surfaceMode } = useMarketingMode();
  const copy = getPublicCopy(locale, mode, surfaceMode).footer;

  return (
    <footer style={{ padding: "48px 0 24px" }}>
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: 40,
            marginBottom: 28,
            paddingBottom: 28,
            borderBottom: "1px solid var(--line)",
          }}
          className="footer-grid"
        >
          <div>
            <Logo />
            <p
              style={{
                marginTop: 14,
                fontSize: 13,
                lineHeight: 1.55,
                color: "var(--ink-2)",
                maxWidth: 320,
              }}
            >
              {copy.description}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              {NETWORKS.map((n) => (
                <a
                  key={n.id}
                  href={`/${n.id}`}
                  aria-label={n.name}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "white",
                    border: "1px solid var(--line)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <NetIcon kind={n.icon} color={n.color} size={18} />
                </a>
              ))}
            </div>
          </div>
          <FootCol
            title={copy.product}
            links={[
              { l: copy.links.how, h: "#how" },
              { l: copy.links.track, h: "/track" },
              { l: copy.links.testimonials, h: "#proof" },
              { l: copy.links.faq, h: "#faq" },
            ]}
          />
          <FootCol
            title={copy.company}
            links={[
              { l: copy.links.legal, h: `/${locale}/mentions-legales` },
              { l: copy.links.terms, h: `/${locale}/cgv` },
              { l: copy.links.privacy, h: `/${locale}/confidentialite` },
              { l: "Cookies", h: `/${locale}/cookies` },
              { l: copy.links.contact, h: `/${locale}/contact` },
            ]}
          />
        </div>
        <TrustStrip />
        <div className="footer-bottom">
          <div>© Fanovera SAS 2026 · {copy.madeIn}</div>
          <div>17 rue de Paradis · 75010 Paris · support@fanovera.com</div>
        </div>
      </div>
    </footer>
  );
}
