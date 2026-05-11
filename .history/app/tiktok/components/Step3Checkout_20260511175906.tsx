"use client";

import { useState, type ReactNode } from "react";
import NetIcon from "../../components/NetIcon";
import TtSprinkle from "./TtSprinkle";
import Stepper from "./Stepper";
import { COUNTRIES, PACKS, formatQty, fmtEuro, type CountryId } from "../data";

type Props = {
  country: CountryId;
  pack: number;
  username: string;
  onBack: () => void;
};

type PayMethod = "card" | "apple" | "google" | "paypal";

export default function Step3Checkout({ country, pack, username, onBack }: Props) {
  const [paymethod, setPaymethod] = useState<PayMethod>("card");
  const [coupon, setCoupon] = useState("FANO5");
  const [couponApplied, setCouponApplied] = useState(true);

  const subtotal = PACKS[pack].price * (country === "fr" ? COUNTRIES[0].mult : 1);
  const discount = couponApplied ? subtotal * 0.05 : 0;
  const total = subtotal - discount;

  const clean = username.replace(/^@/, "").trim();
  const selectedCountry = COUNTRIES.find((c) => c.id === country)!;

  const methods: { id: PayMethod; label: string; icon: ReactNode }[] = [
    {
      id: "card", label: "Carte",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="13" rx="2" />
          <path d="M2 11h20" />
        </svg>
      ),
    },
    { id: "apple", label: "Apple Pay", icon: <span style={{ fontSize: 22 }}></span> },
    { id: "google", label: "G Pay", icon: <span style={{ fontWeight: 800, fontSize: 14 }}>G</span> },
    { id: "paypal", label: "PayPal", icon: <span style={{ fontWeight: 800, fontSize: 12, color: "#003087" }}>Pay<span style={{ color: "#009cde" }}>Pal</span></span> },
  ];

  return (
    <section className="slide-in" style={{ padding: "40px 0 0", position: "relative" }}>
      <TtSprinkle count={5} seed={4} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={3} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            Plus qu&apos;une <span className="squiggle tt">étape</span>.
          </h1>
          <p style={{ maxWidth: 540, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Paiement sécurisé · livraison automatique dès la confirmation.
          </p>
        </div>

        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 28, maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 12 }}>
              Méthode de paiement
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 24 }}>
              {methods.map((m) => (
                <button key={m.id} onClick={() => setPaymethod(m.id)} style={{ padding: "14px 8px", background: paymethod === m.id ? "white" : "var(--paper-2)", border: "2px solid " + (paymethod === m.id ? "var(--tt-red)" : "transparent"), borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", transition: "all .2s" }}>
                  {m.icon}
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)" }}>{m.label}</div>
                </button>
              ))}
            </div>

            {paymethod === "card" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--ink-3)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>Numéro de carte</label>
                  <div className="input-shell" style={{ padding: "6px 12px 6px 16px" }}>
                    <input type="text" placeholder="1234 5678 9012 3456" defaultValue="4242 4242 4242 4242" />
                    <div style={{ display: "flex", gap: 4, paddingRight: 4 }}><span style={{ fontSize: 18 }}>💳</span></div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--ink-3)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>Expiration</label>
                    <div className="input-shell"><input type="text" placeholder="MM/AA" defaultValue="12/28" /></div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--ink-3)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>CVC</label>
                    <div className="input-shell"><input type="text" placeholder="•••" defaultValue="123" /></div>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--ink-3)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>Nom sur la carte</label>
                  <div className="input-shell"><input type="text" placeholder="Jean Dupont" /></div>
                </div>
              </div>
            )}
            {paymethod !== "card" && (
              <div style={{ padding: "24px", background: "var(--paper-2)", borderRadius: 14, textAlign: "center", color: "var(--ink-2)", fontSize: 14 }}>
                Vous serez redirigé vers <strong style={{ color: "var(--ink)" }}>{paymethod === "apple" ? "Apple Pay" : paymethod === "google" ? "Google Pay" : "PayPal"}</strong> pour finaliser le paiement de manière sécurisée.
              </div>
            )}

            <div style={{ marginTop: 20, padding: "14px 16px", background: "var(--paper-2)", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span style={{ fontSize: 18 }}>🔒</span>
              <div>Paiement chiffré <strong>SSL 256-bit</strong> via Stripe · Conforme <strong>PCI DSS</strong> · 3D Secure</div>
            </div>
          </div>

          <div>
            <div style={{ background: "white", border: "2px solid var(--tt-red)", borderRadius: 22, padding: 24, position: "sticky", top: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <NetIcon kind="tiktok" color="var(--tt-red)" size={20} />
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--tt-red)" }}>Récapitulatif</div>
              </div>

              <div style={{ padding: "14px", background: "linear-gradient(135deg, rgba(37,244,238,0.08), rgba(254,44,85,0.08))", borderRadius: 14, display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, var(--tt-cyan), var(--tt-red))", display: "grid", placeItems: "center", color: "white", fontWeight: 800, fontSize: 18 }}>
                  {clean ? clean.charAt(0).toUpperCase() : "?"}
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
                  <div style={{ fontWeight: 600 }}>{formatQty(PACKS[pack].qty)} followers TikTok</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{selectedCountry.flag} {selectedCountry.name}</div>
                </div>
                <div style={{ fontWeight: 700 }}>{fmtEuro(subtotal)}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14, color: "var(--green)", borderBottom: "1px dashed var(--line)" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>+{formatQty(PACKS[pack].bonus)} followers offerts</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Bonus du pack</div>
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
                    {couponApplied ? "✓ Appliqué" : "Appliquer"}
                  </button>
                </div>
                {couponApplied && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
                    ✓ −5% appliqué · économie {fmtEuro(discount)}
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
                {fmtEuro(PACKS[pack].old * (country === "fr" ? COUNTRIES[0].mult : 1))}
              </div>

              <button className="btn-primary btn-tt" style={{ width: "100%", padding: "16px 26px", fontSize: 16 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 6.5V4a3.5 3.5 0 1 1 7 0v2.5M2.5 6.5h9v6h-9z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Payer {fmtEuro(total)}
              </button>

              <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5 }}>
                En cliquant vous acceptez nos <a href="#cgv" style={{ color: "var(--ink-2)", textDecoration: "underline" }}>CGV</a>. Aucun abonnement caché. Livraison instantanée après paiement.
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--line)" }}>
                <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>🔒 SSL</span>
                <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>✓ 3D Secure</span>
                <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}>🇪🇺 RGPD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
