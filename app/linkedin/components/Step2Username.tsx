"use client";

import { useEffect, useState } from "react";
import LiSprinkle from "./LiSprinkle";
import Stepper from "./Stepper";
import { type CountryId } from "../data";
import { useLinkedinCopy } from "../i18n";
import { trackEvent } from "../../lib/analytics";

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

const LI_RE = /linkedin\.com\/(in|company|school)\/([a-zA-Z0-9\-_.]+)/i;

function extractHandle(input: string): string | null {
  const trimmed = input.replace(/^@/, "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http") || trimmed.includes("linkedin.com")) {
    const m = trimmed.match(LI_RE);
    if (!m) return null;
    const kind = m[1].toLowerCase();
    const handle = m[2].replace(/\/.*$/, "");
    return `${kind}/${handle}`;
  }
  const pathMatch = trimmed.match(/^(in|company|school)\/([a-zA-Z0-9\-_.]+)$/i);
  if (pathMatch) return `${pathMatch[1].toLowerCase()}/${pathMatch[2]}`;
  if (/^[a-zA-Z0-9\-_.]{3,100}$/.test(trimmed)) return `in/${trimmed}`;
  return null;
}

export default function Step2Username({
  country, pack, username, setUsername, email, setEmail, profile, setProfile, onNext, onBack,
}: Props) {
  const t = useLinkedinCopy();
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailBlurred, setEmailBlurred] = useState(false);

  const handle = extractHandle(username);
  const valid = !!handle;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleNext = () => {
    if (!username.trim()) { setSubmitError(t.step2.errors.username); return; }
    if (!emailValid) { setSubmitError(t.step2.errors.email); return; }
    setSubmitError(null);
    onNext();
  };

  useEffect(() => {
    if (!handle) { setProfile(null); return; }
    trackEvent("username_validated", {
      product_area: "linkedin",
      platform: "linkedin",
      followers_count: 0,
    });
    const displayHandle = handle.includes("/") ? handle.split("/").pop()! : handle;
    setProfile({
      username: displayHandle,
      fullName: displayHandle,
      headline: "",
      avatarUrl: "",
      backgroundUrl: "",
      bio: "",
      geo: "",
      isTopVoice: false,
      isCreator: false,
      isPremium: false,
      currentPosition: "",
      currentCompany: "",
      followersCount: 0,
      connectionsCount: 0,
    });
  }, [handle, setProfile]);

  void country;
  void pack;
  void profile;

  return (
    <section className="slide-in" data-i18n-skip style={{ padding: "40px 0 56px", position: "relative" }}>
      <LiSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            {t.step2.titleBefore} <span className="squiggle li">{t.step2.titleFocus}</span> {t.step2.titleAfter}
          </h1>
          <p style={{ maxWidth: 580, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {t.step2.intro}
          </p>
        </div>

        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleNext(); }}
            style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}
          >
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
              {t.step2.usernameLabel}
            </label>

            <div className="input-shell li">
              <span style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 13 }}>linkedin.com/</span>
              <input
                type="text"
                name="li_handle"
                enterKeyHint="next"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setTouched(true); }}
                onBlur={() => setTouched(true)}
                autoFocus
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
              />
              <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                {valid && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Format errors intentionally silent. */}

            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                <label htmlFor="li-checkout-email" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                  {t.step2.emailLabel}
                </label>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-2)" }}>{t.step2.emailHint}</span>
              </div>
              <div className="input-shell li">
                <input
                  id="li-checkout-email"
                  type="email"
                  name="email"
                  inputMode="email"
                  enterKeyHint="go"
                  autoComplete="email"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={t.step2.emailPlaceholder}
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
                <div style={{ marginTop: 8, fontSize: 12, color: "#c98a00" }}>{t.step2.errors.emailIncomplete}</div>
              )}
            </div>

            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10, alignItems: "stretch" }}>
              <button type="submit" className="btn-primary btn-li" style={{ width: "100%", padding: "14px 26px", fontSize: 16 }}>
                {t.step2.pay}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" onClick={onBack} style={{ alignSelf: "center", background: "transparent", border: "none", padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "var(--ink-3)", cursor: "pointer" }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.step2.back}
              </button>
            </div>
            {submitError && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(10,102,194,0.08)", border: "1px solid rgba(10,102,194,0.25)", borderRadius: 12, fontSize: 13, color: "var(--li-blue)", display: "flex", gap: 8, alignItems: "center" }}>
                <span>!</span> {submitError}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
