"use client";

import { useState } from "react";
import NetIcon from "../../components/NetIcon";
import StripeCheckout from "../../components/StripePayment";
import IgSprinkle from "./IgSprinkle";
import Stepper from "./Stepper";
import { COUNTRIES, PACKS, formatQty, fmtEuro, type CountryId } from "../data";

type Props = {
  country: CountryId;
  pack: number;
  username: string;
  email: string;
  onBack: () => void;
};

export default function Step3Checkout({ country, pack, username, email, onBack }: Props) {
  const [coupon, setCoupon] = useState("FANO5");
  const [couponApplied, setCouponApplied] = useState(true);

  const subtotal = PACKS[pack].price * (country === "fr" ? COUNTRIES[0].mult : 1);
  const discount = couponApplied ? subtotal * 0.05 : 0;
  const total = subtotal - discount;

  const clean = username.replace(/^@/, "").trim();
  const selectedCountry = COUNTRIES.find((c) => c.id === country)!;

  return (
    <section className="slide-in" style={{ padding: "40px 0 0", position: "relative" }}>
      <IgSprinkle count={5} seed={4} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={3} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1
            className="display"
            style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}
          >
            Plus qu&apos;une <span className="squiggle ig">étape</span>.
          </h1>
          <p
            style={{
              maxWidth: 540,
              margin: "0 auto",
              fontSize: 16,
              color: "var(--ink-2)",
              lineHeight: 1.55,
            }}
          >
            Paiement sécurisé · livraison automatique dès la confirmation.
          </p>
        </div>

        <div
          className="checkout-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 28,
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          {/* LEFT: payment */}
          <div
            style={{
              background: "white",
              border: "1px solid var(--line)",
              borderRadius: 22,
              padding: 28,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginBottom: 16,
              }}
            >
              Paiement sécurisé
            </div>

            <StripeCheckout
              amount={Math.round(total * 100)}
              email={email}
              username={username.replace(/^@/, "").trim()}
              platform="instagram"
              brandColor="var(--ig-2)"
              cart={[{ qty: PACKS[pack].qty, bonus: PACKS[pack].bonus, country }]}
            />

            <div
              style={{
                marginTop: 20,
                padding: "14px 16px",
                background: "var(--paper-2)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
              }}
            >
              <span style={{ fontSize: 18 }}>🔒</span>
              <div>
                Paiement chiffré <strong>SSL 256-bit</strong> via Stripe · Conforme{" "}
                <strong>PCI DSS</strong> · 3D Secure
              </div>
            </div>
          </div>

          {/* RIGHT: recap */}
          <div>
            <div
              style={{
                background: "white",
                border: "2px solid var(--ig-2)",
                borderRadius: 22,
                padding: 24,
                position: "sticky",
                top: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <NetIcon kind="instagram" color="var(--ig-2)" size={20} />
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--ig-2)",
                  }}
                >
                  Récapitulatif
                </div>
              </div>

              {/* Recipient */}
              <div
                style={{
                  padding: "14px",
                  background:
                    "linear-gradient(135deg, rgba(250,126,30,0.08), rgba(214,41,118,0.08))",
                  borderRadius: 14,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <div className="ig-avatar" style={{ width: 44, height: 44 }}>
                  <div className="ig-avatar-inner" style={{ fontSize: 18 }}>
                    {clean ? clean.charAt(0).toUpperCase() : "?"}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-3)",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    Compte destinataire
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {clean ? "@" + clean : "@votrepseudo"}
                  </div>
                </div>
                <button
                  onClick={onBack}
                  style={{
                    padding: "6px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    background: "white",
                    borderRadius: 999,
                    border: "1px solid var(--line)",
                    cursor: "pointer",
                  }}
                >
                  Modifier
                </button>
              </div>

              {/* Items */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  fontSize: 14,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {formatQty(PACKS[pack].qty)} abonnés Instagram
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {selectedCountry.flag} {selectedCountry.name}
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>{fmtEuro(subtotal)}</div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  fontSize: 14,
                  color: "var(--green)",
                  borderBottom: "1px dashed var(--line)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    +{formatQty(PACKS[pack].bonus)} abonnés offerts
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Bonus du pack</div>
                </div>
                <div style={{ fontWeight: 700 }}>OFFERT</div>
              </div>

              {/* Coupon */}
              <div style={{ padding: "14px 0", borderBottom: "1px dashed var(--line)" }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--ink-3)",
                    marginBottom: 8,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Code promo
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div className="input-shell" style={{ flex: 1, padding: "4px 12px" }}>
                    <input
                      type="text"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="CODE PROMO"
                      style={{ textTransform: "uppercase", fontSize: 14 }}
                    />
                  </div>
                  <button
                    onClick={() => setCouponApplied(!couponApplied)}
                    style={{
                      padding: "10px 16px",
                      background: couponApplied ? "var(--green)" : "var(--paper-2)",
                      color: couponApplied ? "white" : "var(--ink)",
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {couponApplied ? "✓ Appliqué" : "Appliquer"}
                  </button>
                </div>
                {couponApplied && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: "var(--green)",
                      fontWeight: 600,
                    }}
                  >
                    ✓ −5% appliqué · économie {fmtEuro(discount)}
                  </div>
                )}
              </div>

              {/* Total */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  padding: "16px 0 4px",
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700 }}>Total TTC</div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: "var(--ig-2)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {fmtEuro(total)}
                </div>
              </div>
              <div
                style={{
                  textAlign: "right",
                  fontSize: 12,
                  color: "var(--ink-3)",
                  textDecoration: "line-through",
                  marginBottom: 16,
                }}
              >
                {fmtEuro(PACKS[pack].old * (country === "fr" ? COUNTRIES[0].mult : 1))}
              </div>

              <div
                style={{
                  textAlign: "center",
                  marginTop: 14,
                  fontSize: 11,
                  color: "var(--ink-3)",
                  lineHeight: 1.5,
                }}
              >
                En finalisant le paiement vous acceptez nos{" "}
                <a
                  href="#cgv"
                  style={{ color: "var(--ink-2)", textDecoration: "underline" }}
                >
                  CGV
                </a>
                . Aucun abonnement caché. Livraison instantanée après paiement.
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 10,
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px dashed var(--line)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--ink-3)",
                    display: "flex",
                    gap: 4,
                    alignItems: "center",
                  }}
                >
                  🔒 SSL
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--ink-3)",
                    display: "flex",
                    gap: 4,
                    alignItems: "center",
                  }}
                >
                  ✓ 3D Secure
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--ink-3)",
                    display: "flex",
                    gap: 4,
                    alignItems: "center",
                  }}
                >
                  🇪🇺 RGPD
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
