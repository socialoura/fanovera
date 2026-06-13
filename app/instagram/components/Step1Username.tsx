"use client";

import { useEffect, useState } from "react";
import NetIcon from "../../components/NetIcon";
import { trackEvent } from "../../lib/analytics";
import IgSprinkle from "./IgSprinkle";
import Stepper from "./Stepper";
import { useI2Copy } from "../copy";
import { useI18n } from "../../i18n/I18nProvider";
import type { IgProfile, IgPost } from "../types";

const USERNAME_RE = /^[a-zA-Z0-9._]{2,30}$/;

// `isPrivate` is the one upstream signal we act on: a private account is a real,
// permanent, user-fixable state, so we stop the flow and ask them to go public
// rather than handing the cart a profile we can't service. Every other failure
// (not-found / upstream) still falls through to the minimal profile so the flow
// never dead-ends on a transient hiccup.
type ProfileResult = { profile: IgProfile; isPrivate: boolean };

async function fetchProfile(username: string): Promise<ProfileResult> {
  const fallback: IgProfile = {
    username,
    fullName: username,
    avatarUrl: "",
    followersCount: 0,
    followingCount: 0,
    mediaCount: 0,
    bio: "",
    verified: false,
  };
  try {
    const res = await fetch(`/api/instagram/profile?username=${encodeURIComponent(username)}`);
    if (res.ok) return { profile: (await res.json()) as IgProfile, isPrivate: false };
    if (res.status === 403) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (body?.error === "private") return { profile: fallback, isPrivate: true };
    }
  } catch {
    /* fall through to minimal profile */
  }
  return { profile: fallback, isPrivate: false };
}


type Props = {
  username: string;
  setUsername: (u: string) => void;
  onLoaded: (profile: IgProfile, posts: IgPost[]) => void;
  autoStart?: boolean;
  fromPriceLabel?: string | null;
};

export default function Step1Username({ username, setUsername, onLoaded, autoStart = false }: Props) {
  const c = useI2Copy().step1;
  const { locale } = useI18n();
  const isFr = locale === "fr";
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
    trackEvent("cta_clicked", { product_area: "instagram", feature_name: "ig2_analyze", platform: "instagram" });
    setStage(0);
    setPhase("loading");
  };

  useEffect(() => {
    if (phase !== "loading") return;
    let cancelled = false;

    setStage(0);

    async function run() {
      const { profile, isPrivate } = await fetchProfile(clean);
      if (cancelled) return;

      // Private accounts can still order — we just proceed with a minimal
      // profile (no bio/avatar/stats). Step 2 shows only the follower slider.
      if (isPrivate) {
        trackEvent("username_private", { product_area: "instagram", platform: "instagram" });
      } else {
        trackEvent("username_validated", {
          product_area: "instagram",
          platform: "instagram",
          followers_count: profile.followersCount || 0,
        });
      }

      setStage(3);
      onLoaded(profile, []);
    }

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const stages = c.stages;

  return (
    <section className="slide-in" style={{ padding: "40px 0 0", position: "relative" }}>
      <IgSprinkle count={5} seed={0} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={1} needsPosts={false} />

        {/* Card: input OR loading OR private */}
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {phase === "input" ? (
            <div className="promo-cap2">
              <div className="promo-cap2-head">
                <span className="promo-cap2-icon">
                  <NetIcon kind="instagram" color="white" size={32} />
                </span>
                <h1 className="promo-cap2-title">
                  {isFr ? "Boostez votre " : "Boost your "}
                  <span className="promo-cap2-title-net">Instagram</span>
                </h1>
                <p className="promo-cap2-sub">
                  {isFr
                    ? "Entrez votre nom d'utilisateur Instagram public pour commencer. Aucun mot de passe requis."
                    : "Enter your public Instagram username to start. No password required."}
                </p>
              </div>

              <div className="promo-cap2-note">
                {isFr
                  ? "* Assurez-vous que votre compte est en public."
                  : "* Make sure your account is public."}
              </div>

              <div className="promo-cap2-form">
                <div className="promo-cap2-field">
                  <span className="promo-cap2-at">@</span>
                  <input
                    autoFocus
                    className="promo-cap2-input"
                    spellCheck={false}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="off"
                    enterKeyHint="go"
                    placeholder={c.placeholder}
                    value={clean}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") start(); }}
                  />
                </div>
                <button type="button" className="promo-cap2-btn" onClick={start} disabled={!valid} style={!valid ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>
                  <span>{isFr ? "Continuer" : "Continue"}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m21 21-4.34-4.34" />
                    <circle cx="11" cy="11" r="8" />
                  </svg>
                </button>
              </div>

              <div className="promo-cap2-badges">
                <span className="promo-cap2-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  {isFr ? "100% Sécurisé" : "100% Secure"}
                </span>
                <span className="promo-cap2-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  {isFr ? "Sans mot de passe" : "No password"}
                </span>
              </div>

              <div className="promo-cap2-trust" aria-label="Trustpilot 4.8 / 5">
                <span className="promo-cap2-trust-score">4.8</span>
                <span className="promo-cap2-trust-sep" />
                <span className="promo-cap2-stars">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true" style={{ background: "#00B67A", borderRadius: 3 }}>
                      <path d="M12 17.27l-5.18 3.05 1.4-5.95L3.5 9.24l6.06-.52L12 3l2.44 5.72 6.06.52-4.72 5.13 1.4 5.95z" />
                    </svg>
                  ))}
                </span>
              </div>
            </div>
          ) : (
            <div className="ig2-scan-card">
              {/* Scanner orb — rotating gradient ring around the handle initial */}
              <div className="ig2-scan-orb" aria-hidden>
                <span className="ig2-scan-orb-ring" />
                <span className="ig2-scan-orb-core">{clean.charAt(0).toUpperCase() || "@"}</span>
              </div>

              <div className="ig2-scan-handle slide-in">@{clean}</div>

              {/* Dynamic status line — re-mounts each stage to replay the fade */}
              <div className="ig2-scan-status">
                <span className="ig2-pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
                <span key={stage}>{stages[Math.min(stage, stages.length - 1)]}</span>
              </div>

              <div className="ig2-scan-track">
                <div className="ig2-scan-fill" style={{ width: ((stage + 1) / stages.length) * 100 + "%" }} />
              </div>

              <div className="ig2-scan-note">{c.loadingNote}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
