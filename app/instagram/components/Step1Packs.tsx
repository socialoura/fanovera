"use client";

import { useRef } from "react";
import NetIcon from "../../components/NetIcon";
import IgSprinkle from "./IgSprinkle";
import Stepper from "./Stepper";
import { PACKS, formatPrice, formatOld, formatQty, fmtEuro, type CountryId, type InstagramProductType, getPacksForProduct, defaultPackIndex } from "../data";
import { useInstagramCopy } from "../i18n";
import ValueFraming from "../../components/ValueFraming";

type Props = {
  country: CountryId;
  pack: number;
  setPack: (i: number) => void;
  onNext: () => void;
  productType: InstagramProductType;
  setProductType: (t: InstagramProductType) => void;
};

export default function Step1Packs({ country, pack, setPack, onNext, productType, setProductType }: Props) {
  const t = useInstagramCopy().step1;
  const packs = getPacksForProduct(productType);
  const safePack = Math.min(pack, packs.length - 1);
  const selectedPack = packs[safePack];
  const savings = selectedPack.old - selectedPack.price;
  const audienceLabel = productType === "likes" ? t.audienceLikes : productType === "views" ? t.audienceViews : t.audience;
  const orderCardRef = useRef<HTMLDivElement | null>(null);

  const handlePackClick = (index: number) => {
    setPack(index);
    requestAnimationFrame(() => {
      orderCardRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  };

  return (
    <section data-i18n-skip className="slide-in" style={{ padding: "40px 0 0", position: "relative" }}>
      <IgSprinkle count={6} seed={0} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div
            className="show-md-only"
            style={{
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "linear-gradient(135deg, rgba(250,126,30,0.12), rgba(214,41,118,0.12))",
              color: "var(--ig-2)",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              borderRadius: 999,
              textTransform: "uppercase",
            }}
          >
            <NetIcon kind="instagram" color="var(--ig-2)" size={14} />
            Instagram
          </div>
        </div>
        <Stepper step={1} />

        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 24px" }}>
          <div
            className="hide-md"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background: "linear-gradient(135deg, rgba(250,126,30,0.12), rgba(214,41,118,0.12))",
              color: "var(--ig-2)",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              borderRadius: 999,
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            <NetIcon kind="instagram" color="var(--ig-2)" size={14} />
            Instagram
          </div>
          <h1 className="display" style={{ margin: 0, fontSize: "clamp(26px, 4.4vw, 48px)" }}>
            {t.titleBefore} <span className="squiggle ig">{t.titleFocus}</span> {t.titleAfter}
          </h1>

          <div className="ig-mode-toggle" style={{ marginTop: 20, marginBottom: 0 }}>
            <button className={productType === "followers" ? "active" : ""} onClick={() => { setProductType("followers"); setPack(defaultPackIndex("followers")); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: -2 }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {t.productFollowers}
            </button>
            <button className={productType === "likes" ? "active" : ""} onClick={() => { setProductType("likes"); setPack(defaultPackIndex("likes")); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: -2 }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {t.productLikes}
            </button>
            <button className={productType === "views" ? "active" : ""} onClick={() => { setProductType("views"); setPack(defaultPackIndex("views")); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: -2 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {t.productViews}
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              marginBottom: 12,
            }}
          >
            {t.volume}
          </div>
          <div className="pack-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 32 }}>
            {packs.map((p, i) => (
              <button
                key={i}
                onClick={() => handlePackClick(i)}
                className={`pack-tile ${safePack === i ? "selected" : ""} ${p.popular ? "popular" : ""} ${p.best ? "best" : ""}`}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                  {audienceLabel}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {formatQty(p.qty)}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--green)", fontWeight: 700 }}>
                  +{formatQty(p.bonus)} {t.included}
                </div>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed var(--line)" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: safePack === i ? "var(--ig-2)" : "var(--ink)", letterSpacing: "-0.01em" }}>
                    {formatPrice(p, country)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", textDecoration: "line-through" }}>
                    {formatOld(p, country)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div
            ref={orderCardRef}
            style={{
              background: "white",
              border: "2px solid var(--ig-2)",
              borderRadius: 22,
              padding: 24,
              position: "relative",
              boxShadow: "0 18px 40px -16px rgba(214,41,118,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <NetIcon kind="instagram" color="var(--ig-2)" size={20} />
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ig-2)" }}>
                {t.campaign}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px dashed var(--line)" }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{t.selectedPack}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>
                  {formatQty(selectedPack.qty)}
                  <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 700, marginLeft: 8, padding: "2px 6px", background: "rgba(77,191,138,0.12)", borderRadius: 6 }}>
                    +{formatQty(selectedPack.bonus)} {t.included}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "14px 0" }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{t.total}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "var(--ig-2)", letterSpacing: "-0.02em", lineHeight: 1, marginTop: 4 }}>
                  {formatPrice(selectedPack, country)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "var(--ink-3)", textDecoration: "line-through" }}>
                  {formatOld(selectedPack, country)}
                </div>
                <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 700, marginTop: 4 }}>
                  {t.discount} {fmtEuro(savings)}
                </div>
              </div>
            </div>

            <button
              className="btn-primary btn-ig"
              data-testid="pricing-continue"
              onClick={onNext}
              style={{ width: "100%", padding: "16px 26px", fontSize: 16, marginTop: 8 }}
            >
              {t.continue}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "var(--ink-3)" }}>
              ✓ {t.reassurance}
            </div>
            <ValueFraming priceEur={selectedPack.price} qty={selectedPack.qty + selectedPack.bonus} />
          </div>
        </div>
      </div>
    </section>
  );
}
