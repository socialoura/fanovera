"use client";

// Lightweight client-only A/B for the /tiktok pack selector UI:
//   - "chips"  → the current curated chips + "more tiers" expander
//   - "slider" → a single range slider per product
// Assignment is a sticky 50/50 bucket persisted in localStorage so the visitor
// keeps the same variant across the session (and repeat visits on this device).
// The variant is registered as a PostHog super property at exposure time, so
// conversion (checkout_started → payment_succeeded) is comparable per arm.

export type Tt2PacksVariant = "chips" | "slider";

const KEY = "fanovera_tt2_packs_variant";

// Sticky 50/50 bucket (device-level). Only consulted when the admin mode is
// "ab"; force_* / off modes ignore it. Returns the persisted or freshly-assigned
// bucket variant.
export function getTt2PacksBucket(): Tt2PacksVariant {
  if (typeof window === "undefined") return "chips";
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing === "chips" || existing === "slider") return existing;
    const assigned: Tt2PacksVariant = Math.random() < 0.5 ? "chips" : "slider";
    window.localStorage.setItem(KEY, assigned);
    return assigned;
  } catch {
    // Private mode / storage disabled → fall back to control, unbucketed.
    return "chips";
  }
}

// Resolve the variant a visitor should actually see, from the admin-controlled
// mode (DB, passed from the SSR page) + their sticky bucket. `mode` is typed
// loosely so this stays import-free of the server module.
export function resolveTt2PacksVariant(
  mode: string | null | undefined,
  bucket: Tt2PacksVariant,
): Tt2PacksVariant {
  if (mode === "force_slider") return "slider";
  if (mode === "force_chips") return "chips";
  if (mode === "off") return "chips";
  // "ab" (or anything unexpected) → honour the sticky bucket.
  return bucket;
}
