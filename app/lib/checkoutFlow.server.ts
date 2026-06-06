import { unstable_cache } from "next/cache";
import { sql } from "./db";

// Admin-controlled mode for the Instagram merged-checkout A/B, stored in the
// shared key/value `smm_settings` table (same store as marketing mode / promo
// flow).
//   off          → experiment dormant, everyone sees the current 3-step flow
//   ab           → 50/50 split (honours the sticky bucket cookie)
//   force_merged → lock everyone on the merged single-page variant (winner)

const SETTING_KEY = "checkout_flow_mode";

export type CheckoutFlowMode = "off" | "ab" | "force_merged";
const DEFAULT_MODE: CheckoutFlowMode = "off";

export function isCheckoutFlowMode(value: unknown): value is CheckoutFlowMode {
  return value === "off" || value === "ab" || value === "force_merged";
}

async function ensureSettingsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS smm_settings (
      key VARCHAR(50) PRIMARY KEY,
      value VARCHAR(255) NOT NULL
    )
  `;
}

export async function getCheckoutFlowMode(): Promise<CheckoutFlowMode> {
  try {
    const rows = await sql`SELECT value FROM smm_settings WHERE key = ${SETTING_KEY} LIMIT 1`;
    const value = rows[0]?.value;
    return isCheckoutFlowMode(value) ? value : DEFAULT_MODE;
  } catch (error) {
    console.error("checkout_flow_mode read error:", error);
    return DEFAULT_MODE;
  }
}

// Cached read for the SSR IG page — revalidated on admin POST via the
// `checkout-flow-mode` tag so a toggle takes effect immediately.
export function getCachedCheckoutFlowMode(): Promise<CheckoutFlowMode> {
  return unstable_cache(getCheckoutFlowMode, ["checkout_flow_mode"], {
    tags: ["checkout-flow-mode"],
    revalidate: 300,
  })();
}

export async function setCheckoutFlowMode(mode: CheckoutFlowMode): Promise<CheckoutFlowMode> {
  await ensureSettingsTable();
  await sql`
    INSERT INTO smm_settings (key, value)
    VALUES (${SETTING_KEY}, ${mode})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
  return mode;
}
