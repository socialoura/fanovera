"use client";

import { useState } from "react";
import Image from "next/image";
import NetIcon from "../../components/NetIcon";
import StripeCheckout from "../../components/StripePayment";
import CouponField from "../../components/CouponField";
import CheckoutUpsell, { type CheckoutUpsellItem } from "../../components/CheckoutUpsell";
import IgSprinkle from "./IgSprinkle";
import Stepper from "./Stepper";
import { getPacksForProduct, getServiceForProduct, formatQty, fmtEuro, type CountryId, type InstagramProductType } from "../data";
import type { IgProfile } from "../InstagramPageClient";
import { useInstagramCopy } from "../i18n";
import { useI18n } from "../../i18n/I18nProvider";
import { getPublicCopy } from "../../components/publicCopy";
import { useCoupon } from "../../lib/useCoupon";
import { useCurrencyPreference } from "../../lib/useCurrencyPricing";

type Props = {
  country: CountryId;
  pack: number;
  username: string;
  postUrl?: string;
  email: string;
  profile: IgProfile | null;
  clientSecret?: string | null;
  onBack: () => void;
  onBackToPacks: () => void;
  productType?: InstagramProductType;
};

export default function Step3Checkout({ country, pack, username, postUrl = "", email, profile, clientSecret, onBack, onBackToPacks, productType = "followers" }: Props) {
  const igCopy = useInstagramCopy();
  const t = igCopy.step3;
  const { locale } = useI18n();
  const { currency } = useCurrencyPreference();
  const paymentCopy = getPublicCopy(locale).payment;
  const [upsell, setUpsell] = useState<CheckoutUpsellItem | null>(null);

  // Use the pack ladder for the SELECTED product (followers/likes/views/reposts),
  // not the hardcoded followers PACKS. Otherwise a likes/views/reposts order would
  // send followers quantities/prices to the cart — wrong charge AND wrong SMM qty.
  const packs = getPacksForProduct(productType);
  const safePack = Math.min(Math.max(0, pack), packs.length - 1);
  const selected = packs[safePack] ?? packs[0];
  const subtotal = selected.price;
  const { coupon, setCoupon, couponApplied, setCouponApplied, promo, initiallyExpanded } =
    useCoupon(Math.round(subtotal * 100));
  const discount = promo.discountCents / 100;
  const upsellCents = upsell?.price_cents ?? 0;
  const finalAmountCents = promo.amountCents + upsellCents;
  const total = finalAmountCents / 100;
  const promoCode = couponApplied ? coupon : "";
  const canUsePrefetchedSecret = promo.discountCents === 0 && upsellCents === 0;
  const clean = username.replace(/^@/, "").trim();
  const recipientLabel = clean ? "@" + clean : (postUrl.trim() || "@yourusername");

  return (
    <section data-i18n-skip className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <IgSprinkle count={5} seed={4} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={3} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            {t.titleBefore} <span className="squiggle ig">{t.titleFocus}</span>{t.titleAfter}
          </h1>
          <p style={{ maxWidth: 540, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {t.subtitle}
          </p>
        </div>

        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ background: "white", border: "2px solid var(--ig-2)", borderRadius: 22, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <NetIcon kind="instagram" color="var(--ig-2)" size={20} />
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ig-2)" }}>
                {t.summary}
              </div>
              <button
                onClick={onBackToPacks}
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--ink-3)", padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.backToPacks}
              </button>
            </div>

            <div style={{ padding: 14, background: "linear-gradient(135deg, rgba(250,126,30,0.08), rgba(214,41,118,0.08))", borderRadius: 14, display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
              <div className="ig-avatar" style={{ width: 44, height: 44 }}>
                {profile?.avatarUrl ? (
                  <Image src={profile.avatarUrl} alt={profile.username} width={44} height={44} unoptimized style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div className="ig-avatar-inner" style={{ fontSize: 18 }}>{clean ? clean.charAt(0).toUpperCase() : "?"}</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t.recipient}</div>
                <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{recipientLabel}</div>
                {profile && profile.followersCount > 0 && !postUrl.trim() && (
                  <div style={{ marginTop: 4, fontSize: 12, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ color: "var(--ink-2)" }}>{formatQty(profile.followersCount)}</span>
                    <span style={{ color: "var(--green)", fontWeight: 800 }}>→</span>
                    <span style={{ color: "var(--green)", fontWeight: 800 }}>{formatQty(profile.followersCount + selected.qty + selected.bonus)}</span>
                    <span style={{ color: "var(--ink-3)" }}>{igCopy.step1.audience}</span>
                  </div>
                )}
              </div>
              <button onClick={onBack} style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700, background: "white", borderRadius: 999, border: "1px solid var(--line)", cursor: "pointer", flexShrink: 0 }}>
                {t.edit}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{formatQty(selected.qty)}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{t.audienceLabel}</div>
              </div>
              <div style={{ fontWeight: 700 }}>{fmtEuro(subtotal)}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14, color: "var(--green)", borderBottom: "1px dashed var(--line)" }}>
              <div>
                <div style={{ fontWeight: 600 }}>+{formatQty(selected.bonus)} {t.included}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{t.campaignCredit}</div>
              </div>
              <div style={{ fontWeight: 700 }}>{t.free}</div>
            </div>

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

            <CheckoutUpsell
              platform="instagram"
              baseService={productType}
              locale={locale}
              accentColor="var(--ig-2)"
              currency={currency}
              onChange={setUpsell}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "16px 0 4px" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{t.total}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--ig-2)", letterSpacing: "-0.02em", lineHeight: 1 }}>{fmtEuro(total)}</div>
            </div>
            <div style={{ textAlign: "right", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)", textDecoration: "line-through" }}>
                {fmtEuro(selected.old)}
              </div>
              {selected.old - total > 0.005 && (
                <div style={{ fontSize: 13, color: "var(--ig-2)", fontWeight: 700, marginTop: 2 }}>
                  {paymentCopy.youSaveToday(fmtEuro(selected.old - total))}
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 20, marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>{t.securePayment}</div>
              {/* Reassurance at the point of maximum doubt — just above the pay
                  button. Guarantee + no-password directly counter the two top
                  fears on an SMM purchase (won't deliver / account safety). */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {[t.guarantee, t.noPassword].map((txt) => (
                  <div key={txt} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-2)" }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(77,191,138,0.15)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden>
                        <path d="M3 7l3 3 5-6" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>{txt}</span>
                  </div>
                ))}
              </div>
              <StripeCheckout
                amount={finalAmountCents}
                email={email}
                username={username.replace(/^@/, "").trim()}
                platform="instagram"
                brandColor="var(--ig-2)"
                cart={[
                  {
                    service: getServiceForProduct(productType),
                    qty: selected.qty,
                    bonus: selected.bonus,
                    country,
                    postUrl: postUrl.trim() || undefined,
                  },
                  ...(upsell
                    ? [{
                        service: upsell.service,
                        qty: upsell.qty,
                        upsell: true,
                        upsellId: upsell.id,
                        priceCents: upsell.price_cents,
                      }]
                    : []),
                ]}
                promoCode={promoCode}
                clientSecret={canUsePrefetchedSecret ? clientSecret : undefined}
              />
            </div>

            <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5 }}>
              {t.legalBefore} <a href="/cgv" style={{ color: "var(--ink-2)", textDecoration: "underline" }}>{t.terms}</a>. {t.legalAfter}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--line)" }}>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>SSL</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>✓ 3D Secure</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{t.gdpr}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
