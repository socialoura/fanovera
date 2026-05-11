"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import TwSprinkle from "./TwSprinkle";
import Stepper from "./Stepper";
import { PACKS, formatQty, type CountryId } from "../data";

export type TwProfile = {
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  isPartner: boolean;
  isAffiliate: boolean;
  isLive: boolean;
  lastBroadcastTitle: string;
  streamTitle: string;
  followersCount: number;
  viewersCount: number;
  gameName: string;
};

type Props = {
  country: CountryId;
  pack: number;
  username: string;
  setUsername: (u: string) => void;
  email: string;
  setEmail: (e: string) => void;
  profile: TwProfile | null;
  setProfile: (p: TwProfile | null) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function Step2Username({
  country, pack, username, setUsername, email, setEmail, profile, setProfile, onNext, onBack,
}: Props) {
  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(!!profile);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clean = username.replace(/^@/, "").replace(/^twitch\.tv\//, "").trim().toLowerCase();
  // Twitch usernames: 4-25 chars, letters/digits/underscore
  const valid = /^[a-zA-Z0-9_]{4,25}$/.test(clean);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleNext = () => {
    if (!username.trim()) { setSubmitError("Entrez votre nom de chaîne Twitch."); return; }
    if (!valid) { setSubmitError("Format invalide. 4-25 caractères : lettres, chiffres, \"_\"."); return; }
    if (!verified) {
      if (verifying) setSubmitError("Vérification de la chaîne en cours…");
      else if (apiError === "not_found") setSubmitError("Cette chaîne est introuvable sur Twitch.");
      else setSubmitError("Chaîne non trouvée.");
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
    if (!valid) return;

    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await fetch(`/api/twitch/profile?username=${encodeURIComponent(clean)}`, { signal: controller.signal });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          setApiError(res.status === 404 ? "not_found" : "upstream");
          setVerified(false);
        } else {
          setProfile(json as TwProfile);
          setVerified(true);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") setApiError("network");
      } finally {
        if (!controller.signal.aborted) setVerifying(false);
      }
    }, 500);

    return () => { clearTimeout(debounce); controller.abort(); setVerifying(false); };
  }, [clean, valid, setProfile]);

  void country;

  return (
    <section className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <TwSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            À quelle <span className="squiggle tw">chaîne</span> les envoyer ?
          </h1>
          <p style={{ maxWidth: 580, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Entrez juste votre <strong style={{ color: "var(--ink)" }}>nom de chaîne Twitch</strong>. Aucun mot de passe, aucun accès demandé. La chaîne doit être <strong style={{ color: "var(--ink)" }}>publique</strong>.
          </p>
        </div>

        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 36, maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
              Nom de votre chaîne Twitch
            </label>

            <div className="input-shell tw">
              <span style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 14 }}>twitch.tv/</span>
              <input
                type="text"
                placeholder="votrechaine"
                value={clean}
                onChange={(e) => { setUsername(e.target.value); setTouched(true); }}
                onBlur={() => setTouched(true)}
                autoFocus
                spellCheck={false}
                autoCapitalize="none"
              />
              <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                {verifying && <div className="spinner" style={{ borderColor: "rgba(145,70,255,0.25)", borderTopColor: "var(--tw-purple)" }}></div>}
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
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--tw-purple)", display: "flex", gap: 6, alignItems: "center" }}>
                <span>⚠</span> Format invalide. 4-25 caractères : lettres, chiffres, &quot;_&quot; uniquement.
              </div>
            )}
            {valid && apiError === "not_found" && (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--tw-purple)", display: "flex", gap: 6, alignItems: "center" }}>
                <span>⚠</span> Chaîne Twitch introuvable.
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                Votre e-mail (pour le reçu)
              </label>
              <div className="input-shell tw">
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
              <button onClick={handleNext} className="btn-primary btn-tw" style={{ flex: 1, padding: "14px 26px", fontSize: 16 }}>
                Aller au paiement
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {submitError && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(145,70,255,0.08)", border: "1px solid rgba(145,70,255,0.25)", borderRadius: 12, fontSize: 13, color: "var(--tw-purple)", display: "flex", gap: 8, alignItems: "center" }}>
                <span>⚠</span> {submitError}
              </div>
            )}
          </div>

          {/* Twitch channel preview */}
          <div className="tw-preview-col" style={{ position: "relative", order: 1 }}>
            <div className="tw-card">
              <div className="tw-cover">
                {profile?.isLive && (
                  <>
                    <div className="tw-live-badge">LIVE</div>
                    {profile.viewersCount > 0 && (
                      <div className="tw-viewers">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /></svg>
                        {formatQty(profile.viewersCount)}
                      </div>
                    )}
                  </>
                )}
                <div className="tw-follow-btn">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.5-7-11a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 6.5-7 11-7 11z" /></svg>
                  Suivre
                </div>
              </div>
              <div className="tw-card-body">
                <div className="tw-avatar" style={{ overflow: "hidden" }}>
                  {profile?.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt={profile.displayName} width={76} height={76} unoptimized style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 24, fontWeight: 800, color: "white" }}>{clean ? clean.charAt(0).toUpperCase() : "?"}</span>
                  )}
                </div>
                <div className="tw-channel-name">
                  {profile?.displayName || (clean ? clean : "Votre chaîne")}
                  {profile?.isPartner && (
                    <svg width="14" height="14" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <path fill="var(--tw-purple)" d="M22.25 12l-2.18-2.5.3-3.3-3.24-.73-1.7-2.85L12 3.86 8.56 2.62 6.87 5.47l-3.24.73.3 3.3L1.75 12l2.18 2.5-.3 3.3 3.24.73 1.7 2.85L12 20.14l3.44 1.24 1.7-2.85 3.23-.73-.3-3.3zM9.88 16.5L6.38 13l1.42-1.42 2.08 2.08 5.85-5.85L17.15 9z" />
                    </svg>
                  )}
                </div>
                <div className="tw-channel-meta">
                  {clean ? "@" + clean : "@votrechaine"}
                  {profile?.isAffiliate && !profile.isPartner && " · Affilié"}
                </div>

                {profile?.gameName && (
                  <div className="tw-game-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    {profile.gameName}
                  </div>
                )}

                {profile?.streamTitle && profile.isLive && (
                  <div style={{ marginTop: 10, fontSize: 13, color: "white", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {profile.streamTitle}
                  </div>
                )}

                <div className="tw-stats-row">
                  <div className="tw-stat-cell">
                    <strong>
                      {profile ? (
                        <>
                          {formatQty(profile.followersCount)}
                          <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 700 }}>
                            {" → "}
                            {formatQty(profile.followersCount + PACKS[pack].qty + PACKS[pack].bonus)}
                          </span>
                        </>
                      ) : "—"}
                    </strong>
                    <div>followers</div>
                  </div>
                  <div className="tw-stat-cell">
                    <strong style={{ color: "white" }}>{profile?.isPartner ? "Partenaire" : profile?.isAffiliate ? "Affilié" : "Streamer"}</strong>
                    <div>statut</div>
                  </div>
                </div>

                <div className="tw-vod-row">
                  <div className="tw-vod"></div>
                  <div className="tw-vod"></div>
                  <div className="tw-vod"></div>
                </div>

                <div style={{ marginTop: 10, fontSize: 11, color: "#adadb8" }}>
                  {verified ? "Chaîne trouvée · Publique" : verifying ? "Vérification…" : apiError ? "" : "En attente du pseudo"}
                </div>
              </div>
            </div>

            <div className="floaty tw-new-total-sticker" style={{ position: "absolute", top: -14, right: -12, ["--r" as string]: "8deg" } as CSSProperties}>
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
