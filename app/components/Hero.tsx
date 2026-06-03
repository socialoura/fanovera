"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NetIcon from "./NetIcon";
import StatusBadge from "./StatusBadge";
import { useI18n } from "../i18n/I18nProvider";
import { useMarketingMode } from "../marketing/MarketingModeProvider";
import { NETWORKS, NET_META, type Network, type NetworkId } from "../lib/networks";
import { getCachedPricingPacks, prefetchProductPricing, useCurrencyPreference } from "../lib/useCurrencyPricing";
import { buildCurrencyFormatter } from "../lib/pricingCurrency";
import { getPublicCopy } from "./publicCopy";
import { withDynamicReviewCount } from "../lib/reviewCount";
import { trackEvent, registerSuperProperties } from "../lib/analytics";
import { hrefWithPromoAttribution } from "../lib/promoAttribution";
import type { PromoFlowVariant } from "../lib/promoFlow";
import { detectTargetNetworkFromParams, squiggleClass } from "../lib/detectTargetNetwork";
import { getTargetedHeroTitle } from "./promoHeroTargetedCopy";

const PROMO_NETWORK_SERVICES: Record<NetworkId, string[]> = {
  instagram: ["ig_followers", "ig_likes", "ig_views"],
  tiktok: ["tt_followers", "tt_likes", "tt_views"],
  youtube: ["yt_views", "yt_subscribers"],
  spotify: ["sp_streams", "sp_followers"],
  twitter: ["x_followers"],
  facebook: ["fb_likes"],
  linkedin: ["li_followers"],
  twitch: ["tw_followers", "tw_live_viewers"],
};


function getCachedNetworkMinPrice(networkId: NetworkId, currency: string) {
  const prices = PROMO_NETWORK_SERVICES[networkId].flatMap((service) =>
    (getCachedPricingPacks(service, currency) || [])
      .map((pack) => pack.price)
      .filter((price) => Number.isFinite(price) && price >= 0),
  );

  return prices.length > 0 ? Math.min(...prices) : null;
}

function usePromoNetworkPriceLabels() {
  const { currency, locale } = useCurrencyPreference();
  const [pricingVersion, setPricingVersion] = useState(0);
  // Cached pricing lives in sessionStorage and is only reachable client-side.
  // Reading it during the first render produces SSR/CSR divergence — gate it
  // behind a mount flag so hydration always sees the NET_META fallback.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    prefetchProductPricing(currency)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPricingVersion((version) => version + 1);
      });

    return () => {
      cancelled = true;
    };
  }, [currency]);

  const formatter = useMemo(() => buildCurrencyFormatter(currency, locale), [currency, locale]);

  return useMemo(() => {
    void pricingVersion;

    return Object.fromEntries(
      NETWORKS.map((network) => {
        const cachedMinPrice = mounted ? getCachedNetworkMinPrice(network.id, currency) : null;
        const fallbackPrice = NET_META[network.id].minPriceEur;
        return [network.id, formatter.format(cachedMinPrice ?? fallbackPrice)];
      }),
    ) as Record<NetworkId, string>;
  }, [currency, formatter, pricingVersion, mounted]);
}

/**
 * Featured-card CTA label per locale. Stays whitehat: "Voir l'offre" =
 * "See the offer" — no product noun (followers/likes/etc.), no quantity.
 */
function featuredCardLabel(locale: string, network: Network): string {
  const lower = (locale || "").toLowerCase().split("-")[0];
  const templates: Record<string, string> = {
    fr: `Voir l'offre ${network.name}`,
    en: `See the ${network.name} offer`,
    es: `Ver la oferta ${network.name}`,
    pt: `Ver a oferta ${network.name}`,
    de: `${network.name}-Angebot ansehen`,
    it: `Vedi l'offerta ${network.name}`,
    tr: `${network.name} teklifini gör`,
  };
  return templates[lower] || templates.fr;
}

