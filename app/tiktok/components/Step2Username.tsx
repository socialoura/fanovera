"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import TtSprinkle from "./TtSprinkle";
import Stepper from "./Stepper";
import { getPacksForProduct, formatQty, type CountryId, type TikTokProductType } from "../data";
import { useTikTokCopy } from "../i18n";
import { trackEvent } from "../../lib/analytics";

export type TtProfile = {
  username: string;
  fullName: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  videoCount: number;
  bio: string;
  verified: boolean;
};

export type TtMedia = {
  id: string;
  desc: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  likeCount: number;
  playCount: number;
  commentCount: number;
  shareCount: number;
  createTime: number;
  user: {
    username: string;
    fullName: string;
    avatarUrl: string;
    verified: boolean;
  };
};

type Props = {
  country: CountryId;
  pack: number;
  productType: TikTokProductType;
  username: string;
  setUsername: (u: string) => void;
  postUrl: string;
  setPostUrl: (u: string) => void;
  email: string;
  setEmail: (e: string) => void;
  profile: TtProfile | null;
  setProfile: (p: TtProfile | null) => void;
  media: TtMedia | null;
  setMedia: (m: TtMedia | null) => void;
  onNext: () => void;
  onBack: () => void;
};

const POST_URL_RE = /tiktok\.com\/(?:@[^\/?#]+\/)?(?:video|v)\/\d+/i;

export default function Step2Username({
  pack,
  productType,
  username,
  setUsername,
  postUrl,
  setPostUrl,
  email,
  setEmail,
  profile,
  setProfile,
  media,
  setMedia,
  onNext,
  onBack,
}: Props) {
  const t = useTikTokCopy().step2;
  const tm = t.media;
  const isMediaMode = productType === "likes" || productType === "views";

  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(isMediaMode ? !!media : !!profile);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clean = username.replace(/^@/, "").trim().toLowerCase();
  const usernameValid = /^[a-zA-Z0-9._]{2,24}$/.test(clean);
  const postValid = POST_URL_RE.test(postUrl.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const packData = getPacksForProduct(productType)[pack] ?? getPacksForProduct(productType)[0];
  const bonusVolume = packData.qty + packData.bonus;

  const showPreview = isMediaMode
    ? Boolean(media) || verifying || (postValid && !apiError)
    : Boolean(profile) || verifying || (usernameValid && !apiError);

  const handleNext = () => {
    if (isMediaMode) {
      if (!postUrl.trim()) return setSubmitError(t.errors.post);
      if (!postValid) return setSubmitError(t.errors.postInvalid);
      if (verifying) return setSubmitError(t.checking);
      if (!media) return setSubmitError(t.errors.postNotFound);
      if (!emailValid) return setSubmitError(t.errors.email);
    } else {
      if (!username.trim()) return setSubmitError(t.errors.username);
      if (!usernameValid) return setSubmitError(t.invalidFormat);
      if (verifying) return setSubmitError(t.checking);
      if (!profile) return setSubmitError(t.notFound);
      if (!emailValid) return setSubmitError(t.errors.email);
    }
    setSubmitError(null);
    onNext();
  };

  // Username verification (followers mode)
  useEffect(() => {
    if (isMediaMode) return;
    setVerified(false);
    setProfile(null);
    setApiError(null);
    if (!usernameValid) return;

    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await fetch(`/api/tiktok/profile?username=${encodeURIComponent(clean)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          if (res.status === 404) setApiError("not_found");
          else if (res.status === 403) setApiError("private");
          else setApiError("upstream");
          setVerified(false);
        } else {
          setProfile(json as TtProfile);
          setVerified(true);
          trackEvent("username_validated", {
            product_area: "tiktok",
            platform: "tiktok",
            followers_count: Number(json?.followersCount) || 0,
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
  }, [clean, setProfile, usernameValid, isMediaMode]);

  // Post URL verification (likes/views mode)
  useEffect(() => {
    if (!isMediaMode) return;
    setVerified(false);
    setMedia(null);
    setApiError(null);
    if (!postValid) return;

    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      setVerifying(true);
      try {
        const res = await fetch(`/api/tiktok/media?url=${encodeURIComponent(postUrl.trim())}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          if (res.status === 404) setApiError("not_found");
          else setApiError("upstream");
          setVerified(false);
        } else {
          const m = json as TtMedia;
          setMedia(m);
          setVerified(true);
          if (m.user?.username) {
            setUsername(m.user.username);
            setProfile({
              username: m.user.username,
              fullName: m.user.fullName,
              avatarUrl: m.user.avatarUrl,
              followersCount: 0,
              followingCount: 0,
              likesCount: 0,
              videoCount: 0,
              bio: "",
              verified: m.user.verified,
            });
          }
          trackEvent("username_validated", {
            product_area: "tiktok",
            platform: "tiktok",
            like_count: m.likeCount,
            play_count: m.playCount,
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
  }, [postUrl, postValid, setMedia, setUsername, setProfile, isMediaMode]);

  const previewBlock = showPreview ? (
    <>
      {isMediaMode ? (
        <MediaPreviewCard
          media={media}
          verified={verified}
          verifying={verifying}
          apiError={apiError}
          productType={productType}
          bonusVolume={bonusVolume}
          tm={tm}
          tWaiting={tm.waitingPost}
          tChecking={tm.checkingPost}
          tFound={tm.foundPost}
        />
      ) : (
        <ProfilePreviewCard
          profile={profile}
          clean={clean}
          verified={verified}
          verifying={verifying}
          apiError={apiError}
          bonusVolume={bonusVolume}
          tFound={t.found}
          tChecking={t.checking}
          tWaiting={t.waiting}
          placeholderText={t.usernamePlaceholder}
        />
      )}
      <div className="floaty tt-new-total-sticker" style={{ position: "absolute", top: -14, right: -12, ["--r" as string]: "8deg" } as CSSProperties}>
        <div className="sticker">
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>NOUVEAU TOTAL</div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>+{formatQty(bonusVolume)}</div>
          </div>
        </div>
      </div>
    </>
  ) : null;

  const titleBefore = isMediaMode
    ? productType === "likes" ? tm.titleBeforeLikes : tm.titleBeforeViews
    : t.titleBefore;
  const titleFocus = isMediaMode
    ? productType === "likes" ? tm.titleFocusLikes : tm.titleFocusViews
    : t.titleFocus;
  const titleAfter = isMediaMode
    ? productType === "likes" ? tm.titleAfterLikes : tm.titleAfterViews
    : t.titleAfter;
  const intro = isMediaMode
    ? productType === "likes" ? tm.introLikes : tm.introViews
    : t.intro;

  return (
    <section className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <TtSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            {titleBefore} <span className="squiggle tt">{titleFocus}</span> {titleAfter}
          </h1>
          <p style={{ maxWidth: 540, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {intro}
          </p>
        </div>

        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: showPreview ? "1fr 0.9fr" : "1fr", gap: 36, maxWidth: showPreview ? 1320 : 720, margin: "0 auto" }}>
          <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}>
            {isMediaMode ? (
              <>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                  {tm.postLabel}
                </label>
                <div className="input-shell">
                  <input
                    type="url"
                    placeholder={tm.postPlaceholder}
                    value={postUrl}
                    onChange={(e) => { setPostUrl(e.target.value); setTouched(true); }}
                    onBlur={() => setTouched(true)}
                    autoFocus
                    spellCheck={false}
                    autoCapitalize="none"
                  />
                  <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                    {verifying && <div className="spinner" style={{ borderColor: "rgba(254,44,85,0.25)", borderTopColor: "var(--tt-red)" }} />}
                    {!verifying && verified && (
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {touched && !postValid && postUrl.trim().length > 0 && (
                  <div style={{ marginTop: 10, fontSize: 13, color: "var(--tt-red)" }}>! {t.errors.postInvalid}</div>
                )}
                {postValid && apiError === "not_found" && (
                  <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(254,44,85,0.08)", border: "1px solid rgba(254,44,85,0.25)", borderRadius: 12, fontSize: 13, color: "var(--tt-red)" }}>
                    {t.errors.postNotFound}
                  </div>
                )}
                {previewBlock && (
                  <div className="tt-preview-step2-inline" style={{ position: "relative", marginTop: 24 }}>
                    {previewBlock}
                  </div>
                )}
              </>
            ) : (
              <>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                  {t.usernameLabel}
                </label>
                <div className="input-shell">
                  <span style={{ color: "var(--ink-3)", fontWeight: 700, fontSize: 16 }}>@</span>
                  <input
                    type="text"
                    placeholder={t.usernamePlaceholder}
                    value={clean}
                    onChange={(e) => { setUsername(e.target.value); setTouched(true); }}
                    onBlur={() => setTouched(true)}
                    autoFocus
                    spellCheck={false}
                    autoCapitalize="none"
                  />
                  <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                    {verifying && <div className="spinner" style={{ borderColor: "rgba(254,44,85,0.25)", borderTopColor: "var(--tt-red)" }} />}
                    {!verifying && verified && (
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {touched && !usernameValid && clean.length > 0 && (
                  <div style={{ marginTop: 10, fontSize: 13, color: "var(--tt-red)" }}>! {t.invalidFormat}</div>
                )}
                {usernameValid && apiError === "not_found" && (
                  <div style={{ marginTop: 10, fontSize: 13, color: "var(--tt-red)" }}>! {t.notFound}</div>
                )}
                {usernameValid && apiError === "private" && (
                  <div style={{ marginTop: 10, fontSize: 13, color: "var(--tt-red)" }}>! {t.privateAccount}</div>
                )}
                {previewBlock && (
                  <div className="tt-preview-step2-inline" style={{ position: "relative", marginTop: 24 }}>
                    {previewBlock}
                  </div>
                )}
              </>
            )}

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
              <button onClick={handleNext} className="btn-primary btn-tt" style={{ flex: 1, padding: "14px 26px", fontSize: 16 }}>
                {t.pay}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {submitError && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(254,44,85,0.08)", border: "1px solid rgba(254,44,85,0.25)", borderRadius: 12, fontSize: 13, color: "var(--tt-red)", display: "flex", gap: 8, alignItems: "center" }}>
                <span>!</span> {submitError}
              </div>
            )}
          </div>

          {previewBlock && (
            <div className="tt-preview-col tt-preview-step2-side" style={{ position: "relative" }}>
              {previewBlock}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProfilePreviewCard({
  profile,
  clean,
  verified,
  verifying,
  apiError,
  bonusVolume,
  tFound,
  tChecking,
  tWaiting,
  placeholderText,
}: {
  profile: TtProfile | null;
  clean: string;
  verified: boolean;
  verifying: boolean;
  apiError: string | null;
  bonusVolume: number;
  tFound: string;
  tChecking: string;
  tWaiting: string;
  placeholderText: string;
}) {
  return (
    <div className="tt-card">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderBottom: "1px solid var(--line)" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--tt-cyan), var(--tt-red))", display: "grid", placeItems: "center", color: "white", fontWeight: 800, fontSize: 22, overflow: "hidden", flexShrink: 0 }}>
          {profile?.avatarUrl ? (
            <Image src={profile.avatarUrl} alt={profile.username} width={56} height={56} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span>{clean ? clean.charAt(0).toUpperCase() : "?"}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {clean ? "@" + clean : "@" + placeholderText}
            </div>
            {profile?.verified && (
              <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
                <circle cx="7" cy="7" r="6" fill="var(--tt-red)" />
                <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          {profile?.fullName && profile.fullName !== profile.username && (
            <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile.fullName}
            </div>
          )}
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
            {verified ? tFound : verifying ? tChecking : apiError ? "" : tWaiting}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", textAlign: "center", padding: "16px 0", borderBottom: "1px solid var(--line)" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{profile ? formatQty(profile.followingCount) : "-"}</div>
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>abonnements</div>
        </div>
        <div style={{ borderLeft: "1px solid var(--line)", borderRight: "1px solid var(--line)" }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: verified ? "var(--tt-red)" : "var(--ink)" }}>
            {profile ? (
              <span>
                {formatQty(profile.followersCount)} <span style={{ fontSize: 12, color: "var(--green)" }}>
                  {"-> "}{formatQty(profile.followersCount + bonusVolume)}
                </span>
              </span>
            ) : "-"}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>followers</div>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{profile ? formatQty(profile.likesCount) : "-"}</div>
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>j&apos;aime</div>
        </div>
      </div>
    </div>
  );
}

function MediaPreviewCard({
  media,
  verified,
  verifying,
  apiError,
  productType,
  bonusVolume,
  tm,
  tWaiting,
  tChecking,
  tFound,
}: {
  media: TtMedia | null;
  verified: boolean;
  verifying: boolean;
  apiError: string | null;
  productType: TikTokProductType;
  bonusVolume: number;
  tm: ReturnType<typeof useTikTokCopy>["step2"]["media"];
  tWaiting: string;
  tChecking: string;
  tFound: string;
}) {
  const focusMetric = productType === "views" ? "play" : "like";
  const baseCount = focusMetric === "play" ? media?.playCount ?? 0 : media?.likeCount ?? 0;
  const projected = baseCount + bonusVolume;
  const focusLabel = focusMetric === "play" ? tm.viewsUnit : tm.likesUnit;
  const statusText = verified ? tFound : verifying ? tChecking : apiError ? "" : tWaiting;
  const durationLabel = media?.duration ? `${Math.round(media.duration)}s` : "";

  return (
    <div className="tt-card" style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderBottom: "1px solid var(--line)" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--tt-cyan), var(--tt-red))", display: "grid", placeItems: "center", color: "white", fontWeight: 800, fontSize: 22, overflow: "hidden", flexShrink: 0 }}>
          {media?.user?.avatarUrl ? (
            <Image src={media.user.avatarUrl} alt={media.user.username} width={56} height={56} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span>{media?.user?.username ? media.user.username.charAt(0).toUpperCase() : "?"}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {media?.user?.username ? "@" + media.user.username : ""}
            </div>
            {media?.user?.verified && (
              <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
                <circle cx="7" cy="7" r="6" fill="var(--tt-red)" />
                <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          {media?.user?.fullName && media.user.fullName !== media.user.username && (
            <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {media.user.fullName}
            </div>
          )}
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{statusText}</div>
        </div>
      </div>

      <div style={{ position: "relative", width: "100%", aspectRatio: "9 / 16", maxHeight: 420, background: "var(--paper-2)", overflow: "hidden" }}>
        {media?.thumbnailUrl ? (
          <Image src={media.thumbnailUrl} alt={media.desc?.slice(0, 60) || "TikTok video"} fill unoptimized style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--ink-3)", fontSize: 13 }}>
            {verifying ? "..." : ""}
          </div>
        )}
        {durationLabel && (
          <div style={{ position: "absolute", bottom: 10, right: 10, padding: "4px 8px", borderRadius: 999, background: "rgba(0,0,0,0.55)", color: "white", fontSize: 11, fontWeight: 700 }}>
            {durationLabel}
          </div>
        )}
      </div>

      <div style={{ padding: "16px 16px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {focusLabel}
            </div>
            <div style={{ fontWeight: 800, fontSize: 22, color: verified ? "var(--tt-red)" : "var(--ink)", lineHeight: 1.2 }}>
              {media ? formatQty(baseCount) : "-"}
              {media && verified && (
                <span style={{ fontSize: 13, color: "var(--green)", marginLeft: 8, fontWeight: 700 }}>+{formatQty(bonusVolume)}</span>
              )}
            </div>
          </div>
          {media && verified && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {tm.afterCampaign}
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "var(--green)", lineHeight: 1.2 }}>
                {formatQty(projected)}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", textAlign: "center", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{media ? formatQty(media.likeCount) : "-"}</div>
            <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{tm.likesUnit}</div>
          </div>
          <div style={{ borderLeft: "1px solid var(--line)" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{media ? formatQty(media.playCount) : "-"}</div>
            <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{tm.viewsUnit}</div>
          </div>
          <div style={{ borderLeft: "1px solid var(--line)" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{media ? formatQty(media.commentCount) : "-"}</div>
            <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{tm.commentsUnit}</div>
          </div>
          <div style={{ borderLeft: "1px solid var(--line)" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{media ? formatQty(media.shareCount) : "-"}</div>
            <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{tm.sharesUnit}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
