"use client";

import { useState } from "react";
import Image from "next/image";
import NetIcon from "../../components/NetIcon";
import StripeCheckout from "../../components/StripePayment";
import CouponField from "../../components/CouponField";
import YtSprinkle from "./YtSprinkle";
import Stepper from "./Stepper";
import { COUNTRIES, PACKS, formatQty, fmtEuro, type CountryId } from "../data";
import type { YtPreview } from "./Step2Username";
import { useYouTubeCopy } from "../i18n";
import { useI18n } from "../../i18n/I18nProvider";
import { getPublicCopy } from "../../components/publicCopy";
import { calculatePromoPricing, isDefaultPromoCode } from "../../lib/promoCodes";
import { usePromoFromUrl } from "../../lib/usePromoFromUrl";

type Props = {
  country: CountryId;
  pack: number;
  username: string; // video URL
  email: string;
  profile: YtPreview | null;
  clientSecret?: string | null;
  onBack: () => void;
  onBackToPacks: () => void;
};

export default function Step3Checkout({ country, pack, username, email, profile, clientSecret, onBack, onBackToPacks }: Props) {
  const t = useYouTubeCopy().step3;
  const { locale } = useI18n();
  const paymentCopy = getPublicCopy(locale).payment;
  const initialPromo = usePromoFromUrl();
  const [coupon, setCoupon] = useState(initialPromo.code);
  const [couponApplied, setCouponApplied] = useState(initialPromo.applied);

  const subtotal = PACKS[pack].price;
  const promo = calculatePromoPricing({
    subtotalCents: Math.round(subtotal * 100),
    promoCode: couponApplied ? coupon : "",
    allowTestPromo: true,
  });
  const discount = promo.discountCents / 100;
  const total = promo.amountCents / 100;
  const promoCode = couponApplied ? coupon : "";
  const canUsePrefetchedSecret = promo.discountCents === 0;

  const selectedCountry = COUNTRIES.find((c) => c.id === country)!;

  return (
    <section data-i18n-skip className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <YtSprinkle count={5} seed={4} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={3} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            {t.titleBefore} <span className="squiggle yt">{t.titleFocus}</span>{t.titleAfter}
          </h1>
          <p style={{ maxWidth: 540, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {t.subtitle}
          </p>
        </div>

        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div className="checkout-recap yt" style={{ background: "white", borderRadius: 22, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <NetIcon kind="youtube" color="var(--yt-red)" size={20} />
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--yt-red)" }}>
                {t.summary}
              </div>
            </div>

            {/* Video recap */}
            <div style={{ padding: "14px", background: "linear-gradient(135deg, rgba(255,0,0,0.06), rgba(204,0,0,0.06))", borderRadius: 14, display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
              <div style={{ position: "relative", width: 90, aspectRatio: "16 / 9", borderRadius: 8, overflow: "hidden", background: "#1a1a1a", flexShrink: 0 }}>
                {profile?.thumbnail ? (
                  <Image
                    src={profile.thumbnail}
                    alt={profile.title}
                    fill
                    unoptimized
                    sizes="90px"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "white" }}>
                    <NetIcon kind="youtube" color="white" size={20} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {t.recipient}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {profile?.title || t.fallbackRecipient}
                </div>
                {profile?.channel.name && (
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                    {profile.channel.name}
                  </div>
                )}
              </div>
              <button onClick={onBack} style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700, background: "white", borderRadius: 999, border: "1px solid var(--line)", cursor: "pointer", flexShrink: 0 }}>
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
              accentColor="var(--yt-red)"
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
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--yt-red)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {fmtEuro(total)}
              </div>
            </div>
            <div style={{ textAlign: "right", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)", textDecoration: "line-through" }}>
                {fmtEuro(PACKS[pack].old)}
              </div>
              {PACKS[pack].old - total > 0.005 && (
                <div style={{ fontSize: 13, color: "var(--yt-red)", fontWeight: 700, marginTop: 2 }}>
                  {paymentCopy.youSaveToday(fmtEuro(PACKS[pack].old - total))}
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 20, marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>
                {t.securePayment}</div>
              <StripeCheckout
                amount={promo.amountCents}
                email={email}
                username={username.trim()}
                platform="youtube"
                brandColor="var(--yt-red)"
                cart={[{ qty: PACKS[pack].qty, bonus: PACKS[pack].bonus, country, videoUrl: username.trim(), videoId: profile?.id }]}
                promoCode={promoCode}
                clientSecret={canUsePrefetchedSecret ? clientSecret : undefined}
              />
            </div>

            <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5 }}>
              {t.legalBefore} <a href="/cgv" style={{ color: "var(--ink-2)", textDecoration: "underline" }}>CGV</a>. {t.legalAfter}.
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--line)" }}>
              <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>SSL</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>OK 3D Secure</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>EU {t.gdpr}</span>
            </div>

            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button onClick={onBackToPacks} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--ink-3)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                {t.backToPacks}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
