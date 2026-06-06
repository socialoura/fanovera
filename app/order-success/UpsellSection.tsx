"use client";

import Link from "next/link";
import { getDisplayLocale } from "../lib/pricingCurrency";
import { PACKS as IG_FOLLOWERS, LIKES_PACKS as IG_LIKES, VIEWS_PACKS as IG_VIEWS } from "../instagram/data";
import { PACKS as TT_FOLLOWERS, LIKES_PACKS as TT_LIKES, VIEWS_PACKS as TT_VIEWS } from "../tiktok/data";
import { PACKS as YT_VIEWS, SUBSCRIBERS_PACKS as YT_SUBS } from "../youtube/data";
import { PACKS as SP_STREAMS, FOLLOWERS_PACKS as SP_FOLLOWERS } from "../spotify/data";

type UpsellPlatform = "instagram" | "tiktok" | "youtube" | "spotify";

type Pack = { qty: number; price: number; old: number; bonus: number; popular?: boolean; best?: boolean };

type UpsellItem = {
  productKey: string;
  service: string;
  label: string;
  emoji: string;
  popularPack: Pack;
};

const CATALOG: Record<UpsellPlatform, { accent: string; items: UpsellItem[] }> = {
  instagram: {
    accent: "var(--ig-2)",
    items: [
      { productKey: "followers", service: "ig_followers", label: "Followers", emoji: "👥", popularPack: IG_FOLLOWERS.find((p) => p.popular) || IG_FOLLOWERS[3] },
      { productKey: "likes", service: "ig_likes", label: "Likes", emoji: "❤️", popularPack: IG_LIKES.find((p) => p.popular) || IG_LIKES[3] },
      { productKey: "views", service: "ig_views", label: "Vues", emoji: "👁️", popularPack: IG_VIEWS.find((p) => p.popular) || IG_VIEWS[3] },
    ],
  },
  tiktok: {
    accent: "var(--tt-red)",
    items: [
      { productKey: "followers", service: "tt_followers", label: "Followers", emoji: "👥", popularPack: TT_FOLLOWERS.find((p) => p.popular) || TT_FOLLOWERS[3] },
      { productKey: "likes", service: "tt_likes", label: "Likes", emoji: "❤️", popularPack: TT_LIKES.find((p) => p.popular) || TT_LIKES[3] },
      { productKey: "views", service: "tt_views", label: "Vues", emoji: "👁️", popularPack: TT_VIEWS.find((p) => p.popular) || TT_VIEWS[3] },
    ],
  },
  youtube: {
    accent: "var(--yt-red)",
    items: [
      { productKey: "views", service: "yt_views", label: "Vues", emoji: "👁️", popularPack: YT_VIEWS.find((p) => p.popular) || YT_VIEWS[3] },
      { productKey: "subscribers", service: "yt_subscribers", label: "Abonnés", emoji: "👥", popularPack: YT_SUBS.find((p) => p.popular) || YT_SUBS[3] },
    ],
  },
  spotify: {
    accent: "var(--spo-green-2)",
    items: [
      { productKey: "streams", service: "sp_streams", label: "Streams", emoji: "🎵", popularPack: SP_STREAMS.find((p) => p.popular) || SP_STREAMS[3] },
      { productKey: "followers", service: "sp_followers", label: "Followers", emoji: "👥", popularPack: SP_FOLLOWERS.find((p) => p.popular) || SP_FOLLOWERS[3] },
    ],
  },
};

const TITLE_COPY: Record<string, { eyebrow: string; title: string; sub: string; cta: string; popular: string; total: string }> = {
  fr: { eyebrow: "+ Complétez votre commande", title: "Boostez aussi votre profil", sub: "Tant que vous êtes là, complétez votre présence en quelques clics.", cta: "Ajouter →", popular: "Populaire", total: "Total inclus" },
  en: { eyebrow: "+ Complete your order", title: "Boost your profile even more", sub: "While you're here, round out your presence in a few clicks.", cta: "Add →", popular: "Popular", total: "Total included" },
  es: { eyebrow: "+ Completa tu pedido", title: "Impulsa también tu perfil", sub: "Ya que estás aquí, completa tu presencia en pocos clics.", cta: "Añadir →", popular: "Popular", total: "Total incluido" },
  pt: { eyebrow: "+ Complete seu pedido", title: "Impulsione também seu perfil", sub: "Já que está aqui, complete sua presença em poucos cliques.", cta: "Adicionar →", popular: "Popular", total: "Total incluído" },
  de: { eyebrow: "+ Bestellung ergänzen", title: "Steigere dein Profil zusätzlich", sub: "Wenn du schon hier bist, runde deinen Auftritt in wenigen Klicks ab.", cta: "Hinzufügen →", popular: "Beliebt", total: "Insgesamt enthalten" },
  it: { eyebrow: "+ Completa il tuo ordine", title: "Potenzia ancora il tuo profilo", sub: "Già che ci sei, completa la tua presenza in pochi clic.", cta: "Aggiungi →", popular: "Popolare", total: "Totale incluso" },
  tr: { eyebrow: "+ Siparişini tamamla", title: "Profilini daha da güçlendir", sub: "Hazır buradayken birkaç tıklama ile varlığını tamamla.", cta: "Ekle →", popular: "Popüler", total: "Dahil toplam" },
};

function formatQty(value: number) {
  // Active region locale (e.g. "10,000" en-GB) instead of always French —
  // mirrors the per-platform formatQty so post-purchase upsell quantities match.
  return value.toLocaleString(getDisplayLocale());
}

