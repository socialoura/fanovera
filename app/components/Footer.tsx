"use client";

import { Logo } from "./Header";
import NetIcon from "./NetIcon";
import { useI18n } from "../i18n/I18nProvider";
import { useMarketingMode } from "../marketing/MarketingModeProvider";
import { NETWORKS } from "../lib/networks";
import { getPublicCopy } from "./publicCopy";

/**
 * Trust strip surfaced in the footer just above the legal line: lock icon +
 * "Paiement sécurisé via Stripe" on one side, official payment-brand logos
 * (Visa, Mastercard, AMEX, PayPal) on the other from a pre-bundled PNG so
 * the brand marks look exactly like every other checkout footer the visitor
 * has seen elsewhere.
 */
function TrustStrip({ label }: { label: string }) {
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
        <span>{label}</span>
      </div>
      <img
        src="/badges_paiement.png"
        alt="Visa, Mastercard, American Express, PayPal"
        loading="lazy"
        decoding="async"
        style={{ height: 28, width: "auto", maxWidth: "100%", display: "block" }}
      />
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
  const { locale, t } = useI18n();
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
        <TrustStrip label={t("Paiement sécurisé · SSL · via Stripe")} />
        <div className="footer-bottom">
          <div>© Fanovera SAS 2026 · {copy.madeIn}</div>
          <div>17 rue de Paradis · 75010 Paris · support@fanovera.com</div>
        </div>
      </div>
    </footer>
  );
}
