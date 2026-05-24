export const PROMO_ENTRY_SURFACE_PARAM = "entry_surface";
export const PROMO_ENTRY_SURFACE_VALUE = "promo";

/**
 * Builds a destination URL from /promo that:
 *  1. Forwards every existing query param (UTM, GCLID, …) so attribution
 *     stays intact from ad click to checkout.
 *  2. Sets `entry_surface=promo` for downstream funnel analytics.
 *  3. When `targetNetwork` is passed (i.e. the visitor is clicking a card
 *     that points at a specific network), also stamps `from=promo_{network}`
 *     so platform pages can detect "this visitor came from /promo and was
 *     pre-matched for X" without re-parsing utm_term.
 *
 * Deliberately does NOT inject a promo code (e.g. FANO5). Promo codes are
 * the visitor's choice, not a pre-applied gift — auto-applying erodes the
 * "code unlocked something" perceived value, and any code in /promo URLs
 * could leak into Google Ads tracking templates (audit risk).
 */
export function hrefWithPromoAttribution(
  path: string,
  currentSearch: { toString(): string } | string | null | undefined,
  targetNetwork?: string,
) {
  const rawSearch = typeof currentSearch === "string" ? currentSearch : currentSearch?.toString() || "";
  const params = new URLSearchParams(rawSearch);
  params.set(PROMO_ENTRY_SURFACE_PARAM, PROMO_ENTRY_SURFACE_VALUE);
  if (targetNetwork) {
    params.set("from", `promo_${targetNetwork}`);
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
