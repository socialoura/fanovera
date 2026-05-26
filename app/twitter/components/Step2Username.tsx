"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import XSprinkle from "./XSprinkle";
import Stepper from "./Stepper";
import { PACKS, formatQty, type CountryId } from "../data";
import { useXCopy } from "../i18n";
import { trackEvent } from "../../lib/analytics";
import { extractHandleFromUrl } from "../../lib/extractHandle";

export type XProfile = {
  username: string;
  fullName: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  tweetsCount: number;
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
  profile: XProfile | null;
  setProfile: (p: XProfile | null) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function Step2Username({
  country, pack, username, setUsername, email, setEmail, profile, setProfile, onNext, onBack,
}: Props) {
  const t = useXCopy().step2;
  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(!!profile);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailBlurred, setEmailBlurred] = useState(false);

  const clean = username.replace(/^@/, "").trim().toLowerCase();
  // X handles: 4-15 chars, letters/digits/underscore
  const valid = /^[a-zA-Z0-9_]{4,15}$/.test(clean);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleNext = () => {
    if (!username.trim()) { setSubmitError(t.errors.missingUrl); return; }
    if (!emailValid) { setSubmitError(t.errors.email); return; }
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
        const res = await fetch(`/api/twitter/profile?username=${encodeURIComponent(clean)}`, { signal: controller.signal });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          setApiError(res.status === 404 ? "not_found" : "upstream");
          setVerified(false);
        } else {
          setProfile(json as XProfile);
          setVerified(true);
          trackEvent("username_validated", {
            product_area: "twitter",
            platform: "twitter",
            followers_count: Number(json?.followersCount) || 0,
          });
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
    <section data-i18n-skip className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <XSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            {t.titleBefore} <span className="squiggle x">{t.titleFocus}</span> {t.titleAfter}
          </h1>
          <p style={{ maxWidth: 540, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {t.intro}
          </p>
        </div>

        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 36, maxWidth: 1320, margin: "0 auto" }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleNext(); }}
            style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}
          >
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
              {t.urlLabel}
            </label>

            <div className="input-shell x">
              <span style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 16 }}>@</span>
              <input
                type="text"
                name="handle"
                enterKeyHint="next"
                placeholder="votrepseudo"
                value={username.replace(/^@/, "")}
                onChange={(e) => {
                  const raw = e.target.value;
                  const extracted = extractHandleFromUrl("x", raw);
                  setUsername(extracted ?? raw);
                  setTouched(true);
                }}
                onBlur={() => setTouched(true)}
                autoFocus
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
              />
              <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                {verifying && <div className="spinner" style={{ borderColor: "rgba(0,0,0,0.25)", borderTopColor: "var(--x-ink)" }}></div>}
                {!verifying && verified && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Format / API errors intentionally silent: preview is a
                reassurance feature, never a payment gate. */}

            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                <label htmlFor="x-checkout-email" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                  {t.emailLabel}
                </label>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-2)" }}>{t.emailHint}</span>
              </div>
              <div className="input-shell x">
                <input
                  id="x-checkout-email"
                  type="email"
                  name="email"
                  inputMode="email"
                  enterKeyHint="go"
                  autoComplete="email"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailBlurred(true)}
                />
                {emailValid && email.trim() && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, marginRight: 8 }}>
                    <circle cx="12" cy="12" r="10" fill="var(--green)" />
                    <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {emailBlurred && email.trim() && !emailValid && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#c98a00" }}>{t.errors.emailIncomplete}</div>
              )}
            </div>

            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10, alignItems: "stretch" }}>
              <button type="submit" className="btn-primary btn-x" style={{ width: "100%", padding: "14px 26px", fontSize: 16 }}>
                {t.pay}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" onClick={onBack} style={{ alignSelf: "center", background: "transparent", border: "none", padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "var(--ink-3)", cursor: "pointer" }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.back}
              </button>
            </div>
            {submitError && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 12, fontSize: 13, color: "var(--x-ink)", display: "flex", gap: 8, alignItems: "center" }}>
                <span>!</span> {submitError}
              </div>
            )}
          </form>

          {/* X profile preview */}
          <div className="x-preview-col" style={{ position: "relative" }}>
            <div className="x-card">
              <div className="x-banner">
                <div className="x-follow-pill">X</div>
              </div>
              <div className="x-card-body">
                <div className="x-avatar" style={{ overflow: "hidden" }}>
                  {profile?.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt={profile.username} width={74} height={74} unoptimized style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <span>{clean ? clean.charAt(0).toUpperCase() : "?"}</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {profile?.fullName || (clean ? clean : t.trackFallback)}
                  </div>
                  {profile?.verified && (
                    <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <path fill="#1d9bf0" d="M22.25 12l-2.18-2.5.3-3.3-3.24-.73-1.7-2.85L12 3.86 8.56 2.62 6.87 5.47l-3.24.73.3 3.3L1.75 12l2.18 2.5-.3 3.3 3.24.73 1.7 2.85L12 20.14l3.44 1.24 1.7-2.85 3.23-.73-.3-3.3zM9.88 16.5L6.38 13l1.42-1.42 2.08 2.08 5.85-5.85L17.15 9z" />
                    </svg>
                  )}
                </div>
                <div className="x-handle">{clean ? "@" + clean : "@votrepseudo"}</div>
                {profile?.bio && (
                  <div style={{ fontSize: 13, color: "white", marginTop: 10, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {profile.bio}
                  </div>
                )}
                <div className="x-stats-row">
                  <div>
                    <span style={{ fontWeight: 800, color: "white" }}>{profile ? formatQty(profile.followingCount) : "-"}</span>
                    <span style={{ color: "#71767b", fontSize: 13, marginLeft: 4 }}>{t.monthlyListeners}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, color: verified ? "#1d9bf0" : "white" }}>
                      {profile ? (
                        <>
                          {formatQty(profile.followersCount)}
                          <span style={{ fontSize: 12, color: "var(--green)" }}>
                            {" -> "}
                            {formatQty(profile.followersCount + PACKS[pack].qty + PACKS[pack].bonus)}
                          </span>
                        </>
                      ) : "-"}
                    </span>
                    <span style={{ color: "#71767b", fontSize: 13, marginLeft: 4 }}>{t.totalStreams}</span>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "#71767b" }}>
                  {verified ? "X · Public" : verifying ? t.loading : apiError ? "" : "@"}
                </div>
              </div>
            </div>

            <div className="floaty x-new-total-sticker" style={{ position: "absolute", top: -14, right: -12, ["--r" as string]: "8deg" } as CSSProperties}>
              <div className="sticker">
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>{t.newTotal}</div>
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
