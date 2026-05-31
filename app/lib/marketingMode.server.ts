import { unstable_noStore as noStore } from "next/cache";
import { unstable_cache } from "next/cache";
import { sql } from "./db";
import { isMarketingMode, isModeEligibleLocale, type MarketingMode } from "./marketingModeTypes";
import {
  isSurfaceMarketingMode,
  type MarketingSurface,
  type SurfaceMarketingMode,
} from "./marketingModeTypes";
import type { SupportedLocale } from "../i18n/types";

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

// ── Per-surface marketing modes (marketing_modes table) ──

const DEFAULT_SURFACE_MODE: SurfaceMarketingMode = "whitehat";

let _surfaceTableReady = false;
async function ensureMarketingModesTable() {
  if (_surfaceTableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS marketing_modes (
      surface VARCHAR(40) PRIMARY KEY,
      mode VARCHAR(20) NOT NULL DEFAULT 'whitehat',
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      updated_by VARCHAR(120) DEFAULT ''
    )
  `;
  _surfaceTableReady = true;
}

export async function getSurfaceMarketingMode(
  surface: MarketingSurface,
): Promise<SurfaceMarketingMode> {
  try {
    await ensureMarketingModesTable();
    const rows = await sql`
      SELECT mode FROM marketing_modes WHERE surface = ${surface} LIMIT 1
    `;
    const value = rows[0]?.mode;
    return isSurfaceMarketingMode(value) ? value : DEFAULT_SURFACE_MODE;
  } catch (error) {
    console.error(`Marketing mode read error for surface ${surface}:`, error);
    return DEFAULT_SURFACE_MODE;
  }
}

export async function setSurfaceMarketingMode(
  surface: MarketingSurface,
  mode: SurfaceMarketingMode,
  by = "",
): Promise<SurfaceMarketingMode> {
  await ensureMarketingModesTable();
  await sql`
    INSERT INTO marketing_modes (surface, mode, updated_at, updated_by)
    VALUES (${surface}, ${mode}, NOW(), ${by})
    ON CONFLICT (surface)
    DO UPDATE SET mode = EXCLUDED.mode, updated_at = NOW(), updated_by = EXCLUDED.updated_by
  `;
  return mode;
}

export async function getAllSurfaceMarketingModes(): Promise<
  Record<MarketingSurface, SurfaceMarketingMode>
> {
  await ensureMarketingModesTable();
  const rows = await sql`SELECT surface, mode FROM marketing_modes`;
  const result: Record<string, SurfaceMarketingMode> = {
    home: "whitehat",
    promo: "whitehat",
    instagram: "whitehat",
    tiktok: "whitehat",
    twitter: "whitehat",
    twitch: "whitehat",
    youtube: "whitehat",
    spotify: "whitehat",
    facebook: "whitehat",
    linkedin: "whitehat",
  };
  for (const row of rows) {
    const s = row.surface as string;
    const m = row.mode as string;
    if (s in result && isSurfaceMarketingMode(m)) {
      result[s] = m;
    }
  }
  return result as Record<MarketingSurface, SurfaceMarketingMode>;
}

/**
 * Cached version for use in server components / metadata.
 * Tag: `marketing-mode-{surface}` — revalidated on admin POST.
 */
export function getCachedSurfaceMarketingMode(
  surface: MarketingSurface,
): Promise<SurfaceMarketingMode> {
  return unstable_cache(
    () => getSurfaceMarketingMode(surface),
    [`marketing-mode-${surface}`],
    { tags: [`marketing-mode-${surface}`, "marketing-modes"], revalidate: 3600 },
  )();
}

/**
 * getEffectiveMarketingModeForSurface(surface, locale)
 * - If locale is not mode-eligible (fr/en/es/it) → always "whitehat"
 * - Otherwise → DB lookup (cached)
 */
export async function getEffectiveMarketingModeForSurface(
  surface: MarketingSurface,
  locale: SupportedLocale,
): Promise<SurfaceMarketingMode> {
  if (!isModeEligibleLocale(locale)) return "whitehat";
  return getCachedSurfaceMarketingMode(surface);
}
