import { unstable_noStore as noStore } from "next/cache";
import { sql } from "./db";
import { isMarketingMode, type MarketingMode } from "./marketingModeTypes";

const SETTING_KEY = "marketing_mode";
const DEFAULT_MODE: MarketingMode = "clean";

async function ensureMarketingModeSetting() {
  await sql`
    CREATE TABLE IF NOT EXISTS smm_settings (
      key VARCHAR(50) PRIMARY KEY,
      value VARCHAR(255) NOT NULL
    )
  `;
  await sql`
    INSERT INTO smm_settings (key, value)
    VALUES (${SETTING_KEY}, ${DEFAULT_MODE})
    ON CONFLICT (key) DO NOTHING
  `;
}

export async function getMarketingMode(): Promise<MarketingMode> {
  noStore();

  try {
    const rows = await sql`SELECT value FROM smm_settings WHERE key = ${SETTING_KEY} LIMIT 1`;
    const value = rows[0]?.value;
    return isMarketingMode(value) ? value : DEFAULT_MODE;
  } catch (error) {
    console.error("Marketing mode read error:", error);
    return DEFAULT_MODE;
  }
}

export async function setMarketingMode(mode: MarketingMode): Promise<MarketingMode> {
  await ensureMarketingModeSetting();
  await sql`
    INSERT INTO smm_settings (key, value)
    VALUES (${SETTING_KEY}, ${mode})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
  return mode;
}
