"use client";

import { useSearchParams } from "next/navigation";
import { DEFAULT_PROMO_CODE, normalizePromoCode } from "./promoCodes";

/**
 * Reads the `?promo=` query param and returns `{ code, applied }` so the
 * checkout can seed its coupon state with an auto-applied value.
 *
 * Only the known DEFAULT_PROMO_CODE (FANO5) is auto-applied — arbitrary
 * codes from the URL are ignored to prevent visitors from crafting URLs
 * with codes that aren't validated server-side anyway.
 */
export function usePromoFromUrl(): { code: string; applied: boolean } {
  const params = useSearchParams();
  const raw = params?.get("promo") ?? "";
  const code = normalizePromoCode(raw);

  if (code === DEFAULT_PROMO_CODE) {
    return { code, applied: true };
  }
  return { code: "", applied: false };
}
