"use client";

import { useState } from "react";
import Image from "next/image";
import NetIcon from "../../components/NetIcon";
import StripeCheckout from "../../components/StripePayment";
import CouponField from "../../components/CouponField";
import IgSprinkle from "../../instagram/components/IgSprinkle";
import { formatQty, fmtEuro } from "../../instagram/data";
import { useInstagramCopy } from "../../instagram/i18n";
import { useI18n } from "../../i18n/I18nProvider";
import { getPublicCopy } from "../../components/publicCopy";
import { useCoupon } from "../../lib/useCoupon";
import { useCurrencyPreference } from "../../lib/useCurrencyPricing";
import Stepper from "./Stepper";
import { ProdIcon } from "./icons";
import { useI2Copy } from "../copy";
import { PRODUCT_META, PRODUCT_ORDER, type ProductKey, type Selection } from "../products";
import type { IgProfile, IgPost } from "../types";

type Props = {
  country: string;
  profile: IgProfile | null;
  username: string;
  email: string;
  setEmail: (e: string) => void;
  sel: Selection;
  selectedPosts: IgPost[];
  needsPosts: boolean;
  onBack: () => void;
  onBackToStart: () => void;
};

export default function Step4Checkout({ country, profile, username, email, setEmail, sel, selectedPosts, needsPosts, onBack, onBackToStart }: Props) {
  const igCopy = useInstagramCopy();
  const t = igCopy.step3;
  const t2 = igCopy.step2;
  const c = useI2Copy().step2;
  const { locale } = useI18n();
  const { currency } = useCurrencyPreference();
  const paymentCopy = getPublicCopy(locale).payment;
  const [emailBlurred, setEmailBlurred] = useState(false);

  const labels: Record<ProductKey, string> = {
    followers: igCopy.step1.productFollowers,
    likes: igCopy.step1.productLikes,
    views: igCopy.step1.productViews,
  };

  const clean = (profile?.username || username).replace(/^@/, "").trim();
  const postUrls = selectedPosts.map((p) => p.url).filter(Boolean);

  // Build one-liner recap: "1 000 followers + 5 000 likes on 4 posts → @handle"
  const recapParts: string[] = [];
  PRODUCT_ORDER.forEach((k) => {
    const i = sel[k];
    if (i == null) return;
    const p = PRODUCT_META[k].packs[i];
    recapParts.push(`${formatQty(p.qty + p.bonus)} ${labels[k].toLowerCase()}`);
  });
  const recapPosts = selectedPosts.length > 0
    ? (locale === "fr" ? ` sur ${selectedPosts.length} publication${selectedPosts.length > 1 ? "s" : ""}` : ` across ${selectedPosts.length} post${selectedPosts.length > 1 ? "s" : ""}`)
    : "";
  const recapLine = recapParts.join(" + ") + recapPosts + ` → @${clean}`;

  const subtotal = PRODUCT_ORDER.reduce((sum, k) => {
    const i = sel[k];
    return sum + (i != null ? PRODUCT_META[k].packs[i].price : 0);
  }, 0);
  const subtotalCents = Math.round(subtotal * 100);

  const { coupon, setCoupon, couponApplied, setCouponApplied, promo, initiallyExpanded } = useCoupon(subtotalCents);
  const discount = promo.discountCents / 100;
  const finalAmountCents = promo.amountCents;
  const total = finalAmountCents / 100;
  const promoCode = couponApplied ? coupon : "";

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Build the multi-product cart. Likes/views carry the selected posts so
  // fulfillment spreads each pack across them (one BulkFollows sub-order/post).
  const cart = PRODUCT_ORDER.flatMap((k) => {
    const i = sel[k];
    if (i == null) return [];
    const p = PRODUCT_META[k].packs[i];
    const meta = PRODUCT_META[k];
    return [{
      service: meta.service,
      qty: p.qty,
      bonus: p.bonus,
      country,
      ...(meta.needsPosts && postUrls.length ? { postUrls } : {}),
    }];
  });

  return (
    <section className="slide-in" style={{ padding: "40px 0 0", position: "relative" }}>
      <IgSprinkle count={5} seed={6} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={4} needsPosts={needsPosts} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 32px" }}>
          <h1 className="display" style={{ fontSize: "clamp(30px,3.6vw,46px)", margin: "0 0 10px" }}>
            {t.titleBefore} <span className="squiggle ig">{t.titleFocus}</span>{t.titleAfter}
          </h1>
          <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>{t.subtitle}</p>
        </div>

        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ background: "white", border: "2px solid var(--ig-2)", borderRadius: 22, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              <NetIcon kind="instagram" color="var(--ig-2)" size={20} />
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ig-2)" }}>{t.summary}</div>
              <button onClick={onBackToStart} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--ink-3)", padding: 0 }}>
                {c.change}
              </button>
            </div>

            {/* Recap one-liner */}
            <div style={{ padding: "10px 14px", background: "var(--paper-2)", borderRadius: 12, marginBottom: 14, fontSize: 14, fontWeight: 700, color: "var(--ink)", textAlign: "center" }}>
              {recapLine}
            </div>

            {/* Recipient */}
            <div style={{ padding: 14, background: "linear-gradient(135deg, rgba(254,218,117,0.10), rgba(214,41,118,0.10) 55%, rgba(79,91,213,0.10))", borderRadius: 14, display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, var(--ig-1), var(--ig-2) 50%, var(--ig-4))", display: "grid", placeItems: "center", color: "white", fontWeight: 800, fontSize: 18, overflow: "hidden", flexShrink: 0 }}>
                {profile?.avatarUrl ? (
                  <Image src={profile.avatarUrl} alt={clean} width={44} height={44} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  clean.charAt(0).toUpperCase() || "?"
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t.recipient}</div>
                <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{clean}</div>
              </div>
              <button onClick={onBack} style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700, background: "white", borderRadius: 999, border: "1px solid var(--line)", cursor: "pointer", flexShrink: 0 }}>
                {t.edit}
              </button>
            </div>

            {/* Items */}
            {PRODUCT_ORDER.map((k) => {
              if (sel[k] == null) return null;
              const p = PRODUCT_META[k].packs[sel[k] as number];
              const meta = PRODUCT_META[k];
              const blue = meta.accent === "blue";
              return (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 0", fontSize: 14, borderBottom: "1px dashed var(--line)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: blue ? "rgba(79,91,213,0.12)" : "rgba(214,41,118,0.10)", display: "grid", placeItems: "center", color: blue ? "#4f5bd5" : "var(--ig-2)" }}>
                      <ProdIcon kind={meta.icon} size={15} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{formatQty(p.qty)} {labels[k].toLowerCase()} <span style={{ color: "var(--green)", fontWeight: 700 }}>+{formatQty(p.bonus)}</span></div>
                      {meta.needsPosts && postUrls.length > 0 && (
                        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                          {locale === "fr" ? `réparti sur ${postUrls.length} publication${postUrls.length > 1 ? "s" : ""}` : `across ${postUrls.length} post${postUrls.length > 1 ? "s" : ""}`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, flexShrink: 0 }}>{fmtEuro(p.price)}</div>
                </div>
              );
            })}

            <CouponField
              coupon={coupon}
              setCoupon={setCoupon}
              couponApplied={couponApplied}
              setCouponApplied={setCouponApplied}
              initiallyExpanded={initiallyExpanded}
              accentColor="var(--ig-2)"
              labels={{
                haveCoupon: paymentCopy.haveCoupon,
                coupon: t.coupon,
                couponPlaceholder: t.couponPlaceholder,
                apply: t.apply,
                applied: t.applied,
              }}
              successMessage={
                couponApplied && promo.type !== "none" ? (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
                    {promo.isTestPromo ? `Code test - total ${fmtEuro(total)}` : `${t.saving} ${fmtEuro(discount)}`}
                  </div>
                ) : undefined
              }
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "16px 0 4px" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{t.total}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--ig-2)", letterSpacing: "-0.02em", lineHeight: 1 }}>{fmtEuro(total)}</div>
            </div>

            {/* Email */}
            <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 18, marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                <label htmlFor="ig2-email" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)" }}>{t2.emailLabel}</label>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}>{t2.emailHint}</span>
              </div>
              <div className="input-shell">
                <input
                  id="ig2-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={t2.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailBlurred(true)}
                />
                {emailValid && email.trim() && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, marginRight: 8 }}>
                    <circle cx="12" cy="12" r="10" fill="var(--green)" />
                    <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {emailBlurred && email.trim() && !emailValid && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#c98a00" }}>{t2.errors.emailIncomplete}</div>
              )}
            </div>

            <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 20, marginTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>{t.securePayment}</div>
              <StripeCheckout
                amount={finalAmountCents}
                currency={currency}
                email={email}
                username={clean}
                platform="instagram"
                brandColor="var(--ig-2)"
                cart={cart}
                promoCode={promoCode}
                followersBefore={profile?.followersCount ?? 0}
              />
            </div>

            <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5 }}>
              {t.legalBefore} <a href="/cgv" style={{ color: "var(--ink-2)", textDecoration: "underline" }}>{t.terms}</a>. {t.legalAfter}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
