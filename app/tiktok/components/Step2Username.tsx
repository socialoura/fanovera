"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import TtSprinkle from "./TtSprinkle";
import Stepper from "./Stepper";
import { PACKS, formatQty, type CountryId } from "../data";

export type TtProfile = {
  username: string;
  fullName: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  videoCount: number;
  bio: string;
  verified: boolean;
};

type Props = {
  country: CountryId;
  pack: number;
  username: string;
  setUsername: (u: string) => void;
  email: string;
  setEmail: (e: string) => void;
  profile: TtProfile | null;
  setProfile: (p: TtProfile | null) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function Step2Username({ country, pack, username, setUsername, email, setEmail, profile, setProfile, onNext, onBack }: Props) {
  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(!!profile);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clean = username.replace(/^@/, "").trim().toLowerCase();
  const valid = /^[a-zA-Z0-9._]{2,24}$/.test(clean);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleNext = () => {
    if (!username.trim()) {
      setSubmitError("Entrez votre pseudo TikTok.");
      return;
    }
    if (!verified) {
      if (verifying) setSubmitError("Verification du compte en cours...");
      else if (apiError === "not_found") setSubmitError("Ce compte est introuvable sur TikTok.");
      else if (apiError === "private") setSubmitError("Ce compte est prive. Passez-le en public pour continuer.");
      else setSubmitError("Entrez un pseudo TikTok valide et public.");
      return;
    }
    if (!emailValid) {
      setSubmitError("Entrez votre e-mail pour recevoir le recu.");
      return;
    }
    setSubmitError(null);
    onNext();
  };

  useEffect(() => {
    setVerified(false);
    setProfile(null);
    setApiError(null);
    if (!valid) return;

    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await fetch(`/api/tiktok/profile?username=${encodeURIComponent(clean)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          if (res.status === 404) setApiError("not_found");
          else if (res.status === 403) setApiError("private");
          else setApiError("upstream");
          setVerified(false);
        } else {
          setProfile(json as TtProfile);
          setVerified(true);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") setApiError("network");
      } finally {
        if (!controller.signal.aborted) setVerifying(false);
      }
    }, 500);

    return () => {
      clearTimeout(debounce);
      controller.abort();
      setVerifying(false);
    };
  }, [clean, valid]);

  void country;

  return (
    <section className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <TtSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            Quel <span className="squiggle tt">profil</span> souhaitez-vous promouvoir ?
          </h1>
          <p style={{ maxWidth: 540, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Entrez juste votre <strong style={{ color: "var(--ink)" }}>pseudo TikTok</strong>, c&apos;est tout. Aucun mot de passe, aucun acces demande. Le compte doit etre <strong style={{ color: "var(--ink)" }}>public</strong>.
          </p>
        </div>

        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 36, maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
              Votre nom d&apos;utilisateur TikTok
            </label>

            <div className="input-shell">
              <span style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 16 }}>@</span>
              <input
                type="text"
                placeholder="votrepseudo"
                value={clean}
                onChange={(e) => { setUsername(e.target.value); setTouched(true); }}
                onBlur={() => setTouched(true)}
                autoFocus
                spellCheck={false}
                autoCapitalize="none"
              />
              <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                {verifying && (
                  <div className="spinner" style={{ borderColor: "rgba(254,44,85,0.25)", borderTopColor: "var(--tt-red)" }}></div>
                )}
                {!verifying && verified && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {touched && !valid && clean.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--tt-red)", display: "flex", gap: 6, alignItems: "center" }}>
                <span>!</span> Format invalide. Lettres, chiffres, &quot;.&quot; et &quot;_&quot; uniquement (2-24 caracteres).
              </div>
            )}
            {valid && apiError === "not_found" && (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--tt-red)", display: "flex", gap: 6, alignItems: "center" }}>
                <span>!</span> Compte introuvable sur TikTok.
              </div>
            )}
            {valid && apiError === "private" && (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--tt-red)", display: "flex", gap: 6, alignItems: "center" }}>
                <span>!</span> Ce compte est prive. Passez-le en public pour continuer.
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                Votre e-mail (pour le recu)
              </label>
              <div className="input-shell">
                <input type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>
                On vous envoie uniquement votre facture. Pas de spam, jamais.
              </div>
            </div>

            <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
              <button onClick={onBack} className="btn-soft" style={{ padding: "14px 22px" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Retour
              </button>
              <button onClick={handleNext} className="btn-primary btn-tt" style={{ flex: 1, padding: "14px 26px", fontSize: 16 }}>
                Aller au paiement
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {submitError && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(254,44,85,0.08)", border: "1px solid rgba(254,44,85,0.25)", borderRadius: 12, fontSize: 13, color: "var(--tt-red)", display: "flex", gap: 8, alignItems: "center" }}>
                <span>!</span> {submitError}
              </div>
            )}
          </div>

          {/* TikTok profile preview */}
          <div className="tt-preview-col" style={{ position: "relative" }}>
            <div className="tt-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderBottom: "1px solid var(--line)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--tt-cyan), var(--tt-red))", display: "grid", placeItems: "center", color: "white", fontWeight: 800, fontSize: 22, overflow: "hidden", flexShrink: 0 }}>
                  {profile?.avatarUrl ? (
                    <Image
                      src={profile.avatarUrl}
                      alt={profile.username}
                      width={56}
                      height={56}
                      unoptimized
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span>{clean ? clean.charAt(0).toUpperCase() : "?"}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {clean ? "@" + clean : "@votrepseudo"}
                    </div>
                    {profile?.verified && (
                      <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
                        <circle cx="7" cy="7" r="6" fill="var(--tt-red)" />
                        <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  {profile?.fullName && profile.fullName !== profile.username && (
                    <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {profile.fullName}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                    {verified ? "Compte trouve - Public" : verifying ? "Verification..." : apiError ? "" : "En attente du pseudo"}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", textAlign: "center", padding: "16px 0", borderBottom: "1px solid var(--line)" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>
                    {profile ? formatQty(profile.followingCount) : "-"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>abonnements</div>
                </div>
                <div style={{ borderLeft: "1px solid var(--line)", borderRight: "1px solid var(--line)" }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: verified ? "var(--tt-red)" : "var(--ink)" }}>
                    {profile ? (
                      <span>
                        {formatQty(profile.followersCount)} <span style={{ fontSize: 12, color: "var(--green)" }}>
                          {"-> "}{formatQty(profile.followersCount + PACKS[pack].qty + PACKS[pack].bonus)}
                        </span>
                      </span>
                    ) : "-"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>followers</div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>
                    {profile ? formatQty(profile.likesCount) : "-"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>j&apos;aime</div>
                </div>
              </div>

            </div>

            <div className="floaty tt-new-total-sticker" style={{ position: "absolute", top: -14, right: -12, ["--r" as string]: "8deg" } as CSSProperties}>
              <div className="sticker">
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>NOUVEAU TOTAL</div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>+{formatQty(PACKS[pack].qty + PACKS[pack].bonus)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
