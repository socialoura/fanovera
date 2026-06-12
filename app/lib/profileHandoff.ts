// Hand off a freshly-fetched social profile from /promo to the product page
// (tiktok-2 / instagram-2) so the visitor lands straight on the profile + packs
// step instead of replaying the loading "scan". Written right before the
// client-side navigation out of /promo and consumed once on arrival. Kept in
// sessionStorage (per-tab, survives the SPA transition) and guarded by a short
// freshness TTL so a stale entry never hijacks a later direct visit.
const KEY = "fanovera_profile_handoff";
const TTL_MS = 60_000;

type StoredHandoff<P> = {
  network: string;
  username: string;
  profile: P;
  ts: number;
};

export function saveProfileHandoff<P>(network: string, username: string, profile: P): void {
  try {
    const payload: StoredHandoff<P> = {
      network,
      username: username.toLowerCase(),
      profile,
      ts: Date.now(),
    };
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* private mode / quota — destination just falls back to its own fetch */
  }
}

// Peek (no clear) — safe to call from render-time state initializers. Returns
// the stored profile only when it matches the expected network + handle and is
// still fresh; anything else (missing, mismatched, stale) returns null so the
// destination keeps its normal autoStart scan.
export function peekProfileHandoff<P>(network: string, username: string): P | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const h = JSON.parse(raw) as StoredHandoff<P>;
    if (h.network !== network) return null;
    if (h.username !== username.toLowerCase()) return null;
    if (!h.ts || Date.now() - h.ts > TTL_MS) return null;
    return h.profile;
  } catch {
    return null;
  }
}

export function clearProfileHandoff(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
