// Shared constants/helpers for the Instagram checkout "merged single page" A/B
// experiment. Imported by the edge middleware (assignment), the server IG page
// (read), and client components — so this module stays dependency-free and
// side-effect-free, mirroring promoFlow.ts.

export const CHECKOUT_FLOW_COOKIE = "fanovera_checkout_flow";

export type CheckoutFlowVariant = "control" | "merged";

export function isCheckoutFlowVariant(value: string | null | undefined): value is CheckoutFlowVariant {
  return value === "control" || value === "merged";
}

// Resolve the variant a visitor should actually see, from the admin-controlled
// mode (DB) + their sticky bucket cookie (assigned 50/50 in middleware):
//   - "off"          → everyone control (current 3-step flow; experiment dormant)
//   - "ab"           → honour the 50/50 bucket cookie
//   - "force_merged" → everyone merged (winner locked)
export function resolveCheckoutFlowVariant(
  mode: string | null | undefined,
  bucket: string | null | undefined,
): CheckoutFlowVariant {
  if (mode === "force_merged") return "merged";
  if (mode === "ab") return isCheckoutFlowVariant(bucket) ? bucket : "control";
  return "control";
}
