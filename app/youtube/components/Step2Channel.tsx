"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import YtSprinkle from "./YtSprinkle";
import Stepper from "./Stepper";
import { SUBSCRIBERS_PACKS, formatQty, type CountryId } from "../data";
import { useYouTubeCopy } from "../i18n";
import { trackEvent } from "../../lib/analytics";
import type { YtPreview } from "./Step2Username";

export type YtChannel = {
  channelId: string;
  title: string;
  handle: string;
  description: string;
  avatarUrl: string;
  bannerUrl: string;
  subscriberCount: number;
  subscribersText: string;
  viewCount: number;
  videoCount: number;
  verified: boolean;
  country: string;
  joinedDate: string;
};

type Props = {
  country: CountryId;
  pack: number;
  channelInput: string;
  setChannelInput: (s: string) => void;
  email: string;
  setEmail: (s: string) => void;
  profile: YtPreview | null;
  setProfile: (p: YtPreview | null) => void;
  onNext: () => void;
  onBack: () => void;
};

const CHANNEL_URL_RE = /^https?:\/\/(?:www\.)?youtube\.com\/(?:@[A-Za-z0-9_.-]+|c\/[A-Za-z0-9_.-]+|user\/[A-Za-z0-9_.-]+|channel\/UC[A-Za-z0-9_-]{22})\/?$/i;

