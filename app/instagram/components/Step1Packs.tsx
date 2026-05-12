import { useRef } from "react";
import NetIcon from "../../components/NetIcon";
import IgSprinkle from "./IgSprinkle";
import Stepper from "./Stepper";
import {
  COUNTRIES,
  PACKS,
  formatPrice,
  formatOld,
  formatQty,
  type CountryId,
} from "../data";

type Props = {
  country: CountryId;
  pack: number;
  setPack: (i: number) => void;
  onNext: () => void;
};

export default function Step1Packs({ country, pack, setPack, onNext }: Props) {
  const selectedPack = PACKS[pack];
  const savings =
    (selectedPack.old - selectedPack.price) * (country === "fr" ? COUNTRIES[0].mult : 1);
  const orderCardRef = useRef<HTMLDivElement | null>(null);

  const handlePackClick = (index: number) => {
    setPack(index);
    requestAnimationFrame(() => {
      orderCardRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  };

  return (
    <section className="slide-in" style={{ padding: "40px 0 0", position: "relative" }}>
      <IgSprinkle count={6} seed={0} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        {/* Mobile-only Instagram badge above stepper */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <div
            className="show-md-only"
            style={{
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background:
                "linear-gradient(135deg, rgba(250,126,30,0.12), rgba(214,41,118,0.12))",
              color: "var(--ig-2)",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              borderRadius: 999,
              textTransform: "uppercase",
            }}
          >
            <NetIcon kind="instagram" color="var(--ig-2)" size={14} />
            Instagram
          </div>
        </div>
        <Stepper step={1} />

        {/* Hero header */}
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 24px" }}>
          <div
            className="hide-md"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              background:
                "linear-gradient(135deg, rgba(250,126,30,0.12), rgba(214,41,118,0.12))",
              color: "var(--ig-2)",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              borderRadius: 999,
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            <NetIcon kind="instagram" color="var(--ig-2)" size={14} />
            Instagram
          </div>
          <h1
            className="display"
            style={{ margin: 0, fontSize: "clamp(26px, 4.4vw, 48px)" }}
          >
            Une visibilité Instagram <span className="squiggle ig">ciblée</span> & progressive.
          </h1>
        </div>

        {/* Pack grid */}
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              marginBottom: 12,
            }}
          >
            Quel volume ?
          </div>
          <div
            className="pack-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 14,
              marginBottom: 32,
            }}
          >
            {PACKS.map((p, i) => (
              <button
                key={i}
                onClick={() => handlePackClick(i)}
                className={`pack-tile ${pack === i ? "selected" : ""} ${
                  p.popular ? "popular" : ""
                } ${p.best ? "best" : ""}`}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--ink-3)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Audience
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {formatQty(p.qty)}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: "var(--green)",
                    fontWeight: 700,
                  }}
                >
                  +{formatQty(p.bonus)} inclus
                </div>
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: "1px dashed var(--line)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: pack === i ? "var(--ig-2)" : "var(--ink)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {formatPrice(p, country)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-3)",
                      textDecoration: "line-through",
                    }}
                  >
                    {formatOld(p, country)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CTA card */}
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
          }}
        >
          {/* Summary card */}
          <div
            ref={orderCardRef}
            style={{
              background: "white",
              border: "2px solid var(--ig-2)",
              borderRadius: 22,
              padding: 24,
              position: "relative",
              boxShadow: "0 18px 40px -16px rgba(214,41,118,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
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
                Votre campagne
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 0",
                borderBottom: "1px dashed var(--line)",
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: "var(--ink-2)" }}>Pack sélectionné</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>
                  Pack visibilité {formatQty(selectedPack.qty)}
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--green)",
                      fontWeight: 700,
                      marginLeft: 8,
                      padding: "2px 6px",
                      background: "rgba(77,191,138,0.12)",
                      borderRadius: 6,
                    }}
                  >
                    +{formatQty(selectedPack.bonus)} crédit inclus
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                padding: "14px 0",
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: "var(--ink-2)" }}>Total</div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: "var(--ig-2)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    marginTop: 4,
                  }}
                >
                  {formatPrice(selectedPack, country)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--ink-3)",
                    textDecoration: "line-through",
                  }}
                >
                  {formatOld(selectedPack, country)}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--green)",
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  Remise incluse {savings.toFixed(2).replace(".", ",")} €
                </div>
              </div>
            </div>

            <button
              className="btn-primary btn-ig"
              onClick={onNext}
              style={{ width: "100%", padding: "16px 26px", fontSize: 16, marginTop: 8 }}
            >
              Continuer
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 7h8M7 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div
              style={{
                textAlign: "center",
                marginTop: 12,
                fontSize: 12,
                color: "var(--ink-3)",
              }}
            >
              ✓ Sans engagement · ✓ Aucun mot de passe demandé
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
