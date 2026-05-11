"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import SpoSprinkle from "./SpoSprinkle";
import Stepper from "./Stepper";
import { PACKS, formatQty, type CountryId } from "../data";

export type SpoPreview = {
  id: string | null;
  trackName: string;
  artistName: string;
  album: string;
  coverUrl: string | null;
  durationMs: number;
  monthlyListeners: number;
  popularity: number;
  totalStreams: number;
};

type Props = {
  country: CountryId;
  pack: number;
  trackInput: string;
  setTrackInput: (u: string) => void;
  email: string;
  setEmail: (e: string) => void;
  profile: SpoPreview | null;
  setProfile: (p: SpoPreview | null) => void;
  onNext: () => void;
  onBack: () => void;
};

type Mode = "url" | "search";
const SP_RE = /(?:open\.spotify\.com\/(?:intl-[a-z]+\/)?track\/|spotify:track:)([a-zA-Z0-9]{22})/;

type SpotifySearchResult = {
  id: string;
  name: string;
  shareUrl: string | null;
  durationText: string | null;
  artists: Array<{ name: string; id: string | null }>;
  cover: string | null;
  albumName: string | null;
  playCount?: number | null;
};

function parseDurationText(durationText: string | null | undefined) {
  if (!durationText) return 0;
  const parts = durationText.split(":").map((p) => Number(p.trim()));
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return 0;
  if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
  if (parts.length === 1) return parts[0] * 1000;
  return 0;
}

function hashSeed(input: string) {
  let seed = 0;
  for (let i = 0; i < input.length; i++) {
    seed = (seed * 31 + input.charCodeAt(i)) >>> 0;
  }
  return seed;
}

function makeRand(seed: number) {
  let s = seed || 1;
  return (max: number) => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s % max;
  };
}

function deriveStats(id: string, playCount?: number | null) {
  if (typeof playCount === "number" && Number.isFinite(playCount) && playCount > 0) {
    const totalStreams = Math.max(0, Math.round(playCount));
    const monthlyListeners = Math.max(12000, Math.round(totalStreams / 18));
    const popularity = Math.min(99, Math.max(40, Math.round(Math.log10(totalStreams + 1) * 12)));
    return { totalStreams, monthlyListeners, popularity };
  }

  const rand = makeRand(hashSeed(id));
  const monthlyListeners = 12_000 + rand(480_000);
  const totalStreams = monthlyListeners * (8 + rand(40));
  const popularity = 40 + rand(50);
  return { totalStreams, monthlyListeners, popularity };
}

function formatDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function Step2Track({
  country, pack, trackInput, setTrackInput, email, setEmail, profile, setProfile, onNext, onBack,
}: Props) {
  const [mode, setMode] = useState<Mode>("search");
  const [trackName, setTrackName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(!!profile);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const url = mode === "url" ? trackInput.trim() : "";
  const trackId = mode === "url" ? (url.match(SP_RE)?.[1] ?? "") : "";
  const validUrl = mode === "url" && trackId.length === 22;
  const validSearch = mode === "search" && trackName.trim().length > 1 && artistName.trim().length > 1;
  const hasInput = validUrl || validSearch;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Keep username/trackInput in sync with search mode so the PageClient always has a meaningful value for Stripe.
  useEffect(() => {
    if (mode === "search") {
      const combined = `${trackName.trim()} — ${artistName.trim()}`;
      if (trackName.trim() || artistName.trim()) setTrackInput(combined);
    }
  }, [mode, trackName, artistName, setTrackInput]);

  const handleNext = () => {
    if (mode === "url" && !url) { setSubmitError("Collez le lien Spotify de votre morceau."); return; }
    if (mode === "url" && !validUrl) { setSubmitError("Lien Spotify invalide. Format : open.spotify.com/track/…"); return; }
    if (mode === "search" && !validSearch) { setSubmitError("Renseignez le titre et l'artiste."); return; }
    if (!verified) {
      if (verifying) setSubmitError("Recherche du morceau en cours…");
      else if (apiError) setSubmitError("Morceau introuvable sur Spotify.");
      else setSubmitError("Morceau non trouvé.");
      return;
    }
    if (!emailValid) { setSubmitError("Entrez votre e-mail pour recevoir le reçu."); return; }
    setSubmitError(null);
    onNext();
  };

  useEffect(() => {
    setVerified(false);
    setProfile(null);
    setApiError(null);
    if (!hasInput) return;

    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      setVerifying(true);
      try {
        const searchQuery = `${trackName.trim()} ${artistName.trim()}`.trim();
        const qs = validUrl
          ? `mode=track&trackId=${encodeURIComponent(trackId)}`
          : `mode=search&q=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(`/api/spotify-search?${qs}`, { signal: controller.signal });
        const json = await res.json();
        if (controller.signal.aborted) return;

        if (!res.ok || !json?.id || !json?.name) {
          setApiError("not_found");
          setVerified(false);
        } else {
          const normalized = json as SpotifySearchResult;
          const artistNameResolved =
            Array.isArray(normalized.artists)
              ? normalized.artists.map((a) => a.name).filter(Boolean).join(", ")
              : "";
          const stats = deriveStats(normalized.id, normalized.playCount);

          setProfile({
            id: normalized.id,
            trackName: normalized.name,
            artistName: artistNameResolved || "Artiste",
            album: normalized.albumName || "Single",
            coverUrl: normalized.cover,
            durationMs: parseDurationText(normalized.durationText),
            monthlyListeners: stats.monthlyListeners,
            popularity: stats.popularity,
            totalStreams: stats.totalStreams,
          });
          if (normalized.shareUrl) setTrackInput(normalized.shareUrl);
          setVerified(true);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") setApiError("network");
      } finally {
        if (!controller.signal.aborted) setVerifying(false);
      }
    }, 500);

    return () => { clearTimeout(debounce); controller.abort(); setVerifying(false); };
  }, [hasInput, validUrl, trackId, trackName, artistName, setProfile, setTrackInput]);

  void country;

  return (
    <section className="slide-in" style={{ padding: "40px 0 56px", position: "relative" }}>
      <SpoSprinkle count={5} seed={2} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <Stepper step={2} />

        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
          <h1 className="display" style={{ fontSize: "clamp(32px, 4vw, 52px)", margin: "0 0 12px" }}>
            Quel <span className="squiggle spo">morceau</span> booster ?
          </h1>
          <p style={{ maxWidth: 580, margin: "0 auto", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Collez le lien Spotify de votre morceau, ou cherchez par titre + artiste. Aucun mot de passe demandé.
          </p>
        </div>

        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 36, maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: 22, padding: 28 }}>
            <div className="spo-mode-toggle">
              <button className={mode === "search" ? "active" : ""} onClick={() => setMode("search")}>Titre + Artiste</button>
              <button className={mode === "url" ? "active" : ""} onClick={() => setMode("url")}>Lien Spotify</button>
            </div>

            {mode === "url" ? (
              <>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                  Lien de votre morceau Spotify
                </label>
                <div className="input-shell spo">
                  <input
                    type="url"
                    placeholder="https://open.spotify.com/track/..."
                    value={trackInput}
                    onChange={(e) => { setTrackInput(e.target.value); setTouched(true); }}
                    onBlur={() => setTouched(true)}
                    autoFocus
                    spellCheck={false}
                    autoCapitalize="none"
                  />
                  <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                    {verifying && <div className="spinner" style={{ borderColor: "rgba(30,215,96,0.25)", borderTopColor: "var(--spo-green-2)" }}></div>}
                    {!verifying && verified && (
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                {touched && url.length > 0 && !validUrl && (
                  <div style={{ marginTop: 10, fontSize: 13, color: "var(--spo-green-2)", display: "flex", gap: 6, alignItems: "center" }}>
                    <span>⚠</span> Lien invalide. Exemple : https://open.spotify.com/track/xxxxxxxxxxxxxxxxxxxxxx
                  </div>
                )}
              </>
            ) : (
              <>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                  Titre du morceau
                </label>
                <div className="input-shell spo">
                  <input type="text" placeholder="Blinding Lights" value={trackName} onChange={(e) => setTrackName(e.target.value)} />
                </div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 16, marginBottom: 10 }}>
                  Artiste
                </label>
                <div className="input-shell spo">
                  <input type="text" placeholder="The Weeknd" value={artistName} onChange={(e) => setArtistName(e.target.value)} />
                  <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
                    {verifying && <div className="spinner" style={{ borderColor: "rgba(30,215,96,0.25)", borderTopColor: "var(--spo-green-2)" }}></div>}
                    {!verifying && verified && (
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            {hasInput && apiError && (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--spo-green-2)", display: "flex", gap: 6, alignItems: "center" }}>
                <span>⚠</span> Morceau introuvable sur Spotify.
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 10 }}>
                Votre e-mail (pour le reçu)
              </label>
              <div className="input-shell spo">
                <input type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>On vous envoie uniquement votre facture. Pas de spam, jamais.</div>
            </div>

            <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
              <button onClick={onBack} className="btn-soft" style={{ padding: "14px 22px" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Retour
              </button>
              <button onClick={handleNext} className="btn-primary btn-spo" style={{ flex: 1, padding: "14px 26px", fontSize: 16 }}>
                Aller au paiement
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {submitError && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(30,215,96,0.08)", border: "1px solid rgba(30,215,96,0.25)", borderRadius: 12, fontSize: 13, color: "var(--spo-green-2)", display: "flex", gap: 8, alignItems: "center" }}>
                <span>⚠</span> {submitError}
              </div>
            )}
          </div>

          {/* Track preview */}
          <div className="spo-preview-col" style={{ position: "relative" }}>
            <div className="spo-card">
              <div className="spo-card-top">
                <div className="spo-cover">
                  {profile?.coverUrl ? (
                    <Image src={profile.coverUrl} alt={profile.trackName} fill unoptimized sizes="132px" style={{ objectFit: "cover" }} />
                  ) : hasInput && verifying ? (
                    <div className="spo-cover-skeleton"></div>
                  ) : (
                    <div className="spo-cover-placeholder">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 18V6l12-2v12" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                      </svg>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="spo-pill">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="11" fill="currentColor" /><path d="M7 10c3-1 7-1 10 1M7 13c2.5-.8 6-.5 9 1M7 16c2-.5 5-.3 7 1" stroke="var(--spo-ink)" strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>
                    Spotify
                  </div>
                  <div className="spo-track-title" style={{ marginTop: 8 }}>
                    {profile?.trackName || (hasInput ? "Chargement…" : "Votre morceau")}
                  </div>
                  <div className="spo-artist" style={{ marginTop: 4 }}>
                    {profile?.artistName || "Artiste"}
                  </div>
                  {profile && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                      {profile.album} · {formatDuration(profile.durationMs)}
                    </div>
                  )}
                </div>
              </div>

              <div className="spo-stats-row">
                <div>
                  <div className="spo-stat-label">Écoutes totales</div>
                  <div className="spo-stat-value" style={{ color: verified ? "var(--spo-green)" : "white" }}>
                    {profile ? (
                      <>
                        {formatQty(profile.totalStreams)}{" "}
                        <span style={{ fontSize: 11, color: "var(--spo-green)" }}>
                          → {formatQty(profile.totalStreams + PACKS[pack].qty + PACKS[pack].bonus)}
                        </span>
                      </>
                    ) : "—"}
                  </div>
                </div>
                <div>
                  <div className="spo-stat-label">Auditeurs mensuels</div>
                  <div className="spo-stat-value">{profile ? formatQty(profile.monthlyListeners) : "—"}</div>
                </div>
                <div>
                  <div className="spo-stat-label">Popularité</div>
                  <div className="spo-stat-value">{profile ? `${profile.popularity}/100` : "—"}</div>
                </div>
              </div>
            </div>

            <div className="floaty spo-new-total-sticker" style={{ position: "absolute", top: -14, right: -12, ["--r" as string]: "8deg" } as CSSProperties}>
              <div className="sticker">
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green)", display: "grid", placeItems: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>NOUVEAU TOTAL</div>
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
