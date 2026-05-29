"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import XSprinkle from "./XSprinkle";
import Stepper from "./Stepper";
import { formatQty, type CountryId, type XProductType, getPacksForProduct, TWEET_URL_RE } from "../data";
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
  productType: XProductType;
  username: string;
  setUsername: (u: string) => void;
  postUrl: string;
  setPostUrl: (u: string) => void;
  email: string;
  setEmail: (e: string) => void;
  profile: XProfile | null;
  setProfile: (p: XProfile | null) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function Step2Username({
  country, pack, productType, username, setUsername, postUrl, setPostUrl, email, setEmail, profile, setProfile, onNext, onBack,
}: Props) {
  const t = useXCopy().step2;
  const isMediaMode = productType === "likes" || productType === "retweets";
  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(!!profile);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailBlurred, setEmailBlurred] = useState(false);

  const clean = username.replace(/^@/, "").trim().toLowerCase();
  // X handles: 4-15 chars, letters/digits/underscore
  const valid = /^[a-zA-Z0-9_]{4,15}$/.test(clean);
  const postValid = TWEET_URL_RE.test(postUrl.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const packData = getPacksForProduct(productType)[pack] ?? getPacksForProduct(productType)[0];
  const bonusVolume = packData.qty + packData.bonus;

  const handleNext = () => {
    if (isMediaMode) {
      if (!postUrl.trim()) { setSubmitError(t.errors.post); return; }
    } else if (!username.trim()) {
      setSubmitError(t.errors.missingUrl); return;
    }
    if (!emailValid) { setSubmitError(t.errors.email); return; }
    setSubmitError(null);
    onNext();
  };

  useEffect(() => {
    // Followers-only: live profile verification. Likes target a tweet URL with
    // no public preview API, so we skip the fetch in media mode.
    if (isMediaMode) return;
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
  }, [clean, valid, setProfile, isMediaMode]);

  void country;
  void touched;

  // Headings differ between followers (profile) and likes (tweet).
  const titleBefore = isMediaMode ? t.media.titleBefore : t.titleBefore;
  const titleFocus = isMediaMode ? t.media.titleFocus : t.titleFocus;
  const titleAfter = isMediaMode ? t.media.titleAfter : t.titleAfter;
  const intro = isMediaMode ? t.media.intro : t.intro;

  return (
    <section data-i18n-skip className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <XSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            {titleBefore} <span className="squiggle x">{titleFocus}</span> {titleAfter}
          </h1>
          <p style={{ maxWidth: 540, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {intro}
          </p>
        </div>

        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 36, maxWidth: 1320, margin: "0 auto" }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleNext(); }}
            style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}
          >
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
              {isMediaMode ? t.media.postLabel : t.urlLabel}
            </label>

            {isMediaMode ? (
              <div className="input-shell x">
                <input
                  type="url"
                  name="post_url"
                  inputMode="url"
                  enterKeyHint="next"
                  placeholder={t.media.postPlaceholder}
                  value={postUrl}
                  onChange={(e) => { setPostUrl(e.target.value); setTouched(true); }}
                  onBlur={() => setTouched(true)}
                  autoFocus
                  spellCheck={false}
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                />
                <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                  {postValid && (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ) : (
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
            )}

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

          {/* Preview: profile (followers) or tweet target (likes) */}
          <div className="x-preview-col" style={{ position: "relative" }}>
            {isMediaMode ? (
            <div className="x-card">
              <div className="x-banner">
                <div className="x-follow-pill">X</div>
              </div>
              <div className="x-card-body">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(29,155,240,0.18)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d9bf0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "white" }}>{t.media.targetTitle}</div>
                    <div style={{ fontSize: 12, color: "#71767b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                      {postUrl.trim() ? postUrl.trim() : t.media.postPlaceholder}
                    </div>
                  </div>
                </div>
                <div className="x-stats-row" style={{ marginTop: 14 }}>
                  <div>
                    <span style={{ fontWeight: 800, color: postValid ? "#1d9bf0" : "white" }}>+{formatQty(bonusVolume)}</span>
                    <span style={{ color: "#71767b", fontSize: 13, marginLeft: 4 }}>{productType === "retweets" ? t.media.retweetsUnit : t.media.likesUnit}</span>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "#71767b" }}>
                  {postValid ? t.media.foundPost : t.media.waitingPost}
                </div>
              </div>
            </div>
            ) : (
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
                            {formatQty(profile.followersCount + packData.qty + packData.bonus)}
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
            )}

            <div className="floaty x-new-total-sticker" style={{ position: "absolute", top: -14, right: -12, ["--r" as string]: "8deg" } as CSSProperties}>
              <div className="sticker">
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>{t.newTotal}</div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>+{formatQty(bonusVolume)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
