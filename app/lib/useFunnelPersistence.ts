"use client";

import { useEffect, useRef } from "react";

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

export function useFunnelPersistence(
  platform: string,
  state: FunnelState,
  setters: Setters,
) {
  const hydratedRef = useRef(false);

  // Restore once on mount.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const saved = readState(platform);
    if (!saved) return;
    if (typeof saved.pack === "number" && setters.setPack) setters.setPack(saved.pack);
    if (typeof saved.username === "string" && saved.username && setters.setUsername) setters.setUsername(saved.username);
    if (typeof saved.email === "string" && saved.email && setters.setEmail) setters.setEmail(saved.email);
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
  }, [platform, state.pack, state.username, state.email]);
}

export function clearFunnelPersistence(platform: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(platform));
  } catch {
    /* ignore */
  }
}