export default function UpsellSection({
  platform,
  service,
  locale,
  compact = false,
}: {
  platform: string;
  service: string;
  locale: string;
  compact?: boolean;
}) {
  const normalized = (platform || "").toLowerCase();
  if (!(normalized in CATALOG)) return null;

  const config = CATALOG[normalized as UpsellPlatform];
  const alternatives = config.items.filter((item) => item.service !== service);
  if (alternatives.length === 0) return null;

  const copy = TITLE_COPY[locale] || TITLE_COPY.fr;

  return (
    <section
      className={`upsell-section${compact ? " upsell-section--compact" : ""}`}
      aria-label={copy.title}
    >
      {!compact && (
        <div className="upsell-head">
          <span className="upsell-eyebrow">{copy.eyebrow}</span>
          <h2 className="upsell-title">{copy.title}</h2>
          <p className="upsell-sub">{copy.sub}</p>
        </div>
      )}

      <div className="upsell-list">
        {alternatives.map((item) => (
          <Link
            key={item.service}
            href={`/${normalized}?product=${item.productKey}`}
            className="upsell-row"
            style={{ "--upsell-accent": config.accent } as React.CSSProperties}
            aria-label={`${item.label} +${formatQty(item.popularPack.qty)}`}
          >
            <span className="upsell-tile" aria-hidden>
              <span className="upsell-emoji">{item.emoji}</span>
            </span>

            <span className="upsell-body">
              <span className="upsell-label">{item.label}</span>
              <span className="upsell-qty-line">
                <span className="upsell-qty">+{formatQty(item.popularPack.qty)}</span>
                <span className="upsell-bonus">+{formatQty(item.popularPack.bonus)} offerts</span>
              </span>
            </span>

            <span className="upsell-go" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .upsell-section { margin-top: 32px; }
        .upsell-section--compact { margin-top: 0; }
        .upsell-head { text-align: center; margin-bottom: 22px; }
        .upsell-eyebrow {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-3);
          padding: 4px 10px;
          background: var(--paper-2, #f5f5f8);
          border-radius: 999px;
          margin-bottom: 10px;
        }
        .upsell-title {
          font-size: 22px;
          font-weight: 900;
          color: var(--ink);
          margin: 0 0 6px;
          letter-spacing: -0.01em;
        }
        .upsell-sub {
          color: var(--ink-3);
          font-size: 14px;
          margin: 0 auto;
          max-width: 460px;
          line-height: 1.5;
        }

        /* List of horizontal rows */
        .upsell-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* Each row — :global() because <Link> doesn't get the styled-jsx
           scope hash, so a scoped .upsell-row selector wouldn't match the
           rendered <a>. Children (<span>) keep the scoped styles. */
        :global(.upsell-row) {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: white;
          border: 1px solid var(--line);
          border-radius: 14px;
          color: var(--ink);
          text-decoration: none;
          position: relative;
          overflow: hidden;
          transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
        }
        :global(.upsell-row::before) {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 4px;
          background: var(--upsell-accent);
          opacity: 0;
          transition: opacity 0.18s ease;
        }
        :global(.upsell-row:hover) {
          border-color: color-mix(in srgb, var(--upsell-accent) 35%, var(--line));
          background: color-mix(in srgb, var(--upsell-accent) 5%, white);
          box-shadow: 0 12px 24px -16px color-mix(in srgb, var(--upsell-accent) 55%, transparent);
          transform: translateX(2px);
        }
        :global(.upsell-row:hover::before) {
          opacity: 1;
        }
        :global(.upsell-row:active) { transform: translateX(0); }
        :global(.upsell-row:focus-visible) {
          outline: 2px solid var(--upsell-accent);
          outline-offset: 3px;
        }

        /* Emoji tile — colored square with the platform accent */
        .upsell-tile {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg,
            color-mix(in srgb, var(--upsell-accent) 16%, white),
            color-mix(in srgb, var(--upsell-accent) 8%, white)
          );
          border: 1px solid color-mix(in srgb, var(--upsell-accent) 22%, transparent);
          display: grid;
          place-items: center;
        }
        .upsell-emoji {
          font-size: 22px;
          line-height: 1;
        }

        /* Body: label on top, qty + bonus inline below */
        .upsell-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .upsell-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--ink-3);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .upsell-qty-line {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }
        .upsell-qty {
          font-size: 22px;
          font-weight: 900;
          color: var(--ink);
          letter-spacing: -0.02em;
          line-height: 1.1;
          font-variant-numeric: tabular-nums;
        }
        .upsell-bonus {
          font-size: 12px;
          color: #16a34a;
          font-weight: 700;
          padding: 2px 8px;
          background: rgba(34, 197, 94, 0.12);
          border-radius: 999px;
          white-space: nowrap;
        }

        /* Arrow: filled accent circle, always visible */
        .upsell-go {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--upsell-accent);
          color: white;
          display: grid;
          place-items: center;
          box-shadow: 0 6px 14px -6px color-mix(in srgb, var(--upsell-accent) 60%, transparent);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        :global(.upsell-row):hover .upsell-go {
          transform: translateX(3px) scale(1.04);
          box-shadow: 0 10px 20px -6px color-mix(in srgb, var(--upsell-accent) 65%, transparent);
        }

        @media (max-width: 640px) {
          .upsell-row {
            padding: 12px 14px;
            gap: 12px;
          }
          .upsell-tile {
            width: 40px;
            height: 40px;
            border-radius: 10px;
          }
          .upsell-emoji { font-size: 20px; }
          .upsell-qty { font-size: 19px; }
          .upsell-bonus { font-size: 11px; padding: 2px 7px; }
          .upsell-go { width: 32px; height: 32px; }
          .upsell-title { font-size: 20px; }
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.upsell-row),
          :global(.upsell-row::before),
          .upsell-go {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}
