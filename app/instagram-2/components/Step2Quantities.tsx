"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import NetIcon from "../../components/NetIcon";
import IgSprinkle from "../../instagram/components/IgSprinkle";
import { formatQty, fmtEuro, type Pack } from "../../instagram/data";
import { useInstagramCopy } from "../../instagram/i18n";
import Stepper from "./Stepper";
import { ProdIcon, ArrowRight } from "./icons";
import { useI2Copy } from "../copy";
import { PRODUCT_META, PRODUCT_ORDER, type ProductKey, type Selection } from "../products";
import type { IgProfile } from "../types";

// Soft tints + accent inks per product accent. Pink (followers/likes) reuses the
// Instagram magenta; blue (views/Reels) leans on the IG gradient's blue end.
const ACCENT_SOFT: Record<"ig" | "blue", string> = {
  ig: "rgba(214,41,118,0.10)",
  blue: "rgba(79,91,213,0.12)",
};
const ACCENT_INK: Record<"ig" | "blue", string> = {
  ig: "var(--ig-2)",
  blue: "#4f5bd5",
};

type Props = {
  profile: IgProfile | null;
  username: string;
  sel: Selection;
  setSel: (s: Selection) => void;
  needsPosts: boolean;
  variant?: "chips" | "slider";
  onNext: () => void;
  onBack: () => void;
};

export default function Step2Quantities({ profile, username, sel, setSel, needsPosts, variant = "chips", onNext, onBack }: Props) {
  const c = useI2Copy().step2;
  const t1 = useInstagramCopy().step1;
  const clean = (profile?.username || username).replace(/^@/, "").trim();

  const labels: Record<ProductKey, string> = {
    followers: t1.productFollowers,
    likes: t1.productLikes,
    views: t1.productViews,
  };
  const subs: Record<ProductKey, string> = {
    followers: c.subFollowers,
    likes: c.subLikes,
    views: c.subViews,
  };

  const total = PRODUCT_ORDER.reduce((sum, k) => {
    const i = sel[k];
    return sum + (i != null ? PRODUCT_META[k].packs[i].price : 0);
  }, 0);
  const anySelected = PRODUCT_ORDER.some((k) => sel[k] != null);
  const baseFollowers = profile?.followersCount ?? 0;
  const followersAdd = sel.followers != null ? PRODUCT_META.followers.packs[sel.followers].qty + PRODUCT_META.followers.packs[sel.followers].bonus : 0;
  const newFollowers = baseFollowers + followersAdd;

  return (
    <section className="slide-in" style={{ padding: "40px 0 0", position: "relative" }}>
      <IgSprinkle count={4} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} needsPosts={needsPosts} />

        <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 32px" }}>
          <h1 className="display" style={{ fontSize: "clamp(30px,3.6vw,46px)", margin: "0 0 10px" }}>
            {c.titleBefore} <span className="squiggle ig">{c.titleFocus}</span>{c.titleAfter}
          </h1>
          <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.5, maxWidth: 520, margin: "0 auto" }}>{c.intro}</p>
        </div>

        <div className="checkout-grid ig2-two-col" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, maxWidth: 1100, margin: "0 auto", alignItems: "start" }}>
          {/* LEFT: profile + selectors */}
          <div>
            {/* Profile card */}
            <div className="ig2-profile-card" style={{ background: "white", border: "1px solid var(--line)", borderRadius: 20, padding: "20px 22px", marginBottom: 18, display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--ig-1), var(--ig-2) 50%, var(--ig-4))", padding: 3, flexShrink: 0 }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--paper)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 26, color: "var(--ink)", overflow: "hidden" }}>
                  {profile?.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt={clean} width={58} height={58} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                  ) : (
                    clean.charAt(0).toUpperCase() || "?"
                  )}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 18, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{clean}</span>
                  {profile?.verified && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#3897f0" style={{ flexShrink: 0 }} aria-label="verified">
                      <path d="M12 2l2.4 1.8 3 .1 1 2.8 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.2 15.5l.9-2.9-.9-2.9 2.4-1.8 1-2.8 3-.1z" />
                      <path d="M10.6 14.6l-2.2-2.2 1.1-1.1 1.1 1.1 3.3-3.3 1.1 1.1z" fill="#fff" />
                    </svg>
                  )}
                </div>
                <div className="ig2-stat-row" style={{ display: "flex", gap: 16, marginTop: 8 }}>
                  <Stat label={c.statFollowers} value={sel.followers != null
                    ? <span>{formatQty(baseFollowers)} <span style={{ fontSize: 12, color: "var(--green)" }}>{"-> "}{formatQty(newFollowers)}</span></span>
                    : formatQty(baseFollowers)} />
                  <Stat label={c.statFollowing} value={formatQty(profile?.followingCount ?? 0)} />
                  <Stat label={c.statPosts} value={formatQty(profile?.mediaCount ?? 0)} />
                </div>
              </div>
              <button onClick={onBack} className="ig2-change-btn" style={{ padding: "6px 12px", fontSize: 12, fontWeight: 700, background: "var(--paper-2)", borderRadius: 999, alignSelf: "flex-start", border: "none", cursor: "pointer", flexShrink: 0 }}>
                {c.change}
              </button>
            </div>

            {/* Product selectors */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {PRODUCT_ORDER.map((k) => {
                const common = {
                  pkey: k,
                  label: labels[k],
                  sub: subs[k] + (PRODUCT_META[k].needsPosts ? " " + c.needsPostsNote : ""),
                  selIdx: sel[k],
                  removeLabel: c.remove,
                  onSelect: (i: number | null) => setSel({ ...sel, [k]: i }),
                };
                return variant === "slider"
                  ? <ProductSlider key={k} {...common} />
                  : <ProductSelector key={k} {...common} />;
              })}
            </div>
          </div>

          {/* RIGHT: sticky summary */}
          <div className="ig2-sticky">
            <div style={{ background: "white", border: "2px solid var(--ig-2)", borderRadius: 22, padding: 24, boxShadow: "0 18px 40px -18px rgba(214,41,118,0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <NetIcon kind="instagram" color="var(--ig-2)" size={18} />
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>{c.orderTitle}</div>
              </div>

              {!anySelected && (
                <div style={{ padding: "24px 12px", textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>
                  <div style={{ fontSize: 30, marginBottom: 8 }}>🛒</div>
                  {c.emptyCart}
                </div>
              )}

              {PRODUCT_ORDER.map((k) => {
                if (sel[k] == null) return null;
                const p = PRODUCT_META[k].packs[sel[k] as number];
                const accent = PRODUCT_META[k].accent;
                return (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px dashed var(--line)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: ACCENT_SOFT[accent], display: "grid", placeItems: "center", color: ACCENT_INK[accent] }}>
                        <ProdIcon kind={PRODUCT_META[k].icon} size={16} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{formatQty(p.qty)} {labels[k].toLowerCase()}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtEuro(p.price)}</div>
                  </div>
                );
              })}

              {anySelected && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "16px 0 10px" }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{c.total}</div>
                  <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>{fmtEuro(total)}</div>
                </div>
              )}

              <button className="btn-primary btn-ig" onClick={onNext} disabled={!anySelected} style={{ width: "100%", padding: 15, fontSize: 16 }}>
                {c.continue}
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 15 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{label}</div>
    </div>
  );
}

