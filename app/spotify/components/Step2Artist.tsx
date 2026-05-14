"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import SpoSprinkle from "./SpoSprinkle";
import Stepper from "./Stepper";
import { getPacksForProduct, formatQty, type CountryId } from "../data";
import { useSpotifyCopy } from "../i18n";
import { trackEvent } from "../../lib/analytics";
import type { SpoPreview } from "./Step2Track";

export type SpoArtist = {
  id: string;
  name: string;
  shareUrl: string;
  verified: boolean;
  avatarUrl: string;
};

type Props = {
  country: CountryId;
  pack: number;
  artistInput: string;
  setArtistInput: (s: string) => void;
  email: string;
  setEmail: (s: string) => void;
  profile: SpoPreview | null;
  setProfile: (p: SpoPreview | null) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function Step2Artist({
  pack,
  artistInput,
  setArtistInput,
  email,
  setEmail,
  profile,
  setProfile,
  onNext,
  onBack,
}: Props) {
  const t = useSpotifyCopy().step2;
  const ta = t.artist;

  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(!!profile);
  const [artist, setArtist] = useState<SpoArtist | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clean = artistInput.trim();
  const valid = clean.length >= 2 && clean.length <= 80;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const bonusVolume = getPacksForProduct("followers")[pack]
    ? getPacksForProduct("followers")[pack].qty + getPacksForProduct("followers")[pack].bonus
    : 0;

  const handleNext = () => {
    if (!clean) return setSubmitError(ta.errors.missingName);
    if (!valid) return setSubmitError(ta.invalidFormat);
    if (verifying) return setSubmitError(ta.checking);
    if (!artist) return setSubmitError(ta.errors.missingArtist);
    if (!emailValid) return setSubmitError(t.errors.email);
    setSubmitError(null);
    onNext();
  };

  useEffect(() => {
    setVerified(false);
    setArtist(null);
    setProfile(null);
    setApiError(null);
    if (!valid) return;

    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await fetch(`/api/spotify/artist?name=${encodeURIComponent(clean)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          if (res.status === 404) setApiError("not_found");
          else setApiError("upstream");
          setVerified(false);
        } else {
          const a = json as SpoArtist;
          setArtist(a);
          // Mirror artist into the SpoPreview shape so Step 3 displays
          // cover/name without a separate code path.
          setProfile({
            id: a.id,
            trackName: a.name,
            artistName: a.name,
            album: "",
            coverUrl: a.avatarUrl || null,
            durationMs: 0,
            monthlyListeners: 0,
            popularity: 0,
            totalStreams: 0,
          });
          setVerified(true);
          trackEvent("username_validated", {
            product_area: "spotify",
            platform: "spotify",
            followers_count: 0,
          });
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
  }, [clean, valid, setProfile]);

  const showPreview = Boolean(artist) || verifying || (valid && !apiError);

  const previewBlock = showPreview ? (
    <>
      <ArtistPreviewCard
        artist={artist}
        verified={verified}
        verifying={verifying}
        apiError={apiError}
        bonusVolume={bonusVolume}
        clean={clean}
        ta={ta}
      />
      <div className="floaty spo-new-total-sticker" style={{ position: "absolute", top: -14, right: -12, ["--r" as string]: "8deg" } as CSSProperties}>
        <div className="sticker">
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>{ta.plannedVolume}</div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>+{formatQty(bonusVolume)}</div>
          </div>
        </div>
      </div>
    </>
  ) : null;

  return (
    <section data-i18n-skip className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <SpoSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            {ta.titleBefore} <span className="squiggle spo">{ta.titleFocus}</span> {ta.titleAfter}
          </h1>
          <p style={{ maxWidth: 580, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {ta.intro}
          </p>
        </div>

        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: showPreview ? "1fr 0.9fr" : "1fr", gap: 36, maxWidth: showPreview ? 1320 : 720, margin: "0 auto" }}>
          <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
              {ta.nameLabel}
            </label>
            <div className="input-shell spo">
              <input
                type="text"
                placeholder={ta.namePlaceholder}
                value={artistInput}
                onChange={(e) => { setArtistInput(e.target.value); setTouched(true); }}
                onBlur={() => setTouched(true)}
                autoFocus
                spellCheck={false}
              />
              <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                {verifying && <div className="spinner" style={{ borderColor: "rgba(30,215,96,0.25)", borderTopColor: "var(--spo-green-2)" }} />}
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
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--spo-green-2)" }}>! {ta.invalidFormat}</div>
            )}
            {valid && apiError === "not_found" && (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--spo-green-2)" }}>! {ta.notFound}</div>
            )}

            {previewBlock && (
              <div className="spo-preview-step2-inline" style={{ position: "relative", marginTop: 24 }}>
                {previewBlock}
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                {t.emailLabel}
              </label>
              <div className="input-shell spo">
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
              <button onClick={handleNext} className="btn-primary btn-spo" style={{ flex: 1, padding: "14px 26px", fontSize: 16 }}>
                {t.pay}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {submitError && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(30,215,96,0.08)", border: "1px solid rgba(30,215,96,0.25)", borderRadius: 12, fontSize: 13, color: "var(--spo-green-2)", display: "flex", gap: 8, alignItems: "center" }}>
                <span>!</span> {submitError}
              </div>
            )}
          </div>

          {previewBlock && (
            <div className="spo-preview-col spo-preview-step2-side" style={{ position: "relative" }}>
              {previewBlock}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ArtistPreviewCard({
  artist,
  verified,
  verifying,
  apiError,
  bonusVolume,
  clean,
  ta,
}: {
  artist: SpoArtist | null;
  verified: boolean;
  verifying: boolean;
  apiError: string | null;
  bonusVolume: number;
  clean: string;
  ta: ReturnType<typeof useSpotifyCopy>["step2"]["artist"];
}) {
  const statusText = verified ? ta.found : verifying ? ta.checking : apiError ? "" : ta.waiting;

  return (
    <div className="spo-card">
      <div className="spo-card-top">
        <div className="spo-cover" style={{ borderRadius: "50%" }}>
          {artist?.avatarUrl ? (
            <Image src={artist.avatarUrl} alt={artist.name} fill unoptimized sizes="132px" style={{ objectFit: "cover", borderRadius: "50%" }} />
          ) : verifying ? (
            <div className="spo-cover-skeleton" style={{ borderRadius: "50%" }}></div>
          ) : (
            <div className="spo-cover-placeholder" style={{ borderRadius: "50%" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-7 8-7s8 3 8 7" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="spo-pill">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="11" fill="currentColor" /><path d="M7 10c3-1 7-1 10 1M7 13c2.5-.8 6-.5 9 1M7 16c2-.5 5-.3 7 1" stroke="var(--spo-ink)" strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>
            Spotify
          </div>
          <div className="spo-track-title" style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {artist?.name || clean || ta.artistFallback}
            </span>
            {artist?.verified && (
              <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }} aria-label={ta.verifiedBadge}>
                <circle cx="7" cy="7" r="6" fill="var(--spo-green)" />
                <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="spo-artist" style={{ marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            {statusText}
          </div>
        </div>
      </div>

      <div className="spo-stats-row">
        <div style={{ gridColumn: "1 / -1" }}>
          <div className="spo-stat-label">{ta.followersUnit}</div>
          <div className="spo-stat-value" style={{ color: verified ? "var(--spo-green)" : "white", display: "flex", alignItems: "baseline", gap: 8 }}>
            {artist ? (
              <>
                <span>+{formatQty(bonusVolume)}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{ta.afterCampaign}</span>
              </>
            ) : (
              "-"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