export default function Step2Channel({
  pack,
  channelInput,
  setChannelInput,
  email,
  setEmail,
  profile,
  setProfile,
  onNext,
  onBack,
}: Props) {
  const t = useYouTubeCopy().step2;
  const tc = t.channel;

  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(!!profile);
  const [channel, setChannel] = useState<YtChannel | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailBlurred, setEmailBlurred] = useState(false);

  const clean = channelInput.trim();
  const valid = CHANNEL_URL_RE.test(clean);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const packData = SUBSCRIBERS_PACKS[pack] ?? SUBSCRIBERS_PACKS[0];
  const bonusVolume = packData.qty + packData.bonus;

  const handleNext = () => {
    if (!clean) return setSubmitError(tc.errors.channel);
    if (!emailValid) return setSubmitError(t.errors.email);
    setSubmitError(null);
    onNext();
  };

  useEffect(() => {
    setVerified(false);
    setChannel(null);
    setProfile(null);
    setApiError(null);
    if (!valid) return;

    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await fetch(`/api/youtube/channel?url=${encodeURIComponent(clean)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          if (res.status === 404) setApiError("not_found");
          else setApiError("upstream");
          setVerified(false);
        } else {
          const c = json as YtChannel;
          setChannel(c);
          // Map into YtPreview shape so Step 3 displays consistently.
          setProfile({
            id: c.channelId,
            title: c.title,
            channel: {
              name: c.title,
              subscribers: c.subscriberCount,
              verified: c.verified,
              avatarUrl: c.avatarUrl,
            },
            thumbnail: c.bannerUrl || c.avatarUrl,
            views: c.viewCount,
            likes: 0,
            duration: "",
            publishedAt: c.joinedDate,
          });
          setVerified(true);
          trackEvent("username_validated", {
            product_area: "youtube",
            platform: "youtube",
            followers_count: c.subscriberCount,
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

  const showPreview = Boolean(channel) || verifying || (valid && !apiError);

  const previewBlock = showPreview ? (
    <>
      <ChannelPreviewCard
        channel={channel}
        clean={clean}
        verified={verified}
        verifying={verifying}
        apiError={apiError}
        bonusVolume={bonusVolume}
        tc={tc}
      />
      <div className="floaty yt-new-total-sticker" style={{ position: "absolute", top: -14, right: -12, ["--r" as string]: "8deg" } as CSSProperties}>
        <div className="sticker">
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>{tc.plannedVolume}</div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>+{formatQty(bonusVolume)}</div>
          </div>
        </div>
      </div>
    </>
  ) : null;

  return (
    <section data-i18n-skip className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <YtSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            {tc.titleBefore} <span className="squiggle yt">{tc.titleFocus}</span> {tc.titleAfter}
          </h1>
          <p style={{ maxWidth: 580, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {tc.intro}
          </p>
        </div>

        <div
          className="checkout-grid"
          style={{ display: "grid", gridTemplateColumns: showPreview ? "1fr 0.9fr" : "1fr", gap: 36, maxWidth: showPreview ? 1320 : 720, margin: "0 auto" }}
        >
          <form
            onSubmit={(e) => { e.preventDefault(); handleNext(); }}
            style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}
          >
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
              {tc.channelLabel}
            </label>
            <div className="input-shell yt">
              <input
                type="url"
                name="channel_url"
                inputMode="url"
                enterKeyHint="next"
                placeholder={tc.channelPlaceholder}
                value={channelInput}
                onChange={(e) => { setChannelInput(e.target.value); setTouched(true); }}
                onBlur={() => setTouched(true)}
                autoFocus
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
              />
              <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                {verifying && <div className="spinner" style={{ borderColor: "rgba(255,0,0,0.25)", borderTopColor: "var(--yt-red)" }} />}
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

            {previewBlock && (
              <div className="yt-preview-step2-inline" style={{ position: "relative", marginTop: 24 }}>
                {previewBlock}
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                <label htmlFor="ytch-checkout-email" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)" }}>{t.emailLabel}</label>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-2)" }}>{t.emailHint}</span>
              </div>
              <div className="input-shell yt">
                <input
                  id="ytch-checkout-email"
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

          {previewBlock && (
            <div className="yt-preview-col yt-preview-step2-side" style={{ position: "relative" }}>
              {previewBlock}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ChannelPreviewCard({
  channel,
  clean,
  verified,
  verifying,
  apiError,
  bonusVolume,
  tc,
}: {
  channel: YtChannel | null;
  clean: string;
  verified: boolean;
  verifying: boolean;
  apiError: string | null;
  bonusVolume: number;
  tc: ReturnType<typeof useYouTubeCopy>["step2"]["channel"];
}) {
  const statusText = verified ? tc.found : verifying ? tc.checking : apiError ? "" : tc.waiting;

  return (
    <div className="yt-card" style={{ overflow: "hidden" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "6 / 1", background: "var(--paper-2)", overflow: "hidden" }}>
        {channel?.bannerUrl ? (
          <Image src={channel.bannerUrl} alt={channel.title} fill unoptimized sizes="(max-width: 980px) 100vw, 480px" style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(255,0,0,0.08), rgba(0,0,0,0.04))" }} />
        )}
      </div>

      <div className="yt-meta" style={{ paddingTop: 12 }}>
        <div className="yt-channel-avatar" style={{ width: 56, height: 56 }}>
          {channel?.avatarUrl ? (
            <Image src={channel.avatarUrl} alt={channel.title} width={56} height={56} unoptimized style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <span>{(channel?.title || clean || "?").charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {channel?.title || clean}
            </span>
            {channel?.verified && (
              <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }} aria-label={tc.verifiedBadge}>
                <circle cx="7" cy="7" r="6" fill="var(--yt-red)" />
                <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          {channel?.handle && (
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>@{channel.handle}</div>
          )}
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{statusText}</div>
        </div>
      </div>

      <div className="yt-stats-row">
        <div className="yt-stat-cell">
          <div style={{ fontWeight: 800, fontSize: 16, color: verified ? "var(--yt-red)" : "var(--ink)" }}>
            {channel ? (
              <>
                {formatQty(channel.subscriberCount)}{" "}
                <span style={{ fontSize: 11, color: "var(--green)" }}>
                  {"-> "}{formatQty(channel.subscriberCount + bonusVolume)}
                </span>
              </>
            ) : "-"}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{tc.subscribersLabel}</div>
        </div>
        <div className="yt-stat-cell">
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            {channel ? formatQty(channel.viewCount) : "-"}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{tc.viewsLabel}</div>
        </div>
        <div className="yt-stat-cell">
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            {channel ? formatQty(channel.videoCount) : "-"}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{tc.videosLabel}</div>
        </div>
      </div>
    </div>
  );
}
