"use client";

import { useState } from "react";
import Image from "next/image";
import NetIcon from "../../components/NetIcon";
import StripeCheckout from "../../components/StripePayment";
import TtSprinkle from "./TtSprinkle";
import Stepper from "./Stepper";
import { COUNTRIES, PACKS, formatQty, fmtEuro, type CountryId } from "../data";
import type { TtProfile } from "./Step2Username";

type Props = {
  country: CountryId;
  pack: number;
  username: string;
  email: string;
  profile: TtProfile | null;
  clientSecret?: string | null;
  onBack: () => void;
  onBackToPacks: () => void;
};

export default function Step3Checkout({ country, pack, username, email, profile, clientSecret, onBack, onBackToPacks }: Props) {
  const [coupon, setCoupon] = useState("FANO5");
  const [couponApplied, setCouponApplied] = useState(true);

  const subtotal = PACKS[pack].price;
  const discount = couponApplied ? subtotal * 0.05 : 0;
  const total = subtotal - discount;

  const clean = username.replace(/^@/, "").trim();
  const selectedCountry = COUNTRIES.find((c) => c.id === country)!;

  return (
    <section className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <TtSprinkle count={5} seed={4} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={3} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            Plus qu&apos;une <span className="squiggle tt">etape</span>.
          </h1>
          <p style={{ maxWidth: 540, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Paiement sécurisé · préparation de la campagne après confirmation.
          </p>
        </div>

        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ background: "white", border: "2px solid var(--tt-red)", borderRadius: 22, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <NetIcon kind="tiktok" color="var(--tt-red)" size={20} />
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--tt-red)" }}>Recapitulatif</div>
              </div>

              <div style={{ padding: "14px", background: "linear-gradient(135deg, rgba(37,244,238,0.08), rgba(254,44,85,0.08))", borderRadius: 14, display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, var(--tt-cyan), var(--tt-red))", display: "grid", placeItems: "center", color: "white", fontWeight: 800, fontSize: 18, overflow: "hidden", flexShrink: 0 }}>
                  {profile?.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt={profile.username} width={44} height={44} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    clean ? clean.charAt(0).toUpperCase() : "?"
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Compte destinataire</div>
                  <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {clean ? "@" + clean : "@votrepseudo"}
                  </div>
                </div>
                <button onClick={onBack} style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700, background: "white", borderRadius: 999, border: "1px solid var(--line)", cursor: "pointer" }}>
                  Modifier
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
                  <div style={{ fontWeight: 600 }}>+{formatQty(PACKS[pack].bonus)} inclus</div>
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
                    {couponApplied ? "Applique" : "Appliquer"}
                  </button>
                </div>
                {couponApplied && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
                    -5% applique - economie {fmtEuro(discount)}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "16px 0 4px" }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Total TTC</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "var(--tt-red)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {fmtEuro(total)}
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: 12, color: "var(--ink-3)", textDecoration: "line-through", marginBottom: 16 }}>
                {fmtEuro(PACKS[pack].old)}
              </div>

              <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 20, marginTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 14 }}>Paiement securise</div>
                <StripeCheckout
                  amount={Math.round(total * 100)}
                  email={email}
                  username={username.replace(/^@/, "").trim()}
                  platform="tiktok"
                  brandColor="var(--tt-red)"
                  cart={[{ qty: PACKS[pack].qty, bonus: PACKS[pack].bonus, country }]}
                  clientSecret={clientSecret}
                />
              </div>

              <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5 }}>
                En finalisant le paiement vous acceptez nos <a href="#cgv" style={{ color: "var(--ink-2)", textDecoration: "underline" }}>CGV</a>. Aucun abonnement cache.
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--line)" }}>
                <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>SSL</span>
                <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>3D Secure</span>
                <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>RGPD</span>
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
