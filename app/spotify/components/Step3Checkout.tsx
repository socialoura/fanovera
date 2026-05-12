"use client";

import { useState } from "react";
import Image from "next/image";
import NetIcon from "../../components/NetIcon";
import StripeCheckout from "../../components/StripePayment";
import SpoSprinkle from "./SpoSprinkle";
import Stepper from "./Stepper";
import { COUNTRIES, PACKS, formatQty, fmtEuro, type CountryId } from "../data";
import type { SpoPreview } from "./Step2Track";

type Props = {
  country: CountryId;
  pack: number;
  trackInput: string;
  email: string;
  profile: SpoPreview | null;
  clientSecret?: string | null;
  onBack: () => void;
  onBackToPacks: () => void;
};

export default function Step3Checkout({ country, pack, trackInput, email, profile, clientSecret, onBack, onBackToPacks }: Props) {
  const [coupon, setCoupon] = useState("FANO5");
  const [couponApplied, setCouponApplied] = useState(true);

  const subtotal = PACKS[pack].price * (country === "fr" ? COUNTRIES[0].mult : 1);
  const discount = couponApplied ? subtotal * 0.05 : 0;
  const total = subtotal - discount;

  const selectedCountry = COUNTRIES.find((c) => c.id === country)!;

  return (
    <section className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <SpoSprinkle count={5} seed={4} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={3} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            Plus qu&apos;une <span className="squiggle spo">Ã©tape</span>.
          </h1>
          <p style={{ maxWidth: 540, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Paiement sécurisé · préparation de la campagne après confirmation.
          </p>
        </div>

        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div className="checkout-recap spo" style={{ background: "white", borderRadius: 22, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <NetIcon kind="spotify" color="var(--spo-green-2)" size={20} />
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--spo-green-2)" }}>RÃ©capitulatif</div>
            </div>

            <div style={{ padding: "14px", background: "linear-gradient(135deg, rgba(30,215,96,0.08), rgba(25,20,20,0.06))", borderRadius: 14, display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
              <div style={{ position: "relative", width: 64, height: 64, borderRadius: 8, overflow: "hidden", background: "var(--spo-ink)", flexShrink: 0 }}>
                {profile?.coverUrl ? (
                  <Image src={profile.coverUrl} alt={profile.trackName} fill unoptimized sizes="64px" style={{ objectFit: "cover" }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--spo-green)" }}>
                    <NetIcon kind="spotify" color="var(--spo-green)" size={24} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Morceau destinataire</div>
                <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile?.trackName || "Votre morceau"}
                </div>
                {profile?.artistName && (
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {profile.artistName}
                  </div>
                )}
              </div>
              <button onClick={onBack} style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700, background: "white", borderRadius: 999, border: "1px solid var(--line)", cursor: "pointer", flexShrink: 0 }}>
                Modifier
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14 }}>
              <div>
                <div style={{ fontWeight: 600 }}>Pack visibilité Spotify {formatQty(PACKS[pack].qty)}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{selectedCountry.flag} {selectedCountry.name}</div>
              </div>
              <div style={{ fontWeight: 700 }}>{fmtEuro(subtotal)}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14, color: "var(--green)", borderBottom: "1px dashed var(--line)" }}>
              <div>
                <div style={{ fontWeight: 600 }}>+{formatQty(PACKS[pack].bonus)} crédit inclus</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Crédit de campagne</div>
              </div>
              <div style={{ fontWeight: 700 }}>OFFERT</div>
            </div>

            <div style={{ padding: "14px 0", borderBottom: "1px dashed var(--line)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>Code promo</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div className="input-shell" style={{ flex: 1, padding: "4px 12px" }}>
                  <input type="text" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="CODE PROMO" style={{ textTransform: "uppercase", fontSize: 14 }} />
                </div>
                <button onClick={() => setCouponApplied(!couponApplied)} style={{ padding: "10px 16px", background: couponApplied ? "var(--green)" : "var(--paper-2)", color: couponApplied ? "white" : "var(--ink)", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  {couponApplied ? "âœ“ AppliquÃ©" : "Appliquer"}
                </button>
              </div>
              {couponApplied && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
                  âœ“ âˆ’5% appliquÃ© Â· Ã©conomie {fmtEuro(discount)}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "16px 0 4px" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Total TTC</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--spo-green-2)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                {fmtEuro(total)}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: "var(--ink-3)", textDecoration: "line-through", marginBottom: 16 }}>
              {fmtEuro(PACKS[pack].old * (country === "fr" ? COUNTRIES[0].mult : 1))}
            </div>

            <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 20, marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>Paiement sÃ©curisÃ©</div>
              <StripeCheckout
                amount={Math.round(total * 100)}
                email={email}
                username={trackInput.trim()}
                platform="spotify"
                brandColor="var(--spo-green-2)"
                cart={[{ qty: PACKS[pack].qty, bonus: PACKS[pack].bonus, country, trackUrl: trackInput.trim(), trackId: profile?.id }]}
                clientSecret={clientSecret}
              />
            </div>

            <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5 }}>
              En finalisant le paiement vous acceptez nos <a href="#cgv" style={{ color: "var(--ink-2)", textDecoration: "underline" }}>CGV</a>. Aucun abonnement cachÃ©.
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--line)" }}>
              <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>ðŸ”’ SSL</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>âœ“ 3D Secure</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>ðŸ‡ªðŸ‡º RGPD</span>
            </div>

            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button onClick={onBackToPacks} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--ink-3)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                Retour au choix des packs
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
