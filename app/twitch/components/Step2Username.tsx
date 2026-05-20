"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import TwSprinkle from "./TwSprinkle";
import Stepper from "./Stepper";
import { type CountryId, type TwitchProductType } from "../data";
import { useTwitchCopy } from "../i18n";
import { trackEvent } from "../../lib/analytics";
import { extractHandleFromUrl } from "../../lib/extractHandle";

const MIN_LEAD_MS = 60 * 60 * 1000; // require live to start at least 1h ahead

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
  productType: TwitchProductType;
  scheduledStartAt: string;
  setScheduledStartAt: (v: string) => void;
};

export default function Step2Username({
  country, pack, username, setUsername, email, setEmail, profile, setProfile, onNext, onBack,
  productType, scheduledStartAt, setScheduledStartAt,
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

  const isLive = productType === "ai_viewers";
  // scheduledStartAt is stored as ISO (UTC) so the back-end gets a stable
  // value regardless of the user's browser timezone. The <input> below shows
  // a local-time view to the user.
  const scheduleDate = scheduledStartAt ? new Date(scheduledStartAt) : null;
  const scheduleValid = Boolean(scheduleDate && !isNaN(scheduleDate.getTime()) && scheduleDate.getTime() - Date.now() >= MIN_LEAD_MS);

  const handleNext = () => {
    if (!username.trim()) { setSubmitError(t.step2.errors.username); return; }
    if (!emailValid) { setSubmitError(t.step2.errors.email); return; }
    if (isLive) {
      if (!scheduleDate || isNaN(scheduleDate.getTime())) { setSubmitError(t.aiViewers.error); return; }
      if (scheduleDate.getTime() - Date.now() < MIN_LEAD_MS) { setSubmitError(t.aiViewers.errorTooSoon); return; }
    }
    setSubmitError(null);
    onNext();
  };

  // Build datetime-local input value from the ISO stored string. The input
  // expects "YYYY-MM-DDTHH:MM" in local time, not UTC.
  const datetimeLocalValue = (() => {
    if (!scheduleDate || isNaN(scheduleDate.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${scheduleDate.getFullYear()}-${pad(scheduleDate.getMonth() + 1)}-${pad(scheduleDate.getDate())}T${pad(scheduleDate.getHours())}:${pad(scheduleDate.getMinutes())}`;
  })();

  // Min attribute value = now + 1h, in local datetime-local format.
  const minDatetimeLocal = (() => {
    const min = new Date(Date.now() + MIN_LEAD_MS);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${min.getFullYear()}-${pad(min.getMonth() + 1)}-${pad(min.getDate())}T${pad(min.getHours())}:${pad(min.getMinutes())}`;
  })();

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
          trackEvent("username_validated", {
            product_area: "twitch",
            platform: "twitch",
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
  void pack;

  return (
    <section className="slide-in" data-i18n-skip style={{ padding: "40px 0 56px", position: "relative" }}>
      <TwSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            {isLive
              ? <>{t.aiViewers.titleBefore} <span className="squiggle tw">{t.aiViewers.titleFocus}</span> {t.aiViewers.titleAfter}</>
              : <>{t.step2.titleBefore} <span className="squiggle tw">{t.step2.titleFocus}</span> {t.step2.titleAfter}</>}
          </h1>
          <p style={{ maxWidth: 580, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {isLive ? t.aiViewers.intro : t.step2.intro}
          </p>
        </div>

        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 36, maxWidth: 1320, margin: "0 auto" }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleNext(); }}
            style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}
          >
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
              {t.step2.usernameLabel}
            </label>

            <div className="input-shell tw">
              <span style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 14 }}>twitch.tv/</span>
              <input
                type="text"
                name="tw_handle"
                enterKeyHint="next"
                placeholder={t.step2.usernamePlaceholder}
                value={username.replace(/^@/, "")}
                onChange={(e) => {
                  const raw = e.target.value;
                  const extracted = extractHandleFromUrl("twitch", raw);
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

            {/* Format / API errors intentionally silent. */}

            {isLive && (
              <div style={{ marginTop: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                  {t.aiViewers.dateLabel} · {t.aiViewers.timeLabel}
                </label>
                <div className="input-shell tw">
                  <input
                    type="datetime-local"
                    value={datetimeLocalValue}
                    min={minDatetimeLocal}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) { setScheduledStartAt(""); return; }
                      // Parse the local datetime-local string into an ISO/UTC
                      // string so server + DB are timezone-agnostic.
                      const d = new Date(v);
                      setScheduledStartAt(isNaN(d.getTime()) ? "" : d.toISOString());
                    }}
                    style={{ width: "100%", fontSize: 14 }}
                  />
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: scheduleValid || !scheduledStartAt ? "var(--ink-3)" : "var(--tw-purple)" }}>
                  {t.aiViewers.hint}
                </div>
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <label htmlFor="tw-checkout-email" style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                {t.step2.emailLabel}
              </label>
              <div className="input-shell tw">
                <input
                  id="tw-checkout-email"
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
                />
              </div>
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-3)" }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden style={{ flexShrink: 0 }}>
                  <rect x="3" y="6.5" width="8" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M5 6.5V4.5a2 2 0 0 1 4 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span>{t.step2.emailHint}</span>
              </div>
            </div>

            <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
              <button type="button" onClick={onBack} className="btn-soft" style={{ padding: "14px 22px" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.step2.back}
              </button>
              <button type="submit" className="btn-primary btn-tw" style={{ flex: 1, padding: "14px 26px", fontSize: 16 }}>
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
          </form>

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
