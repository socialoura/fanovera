"use client";

import { useState } from "react";
import Image from "next/image";
import NetIcon from "../../components/NetIcon";
import StripeCheckout from "../../components/StripePayment";
import XSprinkle from "./XSprinkle";
import Stepper from "./Stepper";
import { COUNTRIES, PACKS, formatQty, fmtEuro, type CountryId } from "../data";
import type { XProfile } from "./Step2Username";
import { useXCopy } from "../i18n";

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
  const [coupon, setCoupon] = useState("FANO5");
  const [couponApplied, setCouponApplied] = useState(true);

  const subtotal = PACKS[pack].price * (country === "fr" ? COUNTRIES[0].mult : 1);
  const discount = couponApplied ? subtotal * 0.05 : 0;
  const total = subtotal - discount;

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
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <NetIcon kind="twitter" color="var(--x-ink)" size={20} />
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--x-ink)" }}>{t.summary}</div>
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

            <div style={{ padding: "14px 0", borderBottom: "1px dashed var(--line)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t.coupon}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div className="input-shell" style={{ flex: 1, padding: "4px 12px" }}>
                  <input type="text" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder={t.couponPlaceholder} style={{ textTransform: "uppercase", fontSize: 14 }} />
                </div>
                <button onClick={() => setCouponApplied(!couponApplied)} style={{ padding: "10px 16px", background: couponApplied ? "var(--green)" : "var(--paper-2)", color: couponApplied ? "white" : "var(--ink)", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  {couponApplied ? t.applied : t.apply}
                </button>
              </div>
              {couponApplied && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
                  {t.saving} {fmtEuro(discount)}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "16px 0 4px" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{t.total}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--x-ink)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {fmtEuro(total)}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: "var(--ink-3)", textDecoration: "line-through", marginBottom: 16 }}>
              {fmtEuro(PACKS[pack].old * (country === "fr" ? COUNTRIES[0].mult : 1))}
            </div>

            <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 20, marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>{t.securePayment}</div>
              <StripeCheckout
                amount={Math.round(total * 100)}
                email={email}
                username={username.replace(/^@/, "").trim()}
                platform="twitter"
                brandColor="var(--x-ink)"
                cart={[{ qty: PACKS[pack].qty, bonus: PACKS[pack].bonus, country }]}
                clientSecret={clientSecret}
              />
            </div>

            <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5 }}>
              {t.legalBefore} <a href="#cgv" style={{ color: "var(--ink-2)", textDecoration: "underline" }}>{t.terms}</a>. {t.legalAfter}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--line)" }}>
              <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>SSL</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>3D Secure</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>{t.gdpr}</span>
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