function ProductSelector({
  pkey,
  label,
  sub,
  selIdx,
  removeLabel,
  onSelect,
}: {
  pkey: ProductKey;
  label: string;
  sub: string;
  selIdx: number | null;
  removeLabel: string;
  onSelect: (i: number | null) => void;
}) {
  const meta = PRODUCT_META[pkey];
  const c = useI2Copy().step2;
  const on = selIdx != null;
  const blue = meta.accent === "blue";
  const [expanded, setExpanded] = useState(false);

  // Only surface a curated handful of tiers by default (the entry tiers + the
  // "TOP" one) so the visitor isn't drowned in 10 packs per product. The long
  // tail (big-volume tiers) lives behind a "+ N more" toggle. Pricing is still
  // server-validated by exact qty+bonus, so hiding packs is purely cosmetic.
  const VISIBLE = 4;
  const popularIdx = meta.packs.findIndex((p) => p.popular);
  const maxIdx = meta.packs.length - 1; // packs are sorted ascending by qty
  const allIdx = meta.packs.map((_, i) => i);
  const curated = popularIdx >= VISIBLE
    ? [...allIdx.slice(0, VISIBLE - 1), popularIdx]
    : allIdx.slice(0, VISIBLE);
  // Keep a selected long-tail pack visible even when collapsed.
  const shownIdx = expanded
    ? allIdx
    : selIdx != null && !curated.includes(selIdx)
      ? [...curated, selIdx].sort((a, b) => a - b)
      : curated;
  const hiddenCount = meta.packs.length - curated.length;

  return (
    <div className={`ig2-prod-card ${on ? "on" : ""}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: on ? 16 : 4 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: ACCENT_SOFT[meta.accent], display: "grid", placeItems: "center", color: ACCENT_INK[meta.accent] }}>
          <ProdIcon kind={meta.icon} size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{label}</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{sub}</div>
        </div>
        {on && (
          <button onClick={() => onSelect(null)} style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", padding: "4px 8px", background: "none", border: "none", cursor: "pointer" }}>
            {removeLabel}
          </button>
        )}
      </div>
      <div className="ig2-qty-row" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {shownIdx.map((i) => {
          const p: Pack = meta.packs[i];
          const isSel = selIdx === i;
          return (
            <button key={i} className={`ig2-qty-chip ${isSel ? "sel " + (blue ? "blue" : "") : ""}`} onClick={() => onSelect(i)}>
              {p.popular && <span className="ig2-qty-top">★ TOP</span>}
              {i === maxIdx && !p.popular && <span className="ig2-qty-top" style={{ background: "var(--ig-2)" }}>★ MAX</span>}
              <div style={{ fontWeight: 800, fontSize: 16 }}>{compactQty(p.qty)}</div>
              {p.bonus > 0 && <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--green)", marginTop: 1 }}>+{compactQty(p.bonus)}</div>}
              <div style={{ fontSize: 12.5, color: isSel ? "var(--ink)" : "var(--ink-3)", fontWeight: 800, marginTop: 3 }}>{fmtEuro(p.price)}</div>
            </button>
          );
        })}
      </div>
      {hiddenCount > 0 && (
        <button type="button" className="ig2-more-btn" onClick={() => setExpanded((v) => !v)}>
          {expanded ? c.lessOptions : c.moreOptions(hiddenCount)}
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Compact quantity for chips: 1 000 → "1k", 1 000 000 → "1M".
function compactQty(q: number): string {
  if (q >= 1_000_000) return (q % 1_000_000 === 0 ? q / 1_000_000 : +(q / 1_000_000).toFixed(1)) + "M";
  if (q >= 1000) return (q % 1000 === 0 ? q / 1000 : +(q / 1000).toFixed(1)) + "k";
  return String(q);
}

// Slider variant (A/B): one range per product across tier indices. Shows the
// exact same info as the chips (qty + bonus + price) so the test isolates the
// control type, not the data. Off state = product not in the cart; dragging or
// the "Add" button selects a tier.
function ProductSlider({
  pkey,
  label,
  sub,
  selIdx,
  onSelect,
}: {
  pkey: ProductKey;
  label: string;
  sub: string;
  selIdx: number | null;
  removeLabel: string;
  onSelect: (i: number | null) => void;
}) {
  const meta = PRODUCT_META[pkey];
  const c = useI2Copy().step2;
  const blue = meta.accent === "blue";
  const on = selIdx != null;
  // Slider position 0 = "not included" (removes the product); positions 1..n map
  // to pack indices 0..n-1. One control, no separate add/remove buttons.
  const sliderMax = meta.packs.length;
  const sliderVal = on ? (selIdx as number) + 1 : 0;
  const p = on ? meta.packs[selIdx as number] : null;
  const pct = (sliderVal / sliderMax) * 100;

  return (
    <div className={`ig2-prod-card ${on ? "on" : ""}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: ACCENT_SOFT[meta.accent], display: "grid", placeItems: "center", color: ACCENT_INK[meta.accent] }}>
          <ProdIcon kind={meta.icon} size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>{label}</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{sub}</div>
        </div>
      </div>

      {/* Live readout */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 4, minHeight: 28 }}>
        {on && p ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.01em" }}>{formatQty(p.qty)}</span>
              {p.bonus > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: "var(--green)" }}>+{formatQty(p.bonus)}</span>}
            </div>
            <span style={{ fontWeight: 800, fontSize: 20, color: ACCENT_INK[meta.accent], flexShrink: 0 }}>{fmtEuro(p.price)}</span>
          </>
        ) : (
          <>
            <span style={{ fontWeight: 800, fontSize: 22, color: "var(--ink-3)" }}>0</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", flexShrink: 0 }}>{c.dragHint} →</span>
          </>
        )}
      </div>

      <input
        type="range"
        min={0}
        max={sliderMax}
        step={1}
        value={sliderVal}
        aria-label={label}
        className={`ig2-range ${blue ? "blue" : ""} ${on ? "" : "off"}`}
        style={{ ["--pct" as string]: pct + "%" } as CSSProperties}
        onChange={(e) => {
          const v = Number(e.target.value);
          onSelect(v <= 0 ? null : v - 1);
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)", marginTop: 6, fontWeight: 700 }}>
        <span>{c.none}</span>
        <span>{compactQty(meta.packs[meta.packs.length - 1].qty)}</span>
      </div>
    </div>
  );
}
