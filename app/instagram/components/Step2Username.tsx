"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import IgSprinkle from "./IgSprinkle";
import Stepper from "./Stepper";
import { PACKS, formatQty, type CountryId } from "../data";

type Props = {
  country: CountryId;
  pack: number;
  username: string;
  setUsername: (u: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function Step2Username({
  country,
  pack,
  username,
  setUsername,
  onNext,
  onBack,
}: Props) {
  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const clean = username.replace(/^@/, "").trim();
  const valid = /^[a-zA-Z0-9._]{2,30}$/.test(clean);

  useEffect(() => {
    setVerified(false);
    if (!valid) return;
    setVerifying(true);
    const id = setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 900);
    return () => {
      clearTimeout(id);
      setVerifying(false);
    };
  }, [clean, valid]);

  void country;

  return (
    <section className="slide-in" style={{ padding: "40px 0 0", position: "relative" }}>
      <IgSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1
            className="display"
            style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}
          >
            À quel <span className="squiggle ig">compte</span> les envoyer ?
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
            Entrez juste votre <strong style={{ color: "var(--ink)" }}>pseudo Instagram</strong>,
            c&apos;est tout. Aucun mot de passe, aucun accès demandé. Le compte doit être{" "}
            <strong style={{ color: "var(--ink)" }}>public</strong>.
          </p>
        </div>

        <div
          className="checkout-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 0.9fr",
            gap: 28,
            maxWidth: 1000,
            margin: "0 auto",
          }}
        >
          {/* Form */}
          <div
            style={{
              background: "white",
              border: "1px solid var(--line)",
              borderRadius: 22,
              padding: 28,
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginBottom: 10,
              }}
            >
              Votre nom d&apos;utilisateur Instagram
            </label>

            <div className="input-shell">
              <span style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 16 }}>@</span>
              <input
                type="text"
                placeholder="votrepseudo"
                value={clean}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setTouched(true);
                }}
                onBlur={() => setTouched(true)}
                autoFocus
                spellCheck={false}
                autoCapitalize="none"
              />
              <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                {verifying && (
                  <div
                    className="spinner"
                    style={{
                      borderColor: "rgba(214,41,118,0.25)",
                      borderTopColor: "var(--ig-2)",
                    }}
                  ></div>
                )}
                {!verifying && verified && (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "var(--green)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 7l3 3 5-6"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {touched && !valid && clean.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: "var(--ig-2)",
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <span>⚠</span> Format invalide. Lettres, chiffres, &quot;.&quot; et &quot;_&quot;
                uniquement (2-30 caractères).
              </div>
            )}

            {/* Privacy callouts */}
            <div
              style={{
                marginTop: 24,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {[
                { i: "🔒", t: "Aucun mot de passe" },
                { i: "🛡", t: "100% sécurisé" },
                { i: "⚡", t: "Démarrage immédiat" },
                { i: "🇪🇺", t: "RGPD · UE" },
              ].map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    background: "var(--paper-2)",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <span>{c.i}</span>
                  <span>{c.t}</span>
                </div>
              ))}
            </div>

            {/* Email */}
            <div style={{ marginTop: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                  marginBottom: 10,
                }}
              >
                Votre e-mail (pour le reçu)
              </label>
              <div className="input-shell">
                <input type="email" placeholder="vous@exemple.com" />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>
                On vous envoie uniquement votre facture. Pas de spam, jamais.
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
              <button onClick={onBack} className="btn-soft" style={{ padding: "14px 22px" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M11 7H3M7 3L3 7l4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Retour
              </button>
              <button
                onClick={onNext}
                disabled={!verified}
                className="btn-primary btn-ig"
                style={{ flex: 1, padding: "14px 26px", fontSize: 16 }}
              >
                Aller au paiement
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
            </div>
          </div>

          {/* IG profile preview */}
          <div style={{ position: "relative" }}>
            <div className="ig-card">
              <div className="ig-card-top">
                <div className="ig-avatar">
                  <div className="ig-avatar-inner">
                    {clean ? clean.charAt(0).toUpperCase() : "?"}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {clean ? "@" + clean : "@votrepseudo"}
                    </div>
                    {verified && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        style={{ flexShrink: 0 }}
                      >
                        <circle cx="7" cy="7" r="6" fill="var(--ig-2)" />
                        <path
                          d="M4 7l2 2 4-4"
                          stroke="white"
                          strokeWidth="1.6"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                    {verified
                      ? "Compte trouvé · Public"
                      : verifying
                      ? "Recherche…"
                      : "En attente du pseudo"}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  textAlign: "center",
                  padding: "16px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>248</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>publications</div>
                </div>
                <div
                  style={{
                    borderLeft: "1px solid var(--line)",
                    borderRight: "1px solid var(--line)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 18,
                      color: verified ? "var(--ig-2)" : "var(--ink)",
                    }}
                  >
                    {verified ? (
                      <span>
                        1 842{" "}
                        <span style={{ fontSize: 12, color: "var(--green)" }}>
                          → {(1842 + PACKS[pack].qty + PACKS[pack].bonus).toLocaleString("fr-FR")}
                        </span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>abonnés</div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>312</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>abonnements</div>
                </div>
              </div>

              {/* Mock posts */}
              <div className="ig-grid-3" style={{ padding: 4 }}>
                {[
                  ["#fa7e1e", "#d62976"],
                  ["#962fbf", "#4f5bd5"],
                  ["#d62976", "#fa7e1e"],
                  ["#4f5bd5", "#962fbf"],
                  ["#fa7e1e", "#962fbf"],
                  ["#d62976", "#4f5bd5"],
                ].map((g, i) => (
                  <div
                    key={i}
                    className="ig-tile"
                    style={{
                      background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`,
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        color: "white",
                        opacity: 0.7,
                      }}
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating sticker */}
            <div
              className="floaty"
              style={
                {
                  position: "absolute",
                  top: -14,
                  right: -12,
                  ["--r" as string]: "8deg",
                } as CSSProperties
              }
            >
              <div className="sticker">
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "var(--green)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 7l3 3 5-6"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>
                    NOUVEAU TOTAL
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>
                    +{formatQty(PACKS[pack].qty + PACKS[pack].bonus)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
