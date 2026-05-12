"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import TwSprinkle from "./TwSprinkle";
import Stepper from "./Stepper";
import { type CountryId } from "../data";
import { useTwitchCopy } from "../i18n";

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
  const t = useTwitchCopy();
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
    if (!username.trim()) { setSubmitError(t.step2.errors.username); return; }
    if (!valid) { setSubmitError(t.step2.errors.invalid); return; }
    if (!verified) {
      if (verifying) setSubmitError(t.step2.errors.checking);
      else if (apiError === "not_found") setSubmitError(t.step2.errors.notFound);
      else setSubmitError(t.step2.errors.generic);
      return;
    }
    if (!emailValid) { setSubmitError(t.step2.errors.email); return; }
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
  void pack;

  return (
    <section className="slide-in" data-i18n-skip style={{ padding: "40px 0 56px", position: "relative" }}>
      <TwSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>{t.step2.titleBefore} <span className="squiggle tw">{t.step2.titleFocus}</span> {t.step2.titleAfter}</h1>
          <p style={{ maxWidth: 580, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {t.step2.intro}
          </p>
        </div>

        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 36, maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
              {t.step2.usernameLabel}
            </label>

            <div className="input-shell tw">
              <span style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 14 }}>twitch.tv/</span>
              <input
                type="text"
                placeholder={t.step2.usernamePlaceholder}
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
                <span>!</span> {t.step2.invalidFormat}
              </div>
            )}
            {valid && apiError === "not_found" && (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--tw-purple)", display: "flex", gap: 6, alignItems: "center" }}>
                <span>!</span> {t.step2.notFound}
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                {t.step2.emailLabel}
              </label>
              <div className="input-shell tw">
                <input type="email" placeholder={t.step2.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>{t.step2.emailHint}</div>
            </div>

            <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
              <button onClick={onBack} className="btn-soft" style={{ padding: "14px 22px" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.step2.back}
              </button>
              <button onClick={handleNext} className="btn-primary btn-tw" style={{ flex: 1, padding: "14px 26px", fontSize: 16 }}>
                {t.step2.pay}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {submitError && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(145,70,255,0.08)", border: "1px solid rgba(145,70,255,0.25)", borderRadius: 12, fontSize: 13, color: "var(--tw-purple)", display: "flex", gap: 8, alignItems: "center" }}>
                <span>!</span> {submitError}
              </div>
            )}
          </div>

          {/* Twitch channel preview */}
          <div className="tw-preview-col" style={{ position: "relative", order: 1 }}>
            <div className="tw-card">
              <div className="tw-cover"></div>
              <div className="tw-card-body">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  <div className="tw-avatar" style={{ overflow: "hidden" }}>
                    {profile?.avatarUrl ? (
                      <Image src={profile.avatarUrl} alt={profile.displayName} width={76} height={76} unoptimized style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 24, fontWeight: 800, color: "white" }}>{clean ? clean.charAt(0).toUpperCase() : "?"}</span>
                    )}
                  </div>
                  <div className="tw-channel-name">@{profile?.username || clean || t.step2.fallbackChannel}</div>
                  <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.78)", lineHeight: 1.45 }}>
                    {profile?.bio?.trim() || t.step2.bioUnavailable}
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
