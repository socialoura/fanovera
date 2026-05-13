import { sql } from "./db";
import {
  DEFAULT_EXPERIMENTS,
  normalizePricingExperiments,
  type PricingExperiment,
} from "./pricingExperiments";

const ENABLED_KEY = "pricing_experiments_enabled";
const JSON_KEY = "pricing_experiments_json";

async function ensureSettingsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS smm_settings (
      key VARCHAR(50) PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;
  await sql`ALTER TABLE smm_settings ALTER COLUMN value TYPE TEXT`;
}

function envEnabled() {
  return process.env.PRICING_EXPERIMENTS_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_PRICING_EXPERIMENTS_ENABLED === "true";
}

function envExperiments() {
  const raw = process.env.PRICING_EXPERIMENTS_JSON || process.env.NEXT_PUBLIC_PRICING_EXPERIMENTS_JSON || "";
  if (!raw.trim()) return DEFAULT_EXPERIMENTS;
  try {
    return normalizePricingExperiments(JSON.parse(raw));
  } catch {
    return DEFAULT_EXPERIMENTS;
  }
}

export async function getPricingExperimentSettings(): Promise<{
  enabled: boolean;
  experiments: PricingExperiment[];
  source: "database" | "environment" | "default";
}> {
  try {
    await ensureSettingsTable();
    const rows = await sql`
      SELECT key, value FROM smm_settings
      WHERE key IN (${ENABLED_KEY}, ${JSON_KEY})
    `;
    const settings = Object.fromEntries((rows as { key: string; value: string }[]).map((row) => [row.key, row.value]));
    const hasDatabaseConfig = typeof settings[JSON_KEY] === "string" && settings[JSON_KEY].trim().length > 0;

    if (hasDatabaseConfig) {
      return {
        enabled: settings[ENABLED_KEY] === "true",
        experiments: normalizePricingExperiments(JSON.parse(settings[JSON_KEY])),
        source: "database",
      };
    }
  } catch (error) {
    console.error("[pricing-experiments] database settings read failed:", error);
  }

  const experiments = envExperiments();
  return {
    enabled: envEnabled(),
    experiments,
    source: envEnabled() || experiments !== DEFAULT_EXPERIMENTS ? "environment" : "default",
  };
}

export async function getActivePricingExperiments() {
  const settings = await getPricingExperimentSettings();
  return settings.experiments.map((experiment) => ({
    ...experiment,
    enabled: settings.enabled && experiment.enabled,
  }));
}

export async function savePricingExperimentSettings(input: {
  enabled: boolean;
  experiments: PricingExperiment[];
}) {
  await ensureSettingsTable();
  const experiments = normalizePricingExperiments(input.experiments);
  await sql`
    INSERT INTO smm_settings (key, value)
    VALUES (${ENABLED_KEY}, ${input.enabled ? "true" : "false"})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
  await sql`
    INSERT INTO smm_settings (key, value)
    VALUES (${JSON_KEY}, ${JSON.stringify(experiments)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
  return { enabled: input.enabled, experiments, source: "database" as const };
}
