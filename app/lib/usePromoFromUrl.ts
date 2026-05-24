"use client";

import { useSearchParams } from "next/navigation";
import { DEFAULT_PROMO_CODE, normalizePromoCode } from "./promoCodes";

/**
 * Whitelist of lifecycle-email codes auto-applied via `?promo=`. The server
 * still re-validates via promoCodes.ts, so this list only controls auto-fill.
 */
const AUTO_APPLY_CODES = new Set([
  DEFAULT_PROMO_CODE,
  "FANO10",
  "FANO15",
  "FANO20",
  "FANO25",
  "FANO30",
]);

/**
 * Reads the `?promo=` query param and returns `{ code, applied }` so the
 * checkout can seed its coupon state with an auto-applied value.
 *
 * Only known codes (FANO5 + lifecycle codes FANO10..30) are auto-applied —
 * arbitrary codes from the URL are ignored to prevent visitors from crafting
 * URLs with codes that aren't validated server-side anyway.
 */
export function usePromoFromUrl(): { code: string; applied: boolean } {
  const params = useSearchParams();
  const raw = params?.get("promo") ?? "";
  const code = normalizePromoCode(raw);

  if (AUTO_APPLY_CODES.has(code)) {
    return { code, applied: true };
  }
  return { code: "", applied: false };
}
