"use client";

import { useState } from "react";
import Image from "next/image";
import NetIcon from "../../components/NetIcon";
import StripeCheckout from "../../components/StripePayment";
import CouponField from "../../components/CouponField";
import CheckoutUpsell, { type CheckoutUpsellItem } from "../../components/CheckoutUpsell";
import XSprinkle from "./XSprinkle";
import Stepper from "./Stepper";
import { COUNTRIES, PACKS, formatQty, fmtEuro, type CountryId } from "../data";
import type { XProfile } from "./Step2Username";
import { useXCopy } from "../i18n";
import { useI18n } from "../../i18n/I18nProvider";
import { getPublicCopy } from "../../components/publicCopy";
import { calculatePromoPricing, isDefaultPromoCode } from "../../lib/promoCodes";
import { usePromoFromUrl } from "../../lib/usePromoFromUrl";

type Props = {
  country: CountryId;
  pack: number;
  username: string;
  email: string;
  profile: XProfile | null;
  clientSecret?: string | null;
  onBack: () => void;
  onBackToPacks: () => void;
};

export default function Step3Checkout({ country, pack, username, email, profile, clientSecret, onBack, onBackToPacks }: Props) {
  const t = useXCopy().step3;
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

  const clean = username.replace(/^@/, "").trim();
  const selectedCountry = COUNTRIES.find((c) => c.id === country)!;

  return (
    <section data-i18n-skip className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <XSprinkle count={5} seed={4} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={3} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            {t.titleBefore} <span className="squiggle x">{t.titleFocus}</span>{t.titleAfter}
          </h1>
          <p style={{ maxWidth: 540, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {t.subtitle}
          </p>
        </div>

        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ background: "white", border: "2px solid var(--x-ink)", borderRadius: 22, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <NetIcon kind="twitter" color="var(--x-ink)" size={20} />
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--x-ink)" }}>{t.summary}</div>
              <button onClick={onBackToPacks} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--ink-3)", padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.backToPacks}
              </button>
            </div>

            <div style={{ padding: "14px", background: "linear-gradient(135deg, rgba(0,0,0,0.04), rgba(29,155,240,0.08))", borderRadius: 14, display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--x-ink)", color: "white", fontWeight: 800, fontSize: 18, display: "grid", placeItems: "center", overflow: "hidden", flexShrink: 0 }}>
                {profile?.avatarUrl ? (
                  <Image src={profile.avatarUrl} alt={profile.username} width={44} height={44} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span>{clean ? clean.charAt(0).toUpperCase() : "?"}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t.recipient}</div>
                <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {clean ? "@" + clean : "@votrepseudo"}
                </div>
              </div>
              <button onClick={onBack} style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700, background: "white", borderRadius: 999, border: "1px solid var(--line)", cursor: "pointer" }}>
                {t.edit}
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
                <div style={{ fontWeight: 600 }}>+{formatQty(PACKS[pack].bonus)} {t.included}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{t.campaignCredit}</div>
              </div>
              <div style={{ fontWeight: 700 }}>{t.free}</div>
            </div>

            <CouponField
              coupon={coupon}
              setCoupon={setCoupon}
              couponApplied={couponApplied}
              setCouponApplied={setCouponApplied}
              initiallyExpanded={initialPromo.applied}
              accentColor="var(--x-ink)"
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
              platform="twitter"
              baseService="followers"
              locale={locale}
              accentColor="var(--x-ink)"
              onChange={setUpsell}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "16px 0 4px" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{t.total}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--x-ink)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {fmtEuro(total)}
              </div>
            </div>
            <div style={{ textAlign: "right", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)", textDecoration: "line-through" }}>
                {fmtEuro(PACKS[pack].old)}
              </div>
              {PACKS[pack].old - total > 0.005 && (
                <div style={{ fontSize: 13, color: "var(--x-ink)", fontWeight: 700, marginTop: 2 }}>
                  {paymentCopy.youSaveToday(fmtEuro(PACKS[pack].old - total))}
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 20, marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>{t.securePayment}</div>
              <StripeCheckout
                amount={finalAmountCents}
                email={email}
                username={username.replace(/^@/, "").trim()}
                platform="twitter"
                brandColor="var(--x-ink)"
                cart={[
                  { service: "x_followers", qty: PACKS[pack].qty, bonus: PACKS[pack].bonus, country },
                  ...(upsell ? [{ service: upsell.service, qty: upsell.qty, upsell: true, upsellId: upsell.id, priceCents: upsell.price_cents }] : []),
                ]}
                promoCode={promoCode}
                clientSecret={canUsePrefetchedSecret ? clientSecret : undefined}
              />
            </div>

            <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5 }}>
              {t.legalBefore} <a href="/cgv" style={{ color: "var(--ink-2)", textDecoration: "underline" }}>{t.terms}</a>. {t.legalAfter}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--line)" }}>
              <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>SSL</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>3D Secure</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>{t.gdpr}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