function StarsRow({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div
      className="hide-md"
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 56,
        flexWrap: "wrap",
        marginBottom: 28,
      }}
    >
      {items.map((t, i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 6 }}>
            {[...Array(5)].map((_, j) => (
              <svg key={j} width="16" height="16" viewBox="0 0 16 16" fill="var(--yellow)">
                <path d="M8 1l2 4.6 5 .7-3.6 3.5.9 5L8 12.3 3.7 14.8l.9-5L1 6.3l5-.7z" />
              </svg>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-2)", fontStyle: "italic" }}>
            &ldquo;{t.q}&rdquo;
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>- {t.a}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Network-themed visual mockup shown when `?utm_term={platform}` matches.
 * Stays whitehat: no quantitative data ("X followers", "+200 likes"), no
 * pack pricing — only thematic visuals (color scheme, network logo, generic
 * "engagement progression" graph). The visitor gets a "you're on the right
 * page" signal without exposing SMM-panel product specifics to Google's
 * landing-page policy scan.
 */
function ThemedMockup({ network, copy }: { network: Network; copy: ReturnType<typeof getPublicCopy>["hero"] }) {
  const meta = NET_META[network.id];
  const brandStyle = {
    "--brand": meta.brand,
    "--brand-2": meta.brand2,
  } as CSSProperties;

  return (
    <div className="themed-mockup mock-window" style={{ width: "100%", maxWidth: 560, ...brandStyle }}>
      <div className="mock-titlebar">
        <div className="traffic" style={{ background: "#ff5f57" }}></div>
        <div className="traffic" style={{ background: "#ffbd2e" }}></div>
        <div className="traffic" style={{ background: "#28c840" }}></div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "var(--ink-3)" }}>
          app.fanovera.com / {network.name.toLowerCase()}
        </div>
      </div>
      <div
        style={{
          padding: 24,
          background: `linear-gradient(135deg, color-mix(in srgb, ${meta.brand} 8%, white), color-mix(in srgb, ${meta.brand2} 5%, white))`,
          minHeight: 380,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${meta.brand}, ${meta.brand2})`,
              display: "grid",
              placeItems: "center",
              boxShadow: `0 8px 22px -8px ${meta.brand}aa`,
            }}
          >
            <NetIcon kind={network.icon} color="white" size={26} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{network.name}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{copy.campaignMeta}</div>
          </div>
        </div>

        {/* Engagement progression graph — generic, no absolute numbers */}
        <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", marginBottom: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {copy.chartTitle}
          </div>
          <svg viewBox="0 0 300 110" style={{ width: "100%", height: 120 }}>
            <defs>
              <linearGradient id={`themed-grad-${network.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={meta.brand} stopOpacity="0.32" />
                <stop offset="100%" stopColor={meta.brand} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[25, 55, 85].map((y) => (
              <line key={y} x1="10" x2="290" y1={y} y2={y} stroke="#eee" strokeDasharray="2 3" />
            ))}
            <path
              d="M 10 95 Q 40 88 60 82 T 110 68 T 160 50 T 210 32 T 290 14 L 290 110 L 10 110 Z"
              fill={`url(#themed-grad-${network.id})`}
            />
            <path
              d="M 10 95 Q 40 88 60 82 T 110 68 T 160 50 T 210 32 T 290 14"
              stroke={meta.brand}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            {[[60, 82], [110, 68], [160, 50], [210, 32], [260, 20]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3" fill="white" stroke={meta.brand} strokeWidth="2" />
            ))}
          </svg>
        </div>

        {/* Three pillars — generic descriptors only, no SMM product nouns */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {copy.stats.map((s, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                background: "white",
                border: "1px solid var(--line)",
                borderRadius: 10,
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 9, color: "var(--ink-3)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.l}</div>
              <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2, color: "var(--ink)" }}>{s.v}</div>
              <div style={{ fontSize: 9, color: meta.brand, fontWeight: 700, marginTop: 1 }}>{s.d}</div>
            </div>
          ))}
        </div>

        {/* Receipt strip — transactional proof, themed with platform accent.
            Stays whitehat: order delivered status, no product noun / quantity. */}
        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: `color-mix(in srgb, ${meta.brand} 6%, white)`,
            border: `1px dashed color-mix(in srgb, ${meta.brand} 35%, transparent)`,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: meta.brand,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)" }}>
              {copy.receiptLabel}
            </div>
            <div style={{ fontSize: 9, color: "var(--ink-3)", marginTop: 1, fontFamily: "ui-monospace, monospace" }}>
              #1247 · {network.name.toLowerCase()}
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: meta.brand, letterSpacing: "-0.01em" }}>
            4,90€
          </div>
        </div>
      </div>
    </div>
  );
}

