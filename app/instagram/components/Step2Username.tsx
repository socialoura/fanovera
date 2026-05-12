"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import IgSprinkle from "./IgSprinkle";
import Stepper from "./Stepper";
import { PACKS, formatQty, type CountryId } from "../data";
import { useInstagramCopy } from "../i18n";

type IgProfile = {
  username: string;
  fullName: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  mediaCount: number;
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
  profile: IgProfile | null;
  setProfile: (p: IgProfile | null) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function Step2Username({
  pack,
  username,
  setUsername,
  email,
  setEmail,
  profile,
  setProfile,
  onNext,
  onBack,
}: Props) {
  const t = useInstagramCopy().step2;
  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(!!profile);
  const [apiError, setApiError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clean = username.replace(/^@/, "").trim().toLowerCase();
  const valid = /^[a-zA-Z0-9._]{2,30}$/.test(clean);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleNext = () => {
    if (!username.trim()) return setSubmitError(t.errors.username);
    if (!verified) {
      if (verifying) return setSubmitError(t.errors.checking);
      if (apiError === "not_found") return setSubmitError(t.errors.notFound);
      if (apiError === "private") return setSubmitError(t.errors.private);
      return setSubmitError(t.errors.invalid);
    }
    if (!emailValid) return setSubmitError(t.errors.email);
    setSubmitError(null);
    onNext();
  };

  useEffect(() => {
    setVerified(false);
    setProfile(null);
    setApiError(null);
    setSuggestion(null);
    if (!valid) return;

    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await fetch(`/api/instagram/profile?username=${encodeURIComponent(clean)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          if (res.status === 404) {
            setApiError("not_found");
            setSuggestion(json?.suggestion || null);
          } else if (res.status === 403) {
            setApiError("private");
          } else {
            setApiError("upstream");
          }
          setVerified(false);
        } else {
          setProfile(json as IgProfile);
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
  }, [clean, setProfile, valid]);

  return (
    <section data-i18n-skip className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <IgSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            {t.titleBefore} <span className="squiggle ig">{t.titleFocus}</span> {t.titleAfter}
          </h1>
          <p style={{ maxWidth: 560, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {t.intro}
          </p>
        </div>

        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 36, maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
              {t.usernameLabel}
            </label>
            <div className="input-shell">
              <span style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 16 }}>@</span>
              <input
                type="text"
                placeholder={t.usernamePlaceholder}
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
                {verifying && <div className="spinner" style={{ borderColor: "rgba(214,41,118,0.25)", borderTopColor: "var(--ig-2)" }} />}
                {!verifying && verified && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {touched && !valid && clean.length > 0 && <div style={{ marginTop: 10, fontSize: 13, color: "var(--ig-2)" }}>! {t.invalidFormat}</div>}
            {valid && apiError === "not_found" && (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--ig-2)" }}>
                ! {t.notFound}
                {suggestion && (
                  <button type="button" onClick={() => setUsername(suggestion)} style={{ marginLeft: 6, color: "var(--ig-2)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
                    {t.trySuggestion} @{suggestion}?
                  </button>
                )}
              </div>
            )}
            {valid && apiError === "private" && <div style={{ marginTop: 10, fontSize: 13, color: "var(--ig-2)" }}>🔒 {t.privateAccount}</div>}

            <div style={{ marginTop: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                {t.emailLabel}
              </label>
              <div className="input-shell">
                <input type="email" placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>{t.emailHint}</div>
            </div>

            <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
              <button onClick={onBack} className="btn-soft" style={{ padding: "14px 22px" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.back}
              </button>
              <button onClick={handleNext} className="btn-primary btn-ig" style={{ flex: 1, padding: "14px 26px", fontSize: 16 }}>
                {t.pay}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {submitError && <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(225,64,126,0.08)", border: "1px solid rgba(225,64,126,0.25)", borderRadius: 12, fontSize: 13, color: "var(--ig-2)" }}>! {submitError}</div>}
          </div>

          <div className="ig-preview-col" style={{ position: "relative" }}>
            <div className="ig-card">
              <div className="ig-card-top">
                <div className="ig-avatar">
                  {profile?.avatarUrl ? (
                    <Image src={profile.avatarUrl} alt={profile.username} width={64} height={64} unoptimized style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div className="ig-avatar-inner">{clean ? clean.charAt(0).toUpperCase() : "?"}</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {clean ? "@" + clean : "@" + t.usernamePlaceholder}
                  </div>
                  {profile?.fullName && profile.fullName !== profile.username && <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.fullName}</div>}
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{verified ? t.found : verifying ? t.checking : apiError ? "" : t.waiting}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", textAlign: "center", padding: "16px 0", borderBottom: "1px solid var(--line)" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{profile ? formatQty(profile.mediaCount) : "-"}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{t.posts}</div>
                </div>
                <div style={{ borderLeft: "1px solid var(--line)", borderRight: "1px solid var(--line)" }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: verified ? "var(--ig-2)" : "var(--ink)" }}>
                    {profile ? (
                      <span>
                        {formatQty(profile.followersCount)} <span style={{ fontSize: 12, color: "var(--green)" }}>+{formatQty(PACKS[pack].qty + PACKS[pack].bonus)}</span>
                      </span>
                    ) : (
                      "-"
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{t.audience}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{profile ? formatQty(profile.followingCount) : "-"}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{t.following}</div>
                </div>
              </div>
            </div>

            <div className="floaty ig-new-total-sticker" style={{ position: "absolute", top: -14, right: -12, ["--r" as string]: "8deg" } as CSSProperties}>
              <div className="sticker">
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase" }}>{t.plannedVolume}</div>
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
