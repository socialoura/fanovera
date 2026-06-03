import { unstable_cache } from "next/cache";
import { sql } from "./db";

// Admin-controlled mode for the /promo username-first A/B, stored in the shared
// key/value `smm_settings` table (same store as the marketing mode).
//   off            → experiment dormant, everyone sees the current promo
//   ab             → 50/50 split (honours the sticky bucket cookie)
//   force_username → lock everyone on the username-first variant (winner)

const SETTING_KEY = "promo_flow_mode";

export type PromoFlowMode = "off" | "ab" | "force_username";
const DEFAULT_MODE: PromoFlowMode = "off";

export function isPromoFlowMode(value: unknown): value is PromoFlowMode {
  return value === "off" || value === "ab" || value === "force_username";
}

async function ensureSettingsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS smm_settings (
      key VARCHAR(50) PRIMARY KEY,
      value VARCHAR(255) NOT NULL
    )
  `;
}

export async function getPromoFlowMode(): Promise<PromoFlowMode> {
  try {
    const rows = await sql`SELECT value FROM smm_settings WHERE key = ${SETTING_KEY} LIMIT 1`;
    const value = rows[0]?.value;
    return isPromoFlowMode(value) ? value : DEFAULT_MODE;
  } catch (error) {
    console.error("promo_flow_mode read error:", error);
    return DEFAULT_MODE;
  }
}

// Cached read for the SSR promo page — revalidated on admin POST via the
// `promo-flow-mode` tag so a toggle takes effect immediately.
export function getCachedPromoFlowMode(): Promise<PromoFlowMode> {
  return unstable_cache(getPromoFlowMode, ["promo_flow_mode"], {
    tags: ["promo-flow-mode"],
    revalidate: 300,
  })();
}

export async function setPromoFlowMode(mode: PromoFlowMode): Promise<PromoFlowMode> {
  await ensureSettingsTable();
  await sql`
    INSERT INTO smm_settings (key, value)
    VALUES (${SETTING_KEY}, ${mode})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
  return mode;
}