function MockDashboard({ copy }: { copy: ReturnType<typeof getPublicCopy>["hero"] }) {
  return (
    <div className="mock-window" style={{ width: "100%", maxWidth: 700 }}>
      <div className="mock-titlebar">
        <div className="traffic" style={{ background: "#ff5f57" }}></div>
        <div className="traffic" style={{ background: "#ffbd2e" }}></div>
        <div className="traffic" style={{ background: "#28c840" }}></div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "var(--ink-3)" }}>
          app.fanovera.com
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", minHeight: 380 }}>
        {/* Sidebar */}
        <div
          style={{
            background: "var(--paper-2)",
            padding: "18px 12px",
            borderRight: "1px solid var(--line)",
          }}
        >
          <div
            style={{
              background: "var(--primary)",
              color: "white",
              padding: "8px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="white"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {copy.newCampaign}
          </div>
          {copy.menu.map(
            (label, i) => (
              <div
                key={label}
                style={{
                  padding: "8px 10px",
                  fontSize: 12,
                  fontWeight: i === 0 ? 700 : 500,
                  color: i === 0 ? "var(--ink)" : "var(--ink-2)",
                  borderRadius: 6,
                  marginBottom: 2,
                  background: i === 0 ? "white" : "transparent",
                }}
              >
                {label}
              </div>
            )
          )}
          <div
            style={{
              marginTop: 18,
              fontSize: 10,
              color: "var(--ink-3)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              padding: "0 10px",
            }}
          >
            {copy.activeNetworks}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 10px" }}>
            {NETWORKS.slice(0, 8).map((n) => (
              <div key={n.id} style={{ width: 18, height: 18 }}>
                <NetIcon kind={n.icon} color={n.color} size={18} />
              </div>
            ))}
          </div>
        </div>
        {/* Main */}
        <div style={{ padding: 20 }}>
          {/* Profile chip — avatar + handle + active badge.
              Stays whitehat: no follower count, no quantitative growth claim. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              background: "linear-gradient(135deg, rgba(82,96,230,0.08), rgba(124,58,237,0.06))",
              border: "1px solid var(--line)",
              borderRadius: 12,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #fda085, #f6d365)",
                color: "white",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              C
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>@creator_42</div>
              <div style={{ fontSize: 9, color: "var(--ink-3)", marginTop: 1 }}>app.fanovera.com</div>
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--green)",
                padding: "3px 8px",
                background: "rgba(77,191,138,0.12)",
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              ↑ {copy.profileBadge}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{copy.campaign}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{copy.campaignMeta}</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <div
                style={{
                  padding: "4px 10px",
                  background: "var(--paper-2)",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 6,
                }}
              >
                7j
              </div>
              <div
                style={{
                  padding: "4px 10px",
                  background: "var(--ink)",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 6,
                }}
              >
                30j
              </div>
              <div
                style={{
                  padding: "4px 10px",
                  background: "var(--paper-2)",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 6,
                }}
              >
                90j
              </div>
            </div>
          </div>
          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {[
              { ...copy.stats[0], c: "var(--green)" },
              { ...copy.stats[1], c: "var(--primary)" },
              { ...copy.stats[2], c: "var(--orange)" },
            ].map((s, i) => (
              <div key={i} style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{s.l}</div>
                <div
                  style={{ fontSize: 18, fontWeight: 800, marginTop: 2, letterSpacing: "-0.01em" }}
                >
                  {s.v}
                </div>
                <div style={{ fontSize: 10, color: s.c, fontWeight: 600, marginTop: 2 }}>
                  {s.d}
                </div>
              </div>
            ))}
          </div>
          {/* Chart */}
          <div style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 8, height: 170 }}>
            <div
              style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", marginBottom: 8 }}
            >
              {copy.chartTitle}
            </div>
            <svg viewBox="0 0 300 130" style={{ width: "100%", height: 140 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5260e6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#5260e6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[30, 60, 90].map((y) => (
                <line key={y} x1="10" x2="290" y1={y} y2={y} stroke="#eee" strokeDasharray="2 3" />
              ))}
              <path
                d="M 10 110 Q 40 100 60 95 T 110 80 T 160 60 T 210 40 T 290 18 L 290 130 L 10 130 Z"
                fill="url(#grad)"
              />
              <path
                d="M 10 110 Q 40 100 60 95 T 110 80 T 160 60 T 210 40 T 290 18"
                stroke="var(--primary)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              {[
                [60, 95],
                [110, 80],
                [160, 60],
                [210, 40],
                [260, 25],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="var(--primary)" strokeWidth="2" />
              ))}
            </svg>
          </div>

          {/* Receipt strip — transactional proof.
              Stays whitehat: shows that an order was delivered, never says
              what product or quantity. The amount is generic (4,90€). */}
          <div
            style={{
              marginTop: 10,
              padding: "8px 12px",
              background: "rgba(34,197,94,0.06)",
              border: "1px dashed rgba(34,197,94,0.35)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "var(--green)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)" }}>
                {copy.receiptLabel}
              </div>
              <div style={{ fontSize: 9, color: "var(--ink-3)", marginTop: 1, fontFamily: "ui-monospace, monospace" }}>
                #1247 · campagne #042
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--green)", letterSpacing: "-0.01em" }}>
              4,90€
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NetCard({
  n,
  copy,
  href,
  onSelect,
  highlighted = false,
  priceLabel,
  cardLabelOverride,
}: {
  n: Network;
  copy: ReturnType<typeof getPublicCopy>["hero"];
  href: string;
  onSelect: () => void;
  highlighted?: boolean;
  priceLabel: string;
  /**
   * When set, replaces the generic `copy.cardLabel` ("Audit et stratégie")
   * with a network-specific safe CTA like "Voir l'offre Instagram". Used by
   * the featured card on /promo so the visitor sees the matched platform
   * name in the CTA. Stays whitehat — no product nouns, no quantities.
   */
  cardLabelOverride?: string;
}) {
  const meta = NET_META[n.id];
  const cardStyle = {
    "--brand": meta.brand,
    "--brand-2": meta.brand2,
  } as CSSProperties;
  // When highlighted, wrap so the pin can escape the card's overflow:hidden.
  // Otherwise return the bare Link to avoid an extra DOM node.
  const card = (
    <Link
      href={href}
      className={highlighted ? "netcard netcard-highlighted" : "netcard"}
      style={cardStyle}
      onClick={onSelect}
      data-network={n.id}
    >
      {/* Background oversized glyph */}
      <div className="netcard-glyph">
        <NetIcon kind={n.icon} color="white" size={180} />
      </div>

      {/* Top row: small icon chip + badge */}
      <div
        className="netcard-row"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: "rgba(255,255,255,0.95)",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
          }}
        >
          <NetIcon kind={n.icon} color={n.color} size={22} />
        </div>
        {meta.badge && !highlighted && <span className="netcard-chip solid">★ {meta.badge}</span>}
      </div>

      {/* Name */}
      <div className="netcard-row">
        <div className="netcard-name">{n.name}</div>
      </div>

      <div className="netcard-divider"></div>

      {/* Foot: CTA + arrow. The CTA line shows the network's lowest pack
          price in the visitor's active currency so promo matches checkout. */}
      <div className="netcard-foot">
        <div>
          <div className="netcard-cta-label">{cardLabelOverride || copy.cardLabel}</div>
          <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2, color: "white", letterSpacing: "-0.01em" }}>
            {priceLabel}
          </div>
        </div>
        <div className="netcard-arrow">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 12L12 4M5 4h7v7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </Link>
  );

  // The featured card uses a relative wrapper so the pulse/ring isn't clipped
  // by neighbors' stacking context. No "Pour vous" / "For you" pin: the H1
  // already names the network and the card itself is visually unmistakable.
  if (!highlighted) return card;
  return (
    <div className="netcard-wrap" style={cardStyle}>
      {card}
    </div>
  );
}

