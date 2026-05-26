"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import YtSprinkle from "./YtSprinkle";
import Stepper from "./Stepper";
import { PACKS, formatQty, type CountryId } from "../data";
import { useYouTubeCopy } from "../i18n";
import { trackEvent } from "../../lib/analytics";

export type YtPreview = {
  id: string;
  title: string;
  channel: { name: string; subscribers: number; verified: boolean; avatarUrl: string };
  thumbnail: string;
  views: number;
  likes: number;
  duration: string;
  publishedAt: string;
};

type Props = {
  country: CountryId;
  pack: number;
  username: string; // carries the video URL
  setUsername: (u: string) => void;
  email: string;
  setEmail: (e: string) => void;
  profile: YtPreview | null;
  setProfile: (p: YtPreview | null) => void;
  onNext: () => void;
  onBack: () => void;
};

const YT_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

export default function Step2Username({
  country,
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
  const t = useYouTubeCopy().step2;
  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(!!profile);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailBlurred, setEmailBlurred] = useState(false);

  const url = username.trim();
  const validUrl = YT_RE.test(url);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleNext = () => {
    if (!url) {
      setSubmitError(t.errors.url);
      return;
    }
    if (!emailValid) {
      setSubmitError(t.errors.email);
      return;
    }
    setSubmitError(null);
    onNext();
  };

  useEffect(() => {
    setVerified(false);
    setProfile(null);
    setApiError(null);
    if (!validUrl) return;

    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await fetch(`/api/youtube/preview?url=${encodeURIComponent(url)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          setApiError(res.status === 400 ? "not_found" : "upstream");
          setVerified(false);
        } else {
          setProfile(json as YtPreview);
          setVerified(true);
          trackEvent("username_validated", {
            product_area: "youtube",
            platform: "youtube",
            followers_count: Number(json?.channel?.subscribers) || 0,
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
  }, [setProfile, url, validUrl]);

  void country;

  return (
    <section data-i18n-skip className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <YtSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            {t.titleBefore} <span className="squiggle yt">{t.titleFocus}</span> {t.titleAfter}
          </h1>
          <p style={{ maxWidth: 580, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {t.introBefore} <strong style={{ color: "var(--ink)" }}>{t.public}</strong> {t.or} <strong style={{ color: "var(--ink)" }}>{t.unlisted}</strong>.
          </p>
        </div>

        <div
          className="checkout-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 36, maxWidth: 1320, margin: "0 auto" }}
        >
          <form
            onSubmit={(e) => { e.preventDefault(); handleNext(); }}
            style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}
          >
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>{t.videoLabel}</label>

            <div className="input-shell yt">
              <input
                type="url"
                name="video_url"
                inputMode="url"
                enterKeyHint="next"
                placeholder={t.videoPlaceholder}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setTouched(true);
                }}
                onBlur={() => setTouched(true)}
                autoFocus
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
              />
              <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                {verifying && (
                  <div className="spinner" style={{ borderColor: "rgba(255,0,0,0.25)", borderTopColor: "var(--yt-red)" }}></div>
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

            {/* Format / API errors intentionally silent. */}

            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                <label htmlFor="yt-checkout-email" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)" }}>{t.emailLabel}</label>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-2)" }}>{t.emailHint}</span>
              </div>
              <div className="input-shell yt">
                <input
                  id="yt-checkout-email"
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
              <button type="submit" className="btn-primary btn-yt" style={{ width: "100%", padding: "14px 26px", fontSize: 16 }}>
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
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.25)", borderRadius: 12, fontSize: 13, color: "var(--yt-red)", display: "flex", gap: 8, alignItems: "center" }}>
                <span>!</span> {submitError}
              </div>
            )}
          </form>

          {/* YouTube video preview */}
          <div className="yt-preview-col" style={{ position: "relative" }}>
            <div className="yt-card">
              <div className="yt-thumb">
                {profile?.thumbnail ? (
                  <Image
                    src={profile.thumbnail}
                    alt={profile.title}
                    fill
                    unoptimized
                    sizes="(max-width: 980px) 100vw, 480px"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="yt-thumb-skeleton"></div>
                )}
                {profile && (
                  <>
                    <div className="yt-thumb-play">
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="white">
                        <path d="M6 4l12 7-12 7z" />
                      </svg>
                    </div>
                    {profile.duration && (
                      <div className="yt-thumb-duration">{profile.duration}</div>
                    )}
                  </>
                )}
              </div>

              <div className="yt-meta">
                <div className="yt-channel-avatar">
                  {profile?.channel.avatarUrl ? (
                    <Image
                      src={profile.channel.avatarUrl}
                      alt={profile.channel.name}
                      width={38}
                      height={38}
                      unoptimized
                      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <span>{profile?.channel.name ? profile.channel.name.charAt(0).toUpperCase() : "?"}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {profile?.title || (validUrl ? t.loading : t.pasteLink)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 12, color: "var(--ink-3)" }}>
                    <span>{profile?.channel.name || "-"}</span>
                    {profile?.channel.verified && (
                      <svg width="12" height="12" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
                        <circle cx="7" cy="7" r="6" fill="var(--yt-red)" />
                        <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                    {verified ? t.found : verifying ? t.checking : apiError ? "" : t.waiting}
                  </div>
                </div>
              </div>

              <div className="yt-stats-row">
                <div className="yt-stat-cell">
                  <div style={{ fontWeight: 800, fontSize: 16, color: verified ? "var(--yt-red)" : "var(--ink)" }}>
                    {profile ? (
                      <>
                        {formatQty(profile.views)}{" "}
                        <span style={{ fontSize: 11, color: "var(--green)" }}>
                          {"-> "}{formatQty(profile.views + PACKS[pack].qty + PACKS[pack].bonus)}
                        </span>
                      </>
                    ) : "-"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{t.views}</div>
                </div>
                <div className="yt-stat-cell">
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    {profile ? formatQty(profile.likes) : "-"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{t.likes}</div>
                </div>
                <div className="yt-stat-cell">
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    {profile ? formatQty(profile.channel.subscribers) : "-"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{t.subscribers}</div>
                </div>
              </div>
            </div>

            <div className="floaty yt-new-total-sticker" style={{ position: "absolute", top: -14, right: -12, ["--r" as string]: "8deg" } as CSSProperties}>
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
