"use client";

import Link from "next/link";
import { PACKS as IG_FOLLOWERS, LIKES_PACKS as IG_LIKES, VIEWS_PACKS as IG_VIEWS } from "../instagram/data";
import { PACKS as TT_FOLLOWERS, LIKES_PACKS as TT_LIKES, VIEWS_PACKS as TT_VIEWS } from "../tiktok/data";
import { PACKS as YT_VIEWS, SUBSCRIBERS_PACKS as YT_SUBS } from "../youtube/data";
import { PACKS as SP_STREAMS, FOLLOWERS_PACKS as SP_FOLLOWERS } from "../spotify/data";

type UpsellPlatform = "instagram" | "tiktok" | "youtube" | "spotify";

type Pack = { qty: number; price: number; old: number; bonus: number; popular?: boolean; best?: boolean };

type UpsellItem = {
  productKey: string;        // URL param value, e.g. "likes"
  service: string;           // e.g. "ig_likes"
  label: string;             // user-facing label
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

const TITLE_COPY: Record<string, { title: string; sub: string; cta: string }> = {
  fr: { title: "Boostez aussi votre profil", sub: "Tant que vous êtes là, complétez votre présence en quelques clics.", cta: "Acheter maintenant" },
  en: { title: "Boost your profile even more", sub: "While you're here, round out your presence in a few clicks.", cta: "Buy now" },
  es: { title: "Impulsa también tu perfil", sub: "Ya que estás aquí, completa tu presencia en pocos clics.", cta: "Comprar ahora" },
  pt: { title: "Impulsione também seu perfil", sub: "Já que está aqui, complete sua presença em poucos cliques.", cta: "Comprar agora" },
  de: { title: "Steigere dein Profil zusätzlich", sub: "Wenn du schon hier bist, runde deinen Auftritt in wenigen Klicks ab.", cta: "Jetzt kaufen" },
  it: { title: "Potenzia ancora il tuo profilo", sub: "Già che ci sei, completa la tua presenza in pochi clic.", cta: "Acquista ora" },
  tr: { title: "Profilini daha da güçlendir", sub: "Hazır buradayken birkaç tıklama ile varlığını tamamla.", cta: "Şimdi al" },
};

function formatQty(value: number) {
  return value.toLocaleString("fr-FR");
}

export default function UpsellSection({
  platform,
  service,
  locale,
}: {
  platform: string;
  service: string;
  locale: string;
}) {
  const normalized = (platform || "").toLowerCase();
  if (!(normalized in CATALOG)) return null;

  const config = CATALOG[normalized as UpsellPlatform];
  const alternatives = config.items.filter((item) => item.service !== service);
  if (alternatives.length === 0) return null;

  const copy = TITLE_COPY[locale] || TITLE_COPY.fr;

  return (
    <section className="upsell-section">
      <h2 className="upsell-title">{copy.title}</h2>
      <p className="upsell-sub">{copy.sub}</p>

      <div className="upsell-grid">
        {alternatives.map((item) => (
          <Link
            key={item.service}
            href={`/${normalized}?product=${item.productKey}`}
            className="upsell-card"
            style={{ "--upsell-accent": config.accent } as React.CSSProperties}
          >
            <div className="upsell-card-head">
              <span className="upsell-emoji" aria-hidden>{item.emoji}</span>
              <span className="upsell-label">{item.label}</span>
            </div>
            <div className="upsell-pack">
              <div className="upsell-qty">
                +{formatQty(item.popularPack.qty)}
                <span className="upsell-bonus">+{formatQty(item.popularPack.bonus)}</span>
              </div>
            </div>
            <div className="upsell-cta">
              {copy.cta}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .upsell-section {
          margin-top: 32px;
        }
        .upsell-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--ink);
          margin: 0 0 6px;
          text-align: center;
        }
        .upsell-sub {
          color: var(--ink-3);
          font-size: 14px;
          margin: 0 0 20px;
          text-align: center;
        }
        .upsell-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }
        .upsell-card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 18px;
          text-decoration: none;
          color: var(--ink);
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 20px -16px rgba(20, 22, 50, 0.18), 0 2px 6px -3px rgba(20, 22, 50, 0.04);
        }
        .upsell-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--upsell-accent), transparent 60%);
          opacity: 0;
          transition: opacity 0.25s;
          pointer-events: none;
        }
        .upsell-card:hover {
          border-color: var(--upsell-accent);
          box-shadow: 0 18px 36px -20px var(--upsell-accent);
          transform: translateY(-2px);
        }
        .upsell-card:hover::before {
          opacity: 0.06;
        }
        .upsell-card-head {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .upsell-emoji {
          font-size: 22px;
          line-height: 1;
        }
        .upsell-label {
          font-weight: 800;
          font-size: 15px;
          color: var(--ink);
        }
        .upsell-pack {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .upsell-qty {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: var(--upsell-accent);
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          line-height: 1.1;
        }
        .upsell-bonus {
          font-size: 11px;
          color: var(--green, #16a34a);
          font-weight: 700;
          padding: 3px 8px;
          background: rgba(34, 197, 94, 0.12);
          border-radius: 999px;
          letter-spacing: 0;
          white-space: nowrap;
        }
        .upsell-cta {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 18px;
          border-radius: 999px;
          background: var(--upsell-accent);
          color: white;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.01em;
          transition: filter 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 8px 18px -10px var(--upsell-accent);
        }
        .upsell-cta svg {
          transition: transform 0.2s;
        }
        .upsell-card:hover .upsell-cta {
          filter: brightness(1.06);
        }
        .upsell-card:hover .upsell-cta svg {
          transform: translateX(2px);
        }

        @media (max-width: 640px) {
          .upsell-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .upsell-card {
            padding: 16px;
            gap: 12px;
          }
          .upsell-qty {
            font-size: 20px;
          }
          .upsell-cta {
            padding: 12px 16px;
            font-size: 14px;
          }
        }
      `}</style>
    </section>
  );
}