export default function Hero({
  initialTargetedNetwork = null,
  promoFlowVariant = "control",
}: {
  // Server-detected UTM target (from /promo/page.tsx). Used as the source
  // of truth on the very first render so the SSR HTML already contains the
  // targeted layout — `useSearchParams()` returns empty during static
  // rendering of nested client components, which previously produced a
  // hydration flash when the layout swapped to the featured-card variant.
  initialTargetedNetwork?: NetworkId | null;
  // /promo username-first A/B variant (assigned SSR via cookie → no flash).
  promoFlowVariant?: PromoFlowVariant;
} = {}) {
  const { locale } = useI18n();
  const { mode, surfaceMode } = useMarketingMode();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [promoHandle, setPromoHandle] = useState("");
  const promoNetworkPriceLabels = usePromoNetworkPriceLabels();
  const copy = getPublicCopy(locale, mode, surfaceMode).hero;
  const isPromo = mode === "promo";

  // When a Google Ads visitor lands on /promo with a network-specific
  // utm_term/content/campaign, surface that intent in the H1 and highlight
  // the matching network card. The rest of the grid stays in place so any
  // off-intent visitor can still pick a different network — and the URL
  // remains /promo, which keeps the LP whitehat for Google Ads policy.
  //
  // Resolution order: client-side searchParams (handles client navigation
  // between /promo links with different UTMs) → SSR fallback prop → null.
  // The fallback only matters on the initial render when useSearchParams
  // hasn't yet resolved on the server; once hydrated it's always the URL.
  const targetedNetwork: NetworkId | null = isPromo
    ? detectTargetNetworkFromParams(searchParams) ?? initialTargetedNetwork
    : null;

  // A/B variant driven by ad URL: when /promo is hit with ?promo=FANO5, show
  // a slim banner at the top of the hero so the visitor sees the discount
  // before scrolling. The code itself is already auto-applied at checkout via
  // usePromoFromUrl — this banner only surfaces the value on the LP.
  const showPromoCodeBanner =
    isPromo && (searchParams?.get("promo")?.trim().toUpperCase() === "FANO5");
  const targetedTitle = getTargetedHeroTitle(locale, targetedNetwork);
  const heroTitle = targetedTitle || {
    titleBefore: copy.titleBefore,
    titleHighlight: copy.titleHighlight,
    titleAfter: copy.titleAfter,
  };

  useEffect(() => {
    if (!showPromoCodeBanner) return;
    trackEvent("promo_code_banner_exposed", {
      page_type: "promo",
      entry_surface: "promo",
      feature_name: "promo_code_banner",
      promo_code: "FANO5",
      locale,
    });
  }, [showPromoCodeBanner, locale]);

  useEffect(() => {
    if (!isPromo || !targetedNetwork) return;
    trackEvent("promo_hero_targeted_exposed", {
      page_type: "promo",
      entry_surface: "promo",
      destination_network: targetedNetwork,
      product_area: targetedNetwork,
      feature_name: "promo_hero_targeted",
      locale,
    });
    // Pre-warm the targeted product page so the click → render is instant.
    // Next prefetches viewport-visible Links automatically, but we want the
    // route the visitor is statistically about to click, regardless of
    // whether that card is below the fold on mobile.
    try {
      router.prefetch(`/${targetedNetwork}`);
    } catch {
      /* prefetch is best-effort; ignore stale-router edge cases */
    }
  }, [isPromo, targetedNetwork, locale, router]);

  // Username-first A/B: capture the @ on /promo and hand it off to the product
  // page. Only shown for the Instagram-targeted campaign (where the handoff +
  // personalization is wired). For any other network the variant degrades to
  // control (no capture), so it's safe to ship before other platforms exist.
  const showUsernameCapture =
    isPromo && promoFlowVariant === "username_first" && targetedNetwork === "instagram";

  // Exposure + variant super property: fired once per /promo view for BOTH arms
  // so the experiment is measurable (per-arm funnel) and the variant rides along
  // to checkout/payment events via the registered super property.
  const promoFlowExposedRef = useRef(false);
  useEffect(() => {
    if (!isPromo || promoFlowExposedRef.current) return;
    promoFlowExposedRef.current = true;
    registerSuperProperties({ promo_flow_variant: promoFlowVariant });
    trackEvent("promo_flow_exposed", {
      page_type: "promo",
      entry_surface: "promo",
      variant: promoFlowVariant,
      product_area: targetedNetwork || "promo",
      locale,
    });
  }, [isPromo, promoFlowVariant, targetedNetwork, locale]);

  const submitUsernameCapture = (e: React.FormEvent) => {
    e.preventDefault();
    const handle = promoHandle.replace(/^@/, "").trim();
    // Guardrail: this is the promo→product clickthrough for the username arm.
    // Compared against the control card's `cta_clicked` (same step) to catch a
    // top-of-funnel drop if asking the @ first scares off intent-to-buy traffic.
    trackEvent("cta_clicked", {
      page_type: "promo",
      entry_surface: "promo",
      product_area: "instagram",
      destination_network: "instagram",
      destination_path: "/instagram",
      feature_name: "promo_username_capture",
      cta_location: "hero_username_capture",
      has_username: handle.length > 0,
    });
    // Preserve gclid/utm/kw/mt (keyword LTV) and append the captured handle.
    const base = hrefWithPromoAttribution("/instagram", searchParams, "instagram");
    const sep = base.includes("?") ? "&" : "?";
    router.push(handle ? `${base}${sep}u=${encodeURIComponent(handle)}` : base);
  };

  const networkHref = (network: Network) =>
    isPromo ? hrefWithPromoAttribution(`/${network.id}`, searchParams, network.id) : `/${network.id}`;
  const trackNetworkSelect = (network: Network) => {
    if (!isPromo) return;
    trackEvent("cta_clicked", {
      page_type: "promo",
      entry_surface: "promo",
      product_area: network.id,
      destination_network: network.id,
      destination_path: `/${network.id}`,
      feature_name: "promo_network_selector",
      cta_location: "hero_network_card",
      targeted_match: targetedNetwork === network.id,
      targeted_network: targetedNetwork || undefined,
    });
  };

  return (
    <section style={{ padding: "32px 0 0", position: "relative" }}>
      <div className="container">
        {showPromoCodeBanner && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 16px",
                background: "linear-gradient(135deg, rgba(77,191,138,0.12), rgba(34,197,94,0.08))",
                border: "1px solid rgba(34,197,94,0.35)",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              <span
                style={{
                  display: "inline-grid",
                  placeItems: "center",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "var(--green)",
                  flexShrink: 0,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M3 7l3 3 5-6"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>{copy.promoCodeBanner}</span>
            </div>
          </div>
        )}

        {/* Trustpilot-style rating — first thing the visitor sees */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                fontWeight: 500,
                fontSize: 20,
                marginRight: 8,
              }}
            >
              4.9 <span style={{ opacity: 0.7 }}>|</span>
            </span>
            <svg
              viewBox="0 0 128 24"
              style={{ height: 24, display: "block" }}
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="4.9 / 5"
            >
              {/* 4 full green squares with 2px gap between each */}
              {[0, 1, 2, 3].map((i) => (
                <g key={i} transform={`translate(${i * 26}, 0)`}>
                  <rect width="24" height="24" fill="#00B67A" />
                  <path
                    d="M12 5l1.96 4.45 4.84.4-3.68 3.18 1.12 4.73L12 15.27l-4.24 2.49 1.12-4.73L5.2 9.85l4.84-.4z"
                    fill="white"
                  />
                </g>
              ))}
              {/* 5th star: 90% filled (4.9/5) */}
              <g transform="translate(104, 0)">
                <rect width="21.6" height="24" fill="#00B67A" />
                <rect x="21.6" width="2.4" height="24" fill="#dcdce6" />
                <path
                  d="M12 5l1.96 4.45 4.84.4-3.68 3.18 1.12 4.73L12 15.27l-4.24 2.49 1.12-4.73L5.2 9.85l4.84-.4z"
                  fill="white"
                />
              </g>
            </svg>
          </div>
        </div>
        {/* The top StatusBadge stays on desktop, but on mobile UTM-match
            visits we move it down to the eyebrow's slot for tighter social-
            proof → H1 hand-off. Without this rule mobile would render two
            StatusBadges (top + eyebrow slot) on /promo?utm_term=*. */}
        <div className={targetedTitle ? "hide-md" : ""}>
          <StatusBadge />
        </div>
        <StarsRow items={copy.stars} />
        {targetedTitle && (
          <>
            {/* Mobile: drop the promotional eyebrow ("Instagram · Visibilité
                progressive") in favour of the live "X commandes livrées
                aujourd'hui" trust pill so the pre-H1 signal is concrete
                instead of marketing-flavoured. */}
            <div
              className="show-md-only"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <StatusBadge />
            </div>
          </>
        )}
        <h1
          className="display"
          style={{
            textAlign: "center",
            margin: "0 auto 16px",
            maxWidth: 900,
            fontSize: "clamp(28px, 5vw, 56px)",
          }}
        >
          {heroTitle.titleBefore}<span className={squiggleClass(targetedNetwork)}>{heroTitle.titleHighlight}</span>{heroTitle.titleAfter}
        </h1>

        {/* Username-first capture (A/B variant). Asks the @ before showing
            packs: a micro-commitment that also lets the product page greet the
            visitor with their real profile + a personalised projection. The
            network grid still renders below so off-intent visitors can pick
            another platform — and so we can compare promo→product clickthrough
            against control. */}
        {showUsernameCapture && (
          <form
            onSubmit={submitUsernameCapture}
            style={{
              maxWidth: 520,
              margin: "0 auto 8px",
              background: "white",
              border: "1px solid var(--line)",
              borderRadius: 18,
              padding: 20,
              boxShadow: "0 18px 44px -26px rgba(20,22,50,0.22)",
            }}
          >
            <label
              htmlFor="promo-ig-handle"
              style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10, textAlign: "center" }}
            >
              {locale?.toLowerCase().startsWith("fr")
                ? "Entrez votre @ Instagram pour voir votre offre"
                : "Enter your Instagram @ to see your offer"}
            </label>
            <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
              <div className="input-shell" style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 16 }}>@</span>
                <input
                  id="promo-ig-handle"
                  data-testid="promo-username-capture"
                  type="text"
                  name="handle"
                  enterKeyHint="go"
                  placeholder={locale?.toLowerCase().startsWith("fr") ? "votre_nom" : "your_handle"}
                  value={promoHandle}
                  onChange={(e) => setPromoHandle(e.target.value.replace(/^@+/, ""))}
                  spellCheck={false}
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16 }}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: "12px 22px", fontSize: 15, whiteSpace: "nowrap", background: NET_META.instagram.brand2 }}
              >
                {locale?.toLowerCase().startsWith("fr") ? "Continuer" : "Continue"}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 6 }}>
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </form>
        )}

        {/* When a network is targeted via UTM, the matching card sits at
            position 1 of the unified grid (top-left) — highlighted with a
            brand-colored pulse ring so it stands out without being orphaned
            on its own row. The H1 already names the network, so the pulse
            alone is enough signal that "this is your card". Without a
            target, the 8 networks render in their default order.
            id="networks" is the anchor target for the header "Commencer"
            button — landing on the network picker, not the CTABlock at the
            bottom of the page (which was wasted scroll). */}
        <div id="networks">
        {(() => {
          const featured = targetedNetwork ? NETWORKS.find((n) => n.id === targetedNetwork) : null;
          const ordered = featured
            ? [featured, ...NETWORKS.filter((n) => n.id !== featured.id)]
            : NETWORKS;
          return (
            <div
              className="net-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 14,
                maxWidth: 1100,
                margin: "32px auto 24px",
              }}
            >
              {ordered.map((n) => {
                const isFeatured = featured?.id === n.id;
                return (
                  <NetCard
                    key={n.id}
                    n={n}
                    copy={copy}
                    href={networkHref(n)}
                    onSelect={() => trackNetworkSelect(n)}
                    highlighted={isFeatured}
                    priceLabel={promoNetworkPriceLabels[n.id]}
                    cardLabelOverride={
                      isFeatured && featured ? featuredCardLabel(locale, featured) : undefined
                    }
                  />
                );
              })}
            </div>
          );
        })()}
        </div>


        {/* Mock with floating cards.
            - Default visitor (no UTM match): generic Fanovera dashboard mock +
              all 4 floating stickers (IG, TT, SP, YT, rating).
            - Targeted visitor (utm_term matches a network): platform-themed
              visual mockup + only the matched network's sticker + the rating
              sticker (off-network stickers removed for clearer message-match).
            Both variants stay whitehat — no SMM product nouns or quantities. */}
        {!targetedNetwork ? (
          <div className="mock-dashboard-wrapper" style={{ position: "relative", marginTop: 20, marginBottom: -40, paddingBottom: 60 }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <MockDashboard copy={copy} />
            </div>

            {/* Floating left icons */}
            <div
              style={{ position: "absolute", left: "5%", top: 60, ["--r" as string]: "-8deg" } as CSSProperties}
              className="floaty hide-lg-down"
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #fda085, #f6d365)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 14px 30px -10px rgba(253, 160, 133, 0.5)",
                }}
              >
                <NetIcon kind="instagram" color="white" size={32} />
              </div>
            </div>
            <div
              style={{ position: "absolute", left: "2%", top: 220, ["--r" as string]: "5deg" } as CSSProperties}
              className="floaty hide-lg-down"
            >
              <div className="sticker" style={{ borderRadius: 999 }}>
                <NetIcon kind="tiktok" color="#1d1d2c" size={20} />
                <div>
                  <div style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 600 }}>{copy.tiktokLabel}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{copy.tiktokValue}</div>
                </div>
              </div>
            </div>

            {/* Floating right cards */}
            <div
              style={{ position: "absolute", right: "5%", top: 30, ["--r" as string]: "7deg" } as CSSProperties}
              className="floaty hide-lg-down"
            >
              <div className="sticker">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "var(--green)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <NetIcon kind="spotify" color="white" size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{copy.spotifyTitle}</div>
                  <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{copy.spotifyMeta}</div>
                </div>
              </div>
            </div>
            <div
              style={{ position: "absolute", right: "2%", top: 180, ["--r" as string]: "-4deg" } as CSSProperties}
              className="floaty hide-lg-down"
            >
              <div className="sticker">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #ff6b9b, #c45cae)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M12 4l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>4,9/5</div>
                  <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{withDynamicReviewCount(copy.reviewsMeta)}</div>
                </div>
              </div>
            </div>
            <div
              style={{ position: "absolute", right: "8%", top: 320, ["--r" as string]: "3deg" } as CSSProperties}
              className="floaty hide-lg-down"
            >
              <div className="sticker">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "var(--primary)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <NetIcon kind="youtube" color="white" size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{copy.youtubeTitle}</div>
                  <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{copy.youtubeMeta}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          (() => {
            const themedNetwork = NETWORKS.find((n) => n.id === targetedNetwork);
            if (!themedNetwork) return null;
            const themedMeta = NET_META[themedNetwork.id];
            return (
              <div className="mock-dashboard-wrapper" style={{ position: "relative", marginTop: 20, marginBottom: -40, paddingBottom: 60 }}>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <ThemedMockup network={themedNetwork} copy={copy} />
                </div>

                {/* Left floating: only the matched network icon. */}
                <div
                  style={{ position: "absolute", left: "5%", top: 60, ["--r" as string]: "-8deg" } as CSSProperties}
                  className="floaty hide-lg-down"
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background: `linear-gradient(135deg, ${themedMeta.brand}, ${themedMeta.brand2})`,
                      display: "grid",
                      placeItems: "center",
                      boxShadow: `0 14px 30px -10px ${themedMeta.brand}88`,
                    }}
                  >
                    <NetIcon kind={themedNetwork.icon} color="white" size={32} />
                  </div>
                </div>

                {/* Right floating: only the rating sticker (always relevant). */}
                <div
                  style={{ position: "absolute", right: "2%", top: 120, ["--r" as string]: "-4deg" } as CSSProperties}
                  className="floaty hide-lg-down"
                >
                  <div className="sticker">
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "linear-gradient(135deg, #ff6b9b, #c45cae)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M12 4l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>4,9/5</div>
                      <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{withDynamicReviewCount(copy.reviewsMeta)}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* Payment badges — trust signal under the hero. Grayscale + reduced
            opacity so it reads as reassurance, not a primary visual element.
            Legal: showing card brand marks for accepted payment methods is
            permitted under Visa/MC/Amex/PayPal merchant agreements. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            marginTop: 60,
            paddingTop: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-3)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2l8 3v6c0 5-3.5 9.4-8 11-4.5-1.6-8-6-8-11V5l8-3z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M8 12l3 3 5-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {copy.securePayment}
          </div>
          <img
            src="/badges_paiement.png"
            alt="Visa, Mastercard, American Express, PayPal"
            width={320}
            height={50}
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              maxWidth: 320,
              height: "auto",
              filter: "grayscale(100%)",
              opacity: 0.65,
            }}
          />
        </div>
      </div>
    </section>
  );
}
