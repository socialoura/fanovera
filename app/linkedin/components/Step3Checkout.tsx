"use client";

import { useState } from "react";
import Image from "next/image";
import NetIcon from "../../components/NetIcon";
import StripeCheckout from "../../components/StripePayment";
import CouponField from "../../components/CouponField";
import CheckoutUpsell, { type CheckoutUpsellItem } from "../../components/CheckoutUpsell";
import LiSprinkle from "./LiSprinkle";
import Stepper from "./Stepper";
import { COUNTRIES, PACKS, formatQty, fmtEuro, type CountryId } from "../data";
import type { LiProfile } from "./Step2Username";
import { useLinkedinCopy } from "../i18n";
import { useI18n } from "../../i18n/I18nProvider";
import { getPublicCopy } from "../../components/publicCopy";
import { calculatePromoPricing, isDefaultPromoCode } from "../../lib/promoCodes";
import { usePromoFromUrl } from "../../lib/usePromoFromUrl";

type Props = {
  country: CountryId;
  pack: number;
  username: string;
  email: string;
  profile: LiProfile | null;
  clientSecret?: string | null;
  onBack: () => void;
  onBackToPacks: () => void;
};

export default function Step3Checkout({ country, pack, username, email, profile, clientSecret, onBack, onBackToPacks }: Props) {
  const t = useLinkedinCopy();
  const { locale } = useI18n();
  const paymentCopy = getPublicCopy(locale).payment;
  const initialPromo = usePromoFromUrl();
  const [coupon, setCoupon] = useState(initialPromo.code);
  const [couponApplied, setCouponApplied] = useState(initialPromo.applied);
  const [upsell, setUpsell] = useState<CheckoutUpsellItem | null>(null);

  const subtotal = PACKS[pack].price;
  const promo = calculatePromoPricing({
    subtotalCents: Math.round(subtotal * 100),
    promoCode: couponApplied ? coupon : "",
    allowTestPromo: true,
  });
  const discount = promo.discountCents / 100;
  const upsellCents = upsell?.price_cents ?? 0;
  const finalAmountCents = promo.amountCents + upsellCents;
  const total = finalAmountCents / 100;
  const promoCode = couponApplied ? coupon : "";
  const canUsePrefetchedSecret = promo.discountCents === 0 && upsellCents === 0;

  const selectedCountry = COUNTRIES.find((c) => c.id === country)!;

  return (
    <section className="slide-in" data-i18n-skip style={{ padding: "40px 0 56px", position: "relative" }}>
      <LiSprinkle count={5} seed={4} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={3} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            {t.step3.titleBefore} <span className="squiggle li">{t.step3.titleFocus}</span>{t.step3.titleAfter}
          </h1>
          <p style={{ maxWidth: 540, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {t.step3.subtitle}
          </p>
        </div>

        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ background: "white", border: "2px solid var(--li-blue)", borderRadius: 22, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <NetIcon kind="linkedin" color="var(--li-blue)" size={20} />
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--li-blue)" }}>{t.step3.summary}</div>
              <button onClick={onBackToPacks} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--ink-3)", padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.step3.backToPacks}
              </button>
            </div>

            <div style={{ padding: "14px", background: "linear-gradient(135deg, rgba(10,102,194,0.08), rgba(8,77,146,0.06))", borderRadius: 14, display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, var(--li-blue), var(--li-blue-2))", display: "grid", placeItems: "center", color: "white", fontWeight: 800, fontSize: 20, overflow: "hidden", flexShrink: 0 }}>
                {profile?.avatarUrl ? (
                  <Image src={profile.avatarUrl} alt={profile.fullName} width={48} height={48} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span>{profile?.username ? profile.username.charAt(0).toUpperCase() : "?"}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t.step3.recipient}</div>
                <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile?.fullName || t.step3.fallbackRecipient}
                </div>
                {profile?.headline && (
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {profile.headline}
                  </div>
                )}
              </div>
              <button onClick={onBack} style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700, background: "white", borderRadius: 999, border: "1px solid var(--line)", cursor: "pointer", flexShrink: 0 }}>
                {t.step3.edit}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{formatQty(PACKS[pack].qty)}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{selectedCountry.flag} {selectedCountry.name}</div>
              </div>
              <div style={{ fontWeight: 700 }}>{fmtEuro(subtotal)}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14, color: "var(--green)", borderBottom: "1px dashed var(--line)" }}>
              <div>
                <div style={{ fontWeight: 600 }}>+{formatQty(PACKS[pack].bonus)} {t.step3.included}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{t.step3.campaignCredit}</div>
              </div>
              <div style={{ fontWeight: 700 }}>{t.step3.free}</div>
            </div>

            <CouponField
              coupon={coupon}
              setCoupon={setCoupon}
              couponApplied={couponApplied}
              setCouponApplied={setCouponApplied}
              initiallyExpanded={initialPromo.applied}
              accentColor="var(--li-blue)"
              labels={{
                haveCoupon: paymentCopy.haveCoupon,
                coupon: t.step3.coupon,
                couponPlaceholder: t.step3.couponPlaceholder,
                apply: t.step3.apply,
                applied: "✓ " + t.step3.applied,
              }}
              successMessage={
                couponApplied && promo.type !== "none" ? (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
                    {promo.isTestPromo ? `Code test - total ${fmtEuro(total)}` : `✓ ${t.step3.saving} ${fmtEuro(discount)}`}
                  </div>
                ) : undefined
              }
            />

            <CheckoutUpsell
              platform="linkedin"
              baseService="followers"
              locale={locale}
              accentColor="var(--li-blue)"
              onChange={setUpsell}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "16px 0 4px" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{t.step3.total}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--li-blue)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {fmtEuro(total)}
              </div>
            </div>
            <div style={{ textAlign: "right", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)", textDecoration: "line-through" }}>
                {fmtEuro(PACKS[pack].old)}
              </div>
              {PACKS[pack].old - total > 0.005 && (
                <div style={{ fontSize: 13, color: "var(--li-blue)", fontWeight: 700, marginTop: 2 }}>
                  {paymentCopy.youSaveToday(fmtEuro(PACKS[pack].old - total))}
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 20, marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>{t.step3.securePayment}</div>
              <StripeCheckout
                amount={finalAmountCents}
                email={email}
                username={username.replace(/^@/, "").trim()}
                platform="linkedin"
                brandColor="var(--li-blue)"
                cart={[
                  { service: "li_followers", qty: PACKS[pack].qty, bonus: PACKS[pack].bonus, country },
                  ...(upsell ? [{ service: upsell.service, qty: upsell.qty, upsell: true, upsellId: upsell.id, priceCents: upsell.price_cents }] : []),
                ]}
                promoCode={promoCode}
                clientSecret={canUsePrefetchedSecret ? clientSecret : undefined}
              />
            </div>

            <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5 }}>
              {t.step3.legalBefore} <a href="/cgv" style={{ color: "var(--ink-2)", textDecoration: "underline" }}>CGV</a>. {t.step3.legalAfter}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--line)" }}>
              <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>SSL</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>3D Secure</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>{t.step3.gdpr}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
