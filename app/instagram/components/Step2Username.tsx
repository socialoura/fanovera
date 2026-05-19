"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import IgSprinkle from "./IgSprinkle";
import Stepper from "./Stepper";
import { getPacksForProduct, formatQty, type CountryId, type InstagramProductType } from "../data";
import { useInstagramCopy } from "../i18n";
import { trackEvent } from "../../lib/analytics";

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

type IgMedia = {
  id: string;
  code: string;
  mediaType: number;
  thumbnailUrl: string;
  videoUrl: string;
  likeCount: number;
  playCount: number;
  commentCount: number;
  caption: string;
  takenAt: number;
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
  productType: InstagramProductType;
  username: string;
  setUsername: (u: string) => void;
  postUrl: string;
  setPostUrl: (u: string) => void;
  email: string;
  setEmail: (e: string) => void;
  profile: IgProfile | null;
  setProfile: (p: IgProfile | null) => void;
  media: IgMedia | null;
  setMedia: (m: IgMedia | null) => void;
  onNext: () => void;
  onBack: () => void;
};

const POST_URL_RE = /instagram\.com\/(?:[^\/?#]+\/)?(?:p|reel|reels|tv)\/[A-Za-z0-9_-]+/i;

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
  const tAll = useInstagramCopy();
  const t = tAll.step2;
  const tm = t.media;
  const isMediaMode = productType === "likes" || productType === "views";

  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(isMediaMode ? !!media : !!profile);
  const [apiError, setApiError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clean = username.replace(/^@/, "").trim().toLowerCase();
  const usernameValid = /^[a-zA-Z0-9._]{2,30}$/.test(clean);
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
      if (!emailValid) return setSubmitError(t.errors.email);
    } else {
      if (!username.trim()) return setSubmitError(t.errors.username);
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
    setSuggestion(null);
    if (!usernameValid) return;

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
          trackEvent("username_validated", {
            product_area: "instagram",
            platform: "instagram",
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
        const res = await fetch(`/api/instagram/media?url=${encodeURIComponent(postUrl.trim())}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          if (res.status === 404) setApiError("not_found");
          else setApiError("upstream");
          setVerified(false);
        } else {
          const m = json as IgMedia;
          setMedia(m);
          setVerified(true);
          if (m.user?.username) {
            setUsername(m.user.username);
            // Mirror media user into profile so Step 3 displays avatar/full name
            // without needing a separate code path.
            setProfile({
              username: m.user.username,
              fullName: m.user.fullName,
              avatarUrl: m.user.avatarUrl,
              followersCount: 0,
              followingCount: 0,
              mediaCount: 0,
              bio: "",
              verified: m.user.verified,
            });
          }
          trackEvent("username_validated", {
            product_area: "instagram",
            platform: "instagram",
            media_type: m.mediaType,
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
          tPosts={t.posts}
          tAudience={t.audience}
          tFollowing={t.following}
          placeholderText={t.usernamePlaceholder}
        />
      )}
      <div className="floaty ig-new-total-sticker" style={{ position: "absolute", top: -14, right: -12, ["--r" as string]: "8deg" } as CSSProperties}>
        <div className="sticker">
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase" }}>{t.plannedVolume}</div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>+{formatQty(bonusVolume)}</div>
          </div>
        </div>
      </div>
    </>
  ) : null;

  // i18n strings for the heading
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
    <section data-i18n-skip className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <IgSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            {titleBefore} <span className="squiggle ig">{titleFocus}</span> {titleAfter}
          </h1>
          <p style={{ maxWidth: 560, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {intro}
          </p>
        </div>

        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: showPreview ? "1fr 0.9fr" : "1fr", gap: 36, maxWidth: showPreview ? 1320 : 720, margin: "0 auto" }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleNext(); }}
            style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}
          >
            {isMediaMode ? (
              <>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                  {tm.postLabel}
                </label>
                <div className="input-shell">
                  <input
                    data-testid="checkout-post-url"
                    type="url"
                    name="post_url"
                    inputMode="url"
                    enterKeyHint="next"
                    placeholder={tm.postPlaceholder}
                    value={postUrl}
                    onChange={(e) => {
                      setPostUrl(e.target.value);
                      setTouched(true);
                    }}
                    onBlur={() => setTouched(true)}
                    autoFocus
                    spellCheck={false}
                    autoCapitalize="none"
                    autoComplete="off"
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

                {/* Format and API errors intentionally silent: preview is a
                    reassurance feature, never a payment gate. */}
                {productType === "views" && media && media.mediaType === 1 && (
                  <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.3)", borderRadius: 12, fontSize: 13, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>⚠️</span>
                    <span>{tm.notVideo}</span>
                  </div>
                )}
                {previewBlock && (
                  <div className="ig-preview-step2-inline" style={{ position: "relative", marginTop: 24 }}>
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
                    data-testid="checkout-username"
                    type="text"
                    name="handle"
                    enterKeyHint="next"
                    placeholder={t.usernamePlaceholder}
                    value={username.replace(/^@/, "")}
                    onChange={(e) => {
                      setUsername(e.target.value);
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

                {/* Format error / "not found" / "private" intentionally silent.
                    The fuzzy-match suggestion is still surfaced because it
                    is a *help* affordance, not an error. */}
                {usernameValid && apiError === "not_found" && suggestion && (
                  <div style={{ marginTop: 10, fontSize: 13, color: "var(--ink-3)" }}>
                    <button type="button" onClick={() => setUsername(suggestion)} style={{ color: "var(--ig-2)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: 0 }}>
                      {t.trySuggestion} @{suggestion}?
                    </button>
                  </div>
                )}
                {previewBlock && (
                  <div className="ig-preview-step2-inline" style={{ position: "relative", marginTop: 24 }}>
                    {previewBlock}
                  </div>
                )}
              </>
            )}

            <div style={{ marginTop: 24 }}>
              <label htmlFor="ig-checkout-email" style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                {t.emailLabel}
              </label>
              <div className="input-shell">
                <input
                  id="ig-checkout-email"
                  data-testid="checkout-email"
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
                />
              </div>
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-3)" }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden style={{ flexShrink: 0 }}>
                  <rect x="3" y="6.5" width="8" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M5 6.5V4.5a2 2 0 0 1 4 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span>{t.emailHint}</span>
              </div>
            </div>

            <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
              <button type="button" onClick={onBack} className="btn-soft" style={{ padding: "14px 22px" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.back}
              </button>
              <button type="submit" data-testid="checkout-profile-next" className="btn-primary btn-ig" style={{ flex: 1, padding: "14px 26px", fontSize: 16 }}>
                {t.pay}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {submitError && <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(225,64,126,0.08)", border: "1px solid rgba(225,64,126,0.25)", borderRadius: 12, fontSize: 13, color: "var(--ig-2)" }}>! {submitError}</div>}
          </form>

          {previewBlock && (
            <div className="ig-preview-col ig-preview-step2-side" style={{ position: "relative" }}>
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
  tPosts,
  tAudience,
  tFollowing,
  placeholderText,
}: {
  profile: IgProfile | null;
  clean: string;
  verified: boolean;
  verifying: boolean;
  apiError: string | null;
  bonusVolume: number;
  tFound: string;
  tChecking: string;
  tWaiting: string;
  tPosts: string;
  tAudience: string;
  tFollowing: string;
  placeholderText: string;
}) {
  return (
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
            {clean ? "@" + clean : "@" + placeholderText}
          </div>
          {profile?.fullName && profile.fullName !== profile.username && <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.fullName}</div>}
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{verified ? tFound : verifying ? tChecking : apiError ? "" : tWaiting}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", textAlign: "center", padding: "16px 0", borderBottom: "1px solid var(--line)" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{profile ? formatQty(profile.mediaCount) : "-"}</div>
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{tPosts}</div>
        </div>
        <div style={{ borderLeft: "1px solid var(--line)", borderRight: "1px solid var(--line)" }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: verified ? "var(--ig-2)" : "var(--ink)" }}>
            {profile ? (
              <span>
                {formatQty(profile.followersCount)} <span style={{ fontSize: 12, color: "var(--green)" }}>+{formatQty(bonusVolume)}</span>
              </span>
            ) : (
              "-"
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{tAudience}</div>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{profile ? formatQty(profile.followingCount) : "-"}</div>
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{tFollowing}</div>
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
  media: IgMedia | null;
  verified: boolean;
  verifying: boolean;
  apiError: string | null;
  productType: InstagramProductType;
  bonusVolume: number;
  tm: ReturnType<typeof useInstagramCopy>["step2"]["media"];
  tWaiting: string;
  tChecking: string;
  tFound: string;
}) {
  const focusMetric = productType === "views" ? "play" : "like";
  const baseCount = focusMetric === "play" ? media?.playCount ?? 0 : media?.likeCount ?? 0;
  const projected = baseCount + bonusVolume;
  const focusLabel = focusMetric === "play" ? tm.viewsUnit : tm.likesUnit;
  const statusText = verified ? tFound : verifying ? tChecking : apiError ? "" : tWaiting;
  const isReel = media?.mediaType === 2;

  return (
    <div className="ig-card" style={{ overflow: "hidden" }}>
      <div className="ig-card-top">
        <div className="ig-avatar">
          {media?.user?.avatarUrl ? (
            <Image src={media.user.avatarUrl} alt={media.user.username} width={64} height={64} unoptimized style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div className="ig-avatar-inner">{media?.user?.username ? media.user.username.charAt(0).toUpperCase() : "?"}</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {media?.user?.username ? "@" + media.user.username : ""}
          </div>
          {media?.user?.fullName && media.user.fullName !== media.user.username && (
            <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{media.user.fullName}</div>
          )}
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{statusText}</div>
        </div>
      </div>

      <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", background: "var(--paper-2)", overflow: "hidden" }}>
        {media?.thumbnailUrl ? (
          <Image src={media.thumbnailUrl} alt={media.caption?.slice(0, 60) || "Instagram post"} fill unoptimized style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--ink-3)", fontSize: 13 }}>
            {verifying ? "..." : ""}
          </div>
        )}
        {isReel && (
          <div style={{ position: "absolute", top: 10, right: 10, padding: "4px 8px", borderRadius: 999, background: "rgba(0,0,0,0.55)", color: "white", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <path d="M3 2l8 5-8 5V2z" fill="currentColor" />
            </svg>
            Reel
          </div>
        )}
      </div>

      <div style={{ padding: "16px 16px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {focusLabel}
            </div>
            <div style={{ fontWeight: 800, fontSize: 22, color: verified ? "var(--ig-2)" : "var(--ink)", lineHeight: 1.2 }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", textAlign: "center", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{media ? formatQty(media.likeCount) : "-"}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{tm.likesUnit}</div>
          </div>
          <div style={{ borderLeft: "1px solid var(--line)", borderRight: "1px solid var(--line)" }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{media && media.mediaType === 2 ? formatQty(media.playCount) : "-"}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{tm.viewsUnit}</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{media ? formatQty(media.commentCount) : "-"}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{tm.commentsUnit}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
