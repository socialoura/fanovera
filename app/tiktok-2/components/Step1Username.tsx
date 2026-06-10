"use client";

import { useEffect, useState } from "react";
import NetIcon from "../../components/NetIcon";
import { trackEvent } from "../../lib/analytics";
import TtSprinkle from "../../tiktok/components/TtSprinkle";
import Stepper from "./Stepper";
import { ArrowRight, Check } from "./icons";
import { useT2Copy } from "../copy";
import type { TtProfile, TtPost } from "../types";

const USERNAME_RE = /^[a-zA-Z0-9._]{2,24}$/;

async function fetchProfile(username: string): Promise<TtProfile> {
  try {
    const res = await fetch(`/api/tiktok/profile?username=${encodeURIComponent(username)}`);
    if (res.ok) return (await res.json()) as TtProfile;
  } catch {
    /* fall through to minimal profile */
  }
  // Private / not-found / upstream error: still let the user proceed with a
  // minimal profile so the flow never dead-ends (the API is reassurance only).
  return {
    username,
    fullName: username,
    avatarUrl: "",
    followersCount: 0,
    followingCount: 0,
    likesCount: 0,
    videoCount: 0,
    bio: "",
    verified: false,
  };
}

async function fetchPosts(username: string): Promise<TtPost[]> {
  try {
    const res = await fetch(`/api/tiktok/posts?username=${encodeURIComponent(username)}`);
    if (res.ok) {
      const json = (await res.json()) as { posts?: TtPost[] };
      return Array.isArray(json.posts) ? json.posts : [];
    }
  } catch {
    /* ignore — posts grid will simply be empty */
  }
  return [];
}

type Props = {
  username: string;
  setUsername: (u: string) => void;
  onLoaded: (profile: TtProfile, posts: TtPost[]) => void;
  // When true (e.g. /promo handoff with ?u=), skip the input screen and run the
  // loading immediately so the visitor lands on step 2 (profile + packs).
  autoStart?: boolean;
  // "from £X" anchor for the CTA (cheapest live TikTok price), matches the Hero.
  fromPriceLabel?: string | null;
};

export default function Step1Username({ username, setUsername, onLoaded, autoStart = false, fromPriceLabel = null }: Props) {
  const c = useT2Copy().step1;
  const [phase, setPhase] = useState<"input" | "loading">("input");
  const [stage, setStage] = useState(0);
  const clean = username.replace(/^@/, "").trim();
  const valid = USERNAME_RE.test(clean);

  // Auto-advance on mount when handed a valid @ from /promo.
  useEffect(() => {
    if (autoStart && valid) {
      setStage(0);
      setPhase("loading");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = () => {
    if (!valid) return;
    trackEvent("cta_clicked", { product_area: "tiktok", feature_name: "tt2_analyze", platform: "tiktok" });
    setStage(0);
    setPhase("loading");
  };

  useEffect(() => {
    if (phase !== "loading") return;
    let cancelled = false;
    const timers = [
      setTimeout(() => !cancelled && setStage(1), 650),
      setTimeout(() => !cancelled && setStage(2), 1350),
      setTimeout(() => !cancelled && setStage(3), 2050),
    ];
    const minDelay = new Promise<void>((r) => setTimeout(r, 2400));
    const work = Promise.all([fetchProfile(clean), fetchPosts(clean)]);
    Promise.all([work, minDelay]).then(([[profile, posts]]) => {
      if (cancelled) return;
      trackEvent("username_validated", {
        product_area: "tiktok",
        platform: "tiktok",
        followers_count: profile.followersCount || 0,
      });
      onLoaded(profile, posts);
    });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const stages = c.stages;

  return (
    <section className="slide-in" style={{ padding: "40px 0 0", position: "relative" }}>
      <TtSprinkle count={5} seed={0} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={1} needsPosts={false} />

        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 14px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 999, marginBottom: 20, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            <NetIcon kind="tiktok" color="var(--tt-ink)" size={14} /> {c.badge}
          </div>
          <h1 className="display" style={{ margin: "0 0 14px" }}>
            {c.titleBefore} <span className="squiggle tt">{c.titleFocus}</span>{c.titleAfter}
          </h1>
          <p style={{ maxWidth: 540, margin: "0 auto", fontSize: 17, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {c.intro1} <b style={{ color: "var(--ink)" }}>{c.noPassword}</b> {c.intro2}
          </p>
        </div>

        {/* Live ribbon */}
        <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", margin: "24px 0 34px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "white", border: "1px solid var(--line)", borderRadius: 999, fontSize: 13, color: "var(--ink-2)" }}>
            <span className="tt2-pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)" }} />
            <b style={{ color: "var(--ink)" }}>1 482</b> {c.ribbonOrders}
          </div>
        </div>

        {/* Card: input OR loading */}
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          {phase === "input" ? (
            // Same username field as /promo (promo-ig-capture card), TikTok-
            // themed via .cap-tt. Keeps brand continuity for visitors who land
            // on /tiktok-2 directly rather than through the /promo handoff.
            <div className="promo-ig-capture cap-tt" style={{ maxWidth: "none" }}>
              <div className="promo-ig-capture-card">
                <div className="promo-ig-capture-inner">
                  <div className="promo-ig-capture-glow" />
                  <div className="promo-ig-capture-head">
                    <span className="promo-ig-capture-logo">
                      <NetIcon kind="tiktok" color="white" size={24} />
                    </span>
                    <div>
                      <div className="promo-ig-capture-eyebrow">TikTok</div>
                      <div className="promo-ig-capture-title">Followers</div>
                    </div>
                  </div>

                  <div className="promo-ig-capture-sub">{c.subTitle}</div>

                  <label className="promo-ig-capture-field">
                    <span className="promo-ig-capture-at">@</span>
                    <input
                      autoFocus
                      spellCheck={false}
                      autoCapitalize="none"
                      autoCorrect="off"
                      enterKeyHint="go"
                      placeholder={c.placeholder}
                      value={clean}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") start(); }}
                    />
                    {valid && (
                      <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center", flexShrink: 0, marginRight: 6 }}>
                        <Check />
                      </span>
                    )}
                  </label>

                  <button className="promo-ig-capture-btn" onClick={start} disabled={!valid} style={!valid ? { opacity: 0.55, cursor: "not-allowed" } : undefined}>
                    {c.continueCta}
                    {fromPriceLabel && (
                      <span className="promo-ig-capture-price">{c.fromPrefix}{fromPriceLabel}</span>
                    )}
                    <span className="promo-ig-capture-arrow">
                      <ArrowRight size={16} />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="tt2-scan-card">
              {/* Scanner orb — rotating gradient ring around the handle initial */}
              <div className="tt2-scan-orb" aria-hidden>
                <span className="tt2-scan-orb-ring" />
                <span className="tt2-scan-orb-core">{clean.charAt(0).toUpperCase() || "@"}</span>
              </div>

              <div className="tt2-scan-handle slide-in">@{clean}</div>

              {/* Dynamic status line — re-mounts each stage to replay the fade */}
              <div className="tt2-scan-status">
                <span className="tt2-pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
                <span key={stage}>{stages[Math.min(stage, stages.length - 1)]}</span>
              </div>

              <div className="tt2-scan-track">
                <div className="tt2-scan-fill" style={{ width: ((stage + 1) / stages.length) * 100 + "%" }} />
              </div>

              <div className="tt2-scan-note">{c.loadingNote}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
