"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import FbSprinkle from "./FbSprinkle";
import Stepper from "./Stepper";
import { PACKS, formatQty, type CountryId } from "../data";

export type FbProfile = {
  name: string;
  handle: string;
  avatarUrl: string;
  coverImageUrl: string;
  followersCount: number;
  likesCount: number;
  categories: string[];
  verified: boolean;
};

type Props = {
  country: CountryId;
  pack: number;
  pageInput: string;
  setPageInput: (u: string) => void;
  email: string;
  setEmail: (e: string) => void;
  profile: FbProfile | null;
  setProfile: (p: FbProfile | null) => void;
  onNext: () => void;
  onBack: () => void;
};

const FB_RE = /facebook\.com\/([a-zA-Z0-9.\-_]+)/;

// Extracts the page handle from either a URL or a raw @handle/handle.
function extractHandle(input: string): string | null {
  const trimmed = input.replace(/^@/, "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http") || trimmed.includes("facebook.com")) {
    const m = trimmed.match(FB_RE);
    if (!m) return null;
    const handle = m[1].replace(/\/.*$/, "").replace(/[^a-zA-Z0-9.\-_]/g, "");
    return handle.length >= 3 ? handle : null;
  }
  if (/^[a-zA-Z0-9.\-_]{3,50}$/.test(trimmed)) return trimmed;
  return null;
}

export default function Step2Page({
  country, pack, pageInput, setPageInput, email, setEmail, profile, setProfile, onNext, onBack,
}: Props) {
  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(!!profile);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handle = extractHandle(pageInput);
  const valid = !!handle;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleNext = () => {
    if (!pageInput.trim()) { setSubmitError("Collez le lien ou le nom d'utilisateur de votre page Facebook."); return; }
    if (!valid) { setSubmitError("Format invalide. Exemple : facebook.com/votrepage ou votrepage"); return; }
    if (!verified) {
      if (verifying) setSubmitError("Vérification de la page en cours…");
      else if (apiError === "not_found") setSubmitError("Cette page est introuvable sur Facebook.");
      else setSubmitError("Page non trouvée. Vérifiez qu'elle est publique.");
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
        const res = await fetch(`/api/facebook/profile?handle=${encodeURIComponent(handle)}`, { signal: controller.signal });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          setApiError(res.status === 404 ? "not_found" : "upstream");
          setVerified(false);
        } else {
          setProfile(json as FbProfile);
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

  return (
    <section className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <FbSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            Quelle <span className="squiggle fb">page</span> booster ?
          </h1>
          <p style={{ maxWidth: 580, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Collez le lien de votre page Facebook, ou son nom d&apos;utilisateur. Aucun mot de passe, aucun accès demandé. La page doit être <strong style={{ color: "var(--ink)" }}>publique</strong>.
          </p>
        </div>

        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 36, maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
              Lien ou nom d&apos;utilisateur de votre page
            </label>

            <div className="input-shell fb">
              <input
                type="text"
                placeholder="facebook.com/votrepage ou votrepage"
                value={pageInput}
                onChange={(e) => { setPageInput(e.target.value); setTouched(true); }}
                onBlur={() => setTouched(true)}
                autoFocus
                spellCheck={false}
                autoCapitalize="none"
              />
              <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                {verifying && <div className="spinner" style={{ borderColor: "rgba(24,119,242,0.25)", borderTopColor: "var(--fb-blue)" }}></div>}
                {!verifying && verified && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {touched && !valid && pageInput.trim().length > 0 && (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--fb-blue)", display: "flex", gap: 6, alignItems: "center" }}>
                <span>⚠</span> Format invalide. Ex : https://facebook.com/votrepage ou votrepage
              </div>
            )}
            {valid && apiError === "not_found" && (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--fb-blue)", display: "flex", gap: 6, alignItems: "center" }}>
                <span>⚠</span> Page Facebook introuvable. Vérifiez qu&apos;elle est publique.
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                Votre e-mail (pour le reçu)
              </label>
              <div className="input-shell fb">
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
              <button onClick={handleNext} className="btn-primary btn-fb" style={{ flex: 1, padding: "14px 26px", fontSize: 16 }}>
                Aller au paiement
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {submitError && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(24,119,242,0.08)", border: "1px solid rgba(24,119,242,0.25)", borderRadius: 12, fontSize: 13, color: "var(--fb-blue)", display: "flex", gap: 8, alignItems: "center" }}>
                <span>⚠</span> {submitError}
              </div>
            )}
          </div>

          {/* Facebook page preview */}
          <div className="fb-preview-col" style={{ position: "relative", order: 1 }}>
            <div className="fb-card">
              <div className="fb-cover" style={profile?.coverImageUrl ? { backgroundImage: `url(${profile.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                <div className="fb-like-pill">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21s-7-4.5-7-11a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 6.5-7 11-7 11z" />
                  </svg>
                  J&apos;aime
                </div>
              </div>
              <div className="fb-card-body">
                <div className="fb-page-avatar" style={{ overflow: "hidden" }}>
                  {profile?.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt={profile.name} width={84} height={84} unoptimized style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 28, fontWeight: 800, color: "white" }}>{handle ? handle.charAt(0).toUpperCase() : "?"}</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div className="fb-page-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {profile?.name || (handle ? handle : "Votre page")}
                  </div>
                  {profile?.verified && (
                    <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <path fill="var(--fb-blue)" d="M22.25 12l-2.18-2.5.3-3.3-3.24-.73-1.7-2.85L12 3.86 8.56 2.62 6.87 5.47l-3.24.73.3 3.3L1.75 12l2.18 2.5-.3 3.3 3.24.73 1.7 2.85L12 20.14l3.44 1.24 1.7-2.85 3.23-.73-.3-3.3zM9.88 16.5L6.38 13l1.42-1.42 2.08 2.08 5.85-5.85L17.15 9z" />
                    </svg>
                  )}
                </div>
                <div className="fb-page-meta">
                  {profile?.categories?.join(" · ") || (handle ? "@" + handle : "Page Facebook")}
                </div>

                <div className="fb-stats-row">
                  <div className="fb-stat-cell">
                    <strong>{profile ? (
                      <>
                        {formatQty(profile.likesCount)}
                        <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 700 }}>
                          {" → "}
                          {formatQty(profile.likesCount + PACKS[pack].qty + PACKS[pack].bonus)}
                        </span>
                      </>
                    ) : "—"}</strong>
                    <div>personnes aiment ça</div>
                  </div>
                  <div className="fb-stat-cell">
                    <strong>{profile ? formatQty(profile.followersCount) : "—"}</strong>
                    <div>abonnés</div>
                  </div>
                </div>

                <div style={{ marginTop: 10, fontSize: 11, color: "var(--ink-3)" }}>
                  {verified ? "Page trouvée · Publique" : verifying ? "Vérification…" : apiError ? "" : "En attente du lien"}
                </div>
              </div>
            </div>

            <div className="floaty fb-new-total-sticker" style={{ position: "absolute", top: -14, right: -12, ["--r" as string]: "8deg" } as CSSProperties}>
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
