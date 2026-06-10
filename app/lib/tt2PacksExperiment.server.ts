import { unstable_cache } from "next/cache";
import { sql } from "./db";

// Admin-controlled mode for the /tiktok-2 pack-selector A/B, stored in the
// shared key/value `smm_settings` table (same store as the promo flow mode).
//   off          → everyone sees the chips selector (control)
//   ab           → 50/50 split (honours the sticky localStorage bucket)
//   force_slider → lock everyone on the slider variant (winner)
//   force_chips  → lock everyone on the chips variant (winner)

const SETTING_KEY = "tt2_packs_mode";

export type Tt2PacksMode = "off" | "ab" | "force_slider" | "force_chips";
// Default "ab": the test is live, so an unconfigured admin keeps the 50/50 split
// that was already running before this setting existed.
const DEFAULT_MODE: Tt2PacksMode = "ab";

export function isTt2PacksMode(value: unknown): value is Tt2PacksMode {
  return value === "off" || value === "ab" || value === "force_slider" || value === "force_chips";
}

async function ensureSettingsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS smm_settings (
      key VARCHAR(50) PRIMARY KEY,
      value VARCHAR(255) NOT NULL
    )
  `;
}

export async function getTt2PacksMode(): Promise<Tt2PacksMode> {
  try {
    const rows = await sql`SELECT value FROM smm_settings WHERE key = ${SETTING_KEY} LIMIT 1`;
    const value = rows[0]?.value;
    return isTt2PacksMode(value) ? value : DEFAULT_MODE;
  } catch (error) {
    console.error("tt2_packs_mode read error:", error);
    return DEFAULT_MODE;
  }
}

// Cached read for the SSR /tiktok-2 page — revalidated on admin POST via the
// `tt2-packs-mode` tag so a toggle takes effect immediately.
export function getCachedTt2PacksMode(): Promise<Tt2PacksMode> {
  return unstable_cache(getTt2PacksMode, ["tt2_packs_mode"], {
    tags: ["tt2-packs-mode"],
    revalidate: 300,
  })();
}

export async function setTt2PacksMode(mode: Tt2PacksMode): Promise<Tt2PacksMode> {
  await ensureSettingsTable();
  await sql`
    INSERT INTO smm_settings (key, value)
    VALUES (${SETTING_KEY}, ${mode})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
  return mode;
}
