// Shared constants/helpers for the /promo "username-first" A/B experiment.
// Imported by the edge middleware (assignment), the server promo page (read),
// and client components — so this module stays dependency-free and
// side-effect-free.

export const PROMO_FLOW_COOKIE = "fanovera_promo_flow";

export type PromoFlowVariant = "control" | "username_first";

export function isPromoFlowVariant(value: string | null | undefined): value is PromoFlowVariant {
  return value === "control" || value === "username_first";
}

// Resolve the variant a visitor should actually see, from the admin-controlled
// mode (DB) + their sticky bucket cookie (assigned 50/50 in middleware):
//   - "off"            → everyone control (experiment dormant)
//   - "ab"             → honour the 50/50 bucket cookie
//   - "force_username" → everyone username_first (winner locked)
// `mode` is typed loosely (string) so this stays edge/server/client-safe and
// free of any DB import; the server reads the typed mode from promoFlow.server.
export function resolvePromoFlowVariant(
  mode: string | null | undefined,
  bucket: string | null | undefined,
): PromoFlowVariant {
  if (mode === "force_username") return "username_first";
  if (mode === "ab") return isPromoFlowVariant(bucket) ? bucket : "control";
  return "control";
}

// Smart pack default: pick the smallest pack tier whose quantity is at least the
// account's current follower count (≈ "double your audience"), capped to the
// largest tier. Returns -1 when followers are unknown so the caller keeps its
// existing default (the "popular" pack).
export function pickPackIndexByFollowers(
  packs: readonly { qty: number }[],
  followers: number,
): number {
  if (!Number.isFinite(followers) || followers <= 0 || packs.length === 0) return -1;
  const idx = packs.findIndex((p) => p.qty >= followers);
  return idx === -1 ? packs.length - 1 : idx;
}
