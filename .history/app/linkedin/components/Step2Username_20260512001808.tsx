"use client";

import { useEffect, useState } from "react";
import LiSprinkle from "./LiSprinkle";
import Stepper from "./Stepper";
import { type CountryId } from "../data";

export type LiProfile = {
  username: string;
  fullName: string;
  headline: string;
  avatarUrl: string;
  backgroundUrl: string;
  bio: string;
  geo: string;
  isTopVoice: boolean;
  isCreator: boolean;
  isPremium: boolean;
  currentPosition: string;
  currentCompany: string;
  followersCount: number;
  connectionsCount: number;
};

type Props = {
  country: CountryId;
  pack: number;
  username: string;
  setUsername: (u: string) => void;
  email: string;
  setEmail: (e: string) => void;
  profile: LiProfile | null;
  setProfile: (p: LiProfile | null) => void;
  onNext: () => void;
  onBack: () => void;
};

const LI_RE = /linkedin\.com\/in\/([a-zA-Z0-9\-_]+)/;

function extractHandle(input: string): string | null {
  const trimmed = input.replace(/^@/, "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http") || trimmed.includes("linkedin.com")) {
    const m = trimmed.match(LI_RE);
    if (!m) return null;
    return m[1].replace(/\/.*$/, "");
  }
  if (/^[a-zA-Z0-9\-_]{3,100}$/.test(trimmed)) return trimmed;
  return null;
}

export default function Step2Username({
  country, pack, username, setUsername, email, setEmail, profile, setProfile, onNext, onBack,
}: Props) {
  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(!!profile);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handle = extractHandle(username);
  const valid = !!handle;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleNext = () => {
    if (!username.trim()) { setSubmitError("Collez le lien ou l'identifiant de votre profil LinkedIn."); return; }
    if (!valid) { setSubmitError("Format invalide. Ex : linkedin.com/in/votre-profil ou votre-profil"); return; }
    if (!verified) {
      if (verifying) setSubmitError("Vérification du profil en cours…");
      else if (apiError === "not_found") setSubmitError("Profil introuvable sur LinkedIn.");
      else setSubmitError("Profil non trouvé. Vérifiez qu'il est public.");
      return;
    }
    if (!emailValid) { setSubmitError("Entrez votre e-mail pour recevoir le reçu."); return; }
    setSubmitError(null);
    onNext();
  };

  useEffect(() => {
    setVerified(false);
    setProfile(null);
    setApiError(null);
    if (!handle) return;

    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await fetch(`/api/linkedin/profile?username=${encodeURIComponent(handle)}`, { signal: controller.signal });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          setApiError(res.status === 404 ? "not_found" : "upstream");
          setVerified(false);
        } else {
          setProfile(json as LiProfile);
          setVerified(true);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") setApiError("network");
      } finally {
        if (!controller.signal.aborted) setVerifying(false);
      }
    }, 500);

    return () => { clearTimeout(debounce); controller.abort(); setVerifying(false); };
  }, [handle, setProfile]);

  void country;
  void pack;

  return (
    <section className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <LiSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            Quel <span className="squiggle li">profil</span> booster ?
          </h1>
          <p style={{ maxWidth: 580, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Collez le lien de votre profil LinkedIn ou votre identifiant. Aucun mot de passe, aucun accès demandé. Le profil doit être <strong style={{ color: "var(--ink)" }}>public</strong>.
          </p>
        </div>

        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
              Lien ou identifiant LinkedIn
            </label>

            <div className="input-shell li">
              <input
                type="text"
                placeholder="linkedin.com/in/votre-profil"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setTouched(true); }}
                onBlur={() => setTouched(true)}
                autoFocus
                spellCheck={false}
                autoCapitalize="none"
              />
              <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                {verifying && <div className="spinner" style={{ borderColor: "rgba(10,102,194,0.25)", borderTopColor: "var(--li-blue)" }}></div>}
                {!verifying && verified && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {touched && !valid && username.trim().length > 0 && (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--li-blue)", display: "flex", gap: 6, alignItems: "center" }}>
                <span>⚠</span> Format invalide. Ex : https://linkedin.com/in/votre-profil
              </div>
            )}
            {valid && apiError === "not_found" && (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--li-blue)", display: "flex", gap: 6, alignItems: "center" }}>
                <span>⚠</span> Profil LinkedIn introuvable.
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                Votre e-mail (pour le reçu)
              </label>
              <div className="input-shell li">
                <input type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>On vous envoie uniquement votre facture. Pas de spam, jamais.</div>
            </div>

            <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
              <button onClick={onBack} className="btn-soft" style={{ padding: "14px 22px" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Retour
              </button>
              <button onClick={handleNext} className="btn-primary btn-li" style={{ flex: 1, padding: "14px 26px", fontSize: 16 }}>
                Aller au paiement
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {submitError && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(10,102,194,0.08)", border: "1px solid rgba(10,102,194,0.25)", borderRadius: 12, fontSize: 13, color: "var(--li-blue)", display: "flex", gap: 8, alignItems: "center" }}>
                <span>⚠</span> {submitError}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
