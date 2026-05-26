"use client";

import { useEffect, useRef, useState } from "react";

// Lightweight funnel persistence so users coming back from Step3 (or refreshing
// the page) don't lose what they already typed. We deliberately only persist
// primitive, non-PII-sensitive fields: pack index, raw username, raw email.
// Profile objects are not persisted (re-fetched live in Step2).

export type FunnelState = {
  pack?: number;
  username?: string;
  email?: string;
};

type Setters = {
  setPack?: (i: number) => void;
  setUsername?: (s: string) => void;
  setEmail?: (s: string) => void;
};

const TTL_MS = 24 * 60 * 60 * 1000; // 24h
const VERSION = 1;

function storageKey(platform: string) {
  return `fanovera:funnel:v${VERSION}:${platform}`;
}

// Global "last email used" cache shared across platforms. Lets a visitor who
// typed their email on /instagram come back via /tiktok a week later and
// find the field pre-filled. We keep this on a longer TTL than the per-
// platform state because the per-platform state is meant for in-progress
// recovery (close tab → come back same day) whereas this one is for the
// "remember me" UX across visits.
const GLOBAL_EMAIL_KEY = "fanovera:last-email:v1";
const GLOBAL_EMAIL_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function readLastEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GLOBAL_EMAIL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts?: number; email?: string };
    if (!parsed?.ts || typeof parsed.email !== "string" || !parsed.email) return null;
    if (Date.now() - parsed.ts > GLOBAL_EMAIL_TTL_MS) {
      window.localStorage.removeItem(GLOBAL_EMAIL_KEY);
      return null;
    }
    return parsed.email;
  } catch {
    return null;
  }
}

function writeLastEmail(email: string) {
  if (typeof window === "undefined") return;
  // Only persist once the field looks like a complete email — we don't want
  // a half-typed string like "ily" to clobber the previous valid value if
  // the user closes the tab mid-keystroke.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;
  try {
    window.localStorage.setItem(GLOBAL_EMAIL_KEY, JSON.stringify({ ts: Date.now(), email: email.trim() }));
  } catch {
    /* ignore */
  }
}

// We store in localStorage (not sessionStorage) so that a visitor who closes
// the tab and comes back within 24h — typical pattern after a card decline
// or "let me check my username on the app first" — finds their inputs intact
// instead of having to retype everything. TTL is enforced manually since
// localStorage doesn't expire on its own.
function readState(platform: string): FunnelState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(platform));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts?: number; data?: FunnelState };
    if (!parsed?.ts || !parsed.data) return null;
    if (Date.now() - parsed.ts > TTL_MS) {
      window.localStorage.removeItem(storageKey(platform));
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeState(platform: string, data: FunnelState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKey(platform),
      JSON.stringify({ ts: Date.now(), data }),
    );
  } catch {
    /* localStorage may be unavailable (private mode, quota) */
  }
}

export type FunnelPersistenceStatus = {
  /** True once the initial restore attempt has run (regardless of outcome). */
  hydrated: boolean;
  /** True if a saved pack was restored from storage on this mount. Lets
   *  callers skip post-hydration defaults so a returning visitor keeps
   *  their previous pick instead of being snapped back to "popular". */
  restoredPack: boolean;
};

export function useFunnelPersistence(
  platform: string,
  state: FunnelState,
  setters: Setters,
): FunnelPersistenceStatus {
  const hydratedRef = useRef(false);
  const [status, setStatus] = useState<FunnelPersistenceStatus>({ hydrated: false, restoredPack: false });

  // Restore once on mount.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const saved = readState(platform);
    let restoredPack = false;
    let restoredEmail = false;
    if (saved) {
      if (typeof saved.pack === "number" && setters.setPack) {
        setters.setPack(saved.pack);
        restoredPack = true;
      }
      if (typeof saved.username === "string" && saved.username && setters.setUsername) setters.setUsername(saved.username);
      if (typeof saved.email === "string" && saved.email && setters.setEmail) {
        setters.setEmail(saved.email);
        restoredEmail = true;
      }
    }
    // Cross-platform email fallback: if no per-platform email survived, try
    // the global "last email used" cache so a returning visitor sees their
    // address pre-filled even when they land on a different platform.
    if (!restoredEmail && setters.setEmail) {
      const lastEmail = readLastEmail();
      if (lastEmail) setters.setEmail(lastEmail);
    }
    setStatus({ hydrated: true, restoredPack });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  // Persist on every change (only after hydration to avoid wiping a saved
  // value with the initial render state).
  useEffect(() => {
    if (!hydratedRef.current) return;
    writeState(platform, {
      pack: state.pack,
      username: state.username,
      email: state.email,
    });
    if (state.email) writeLastEmail(state.email);
  }, [platform, state.pack, state.username, state.email]);

  return status;
}

/**
 * Sync the selected pack index to whichever pack is flagged `popular` once
 * DB pricing has loaded. Skipped when persistence already restored a saved
 * pack (returning visitor) or after the first apply (so a user toggling
 * product types isn't snapped back to the popular pack against their will).
 */
export function useAutoSelectPopularPack(
  enabled: boolean,
  packs: readonly { popular?: boolean }[],
  setPack: (i: number) => void,
  hydration: FunnelPersistenceStatus,
) {
  const appliedRef = useRef(false);
  useEffect(() => {
    if (!enabled || !hydration.hydrated || hydration.restoredPack || appliedRef.current) return;
    const popularIdx = packs.findIndex((p) => p.popular);
    if (popularIdx < 0) return;
    setPack(popularIdx);
    appliedRef.current = true;
  }, [enabled, packs, setPack, hydration]);
}

export function clearFunnelPersistence(platform: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(platform));
  } catch {
    /* ignore */
  }
}
