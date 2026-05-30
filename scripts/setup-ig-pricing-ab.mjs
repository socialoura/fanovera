// Stages the Instagram-followers price A/B test in the pricing-experiments
// config (smm_settings). The experiment is written DISABLED — nothing changes
// for customers until you flip it on in the admin (Pricing Experiments view)
// or re-run with --enable. Display AND charged price both go through
// applyPricingAssignment, so the per-pack EUR overrides defined here apply
// consistently on the product page and at checkout (EUR only).
//
//   node scripts/setup-ig-pricing-ab.mjs           # stage (disabled), merge-safe
//   node scripts/setup-ig-pricing-ab.mjs --dry     # print, write nothing
//   node scripts/setup-ig-pricing-ab.mjs --enable  # stage AND enable (live A/B)
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const sql = neon(env.DATABASE_URL);
const DRY = process.argv.includes("--dry");
const ENABLE = process.argv.includes("--enable");

const EXPERIMENT_ID = "ig_followers_grid_2026q2";

// Variant B grid — keys MUST match existing `pricing` rows (service:qty) or the
// override is inert. Mirrors docs/concurrents-instagram-fr.md analysis: stay
// cheapest in the FR mass market while lifting toward the market and the CPA.
const FOLLOWERS_GRID = {
  "ig_followers:100": 1.99,
  "ig_followers:250": 3.49,
  "ig_followers:500": 4.99,
  "ig_followers:1000": 5.99,
  "ig_followers:5000": 19.99,
  "ig_followers:10000": 34.99,
  "ig_followers:20000": 64.99,
  "ig_followers:50000": 119.99,
  "ig_followers:100000": 199.99,
  "ig_followers:500000": 849.99,
};

const experiment = {
  id: EXPERIMENT_ID,
  enabled: true, // gated by the global flag below; staged off unless --enable
  traffic: 100,
  seed: "fanovera-ig-grid-2026q2",
  productAreas: ["instagram"],
  variants: [
    { id: "control", label: "Standard (actuel)", traffic: 50, priceMultiplier: 1, pricingStrategy: "standard" },
    {
      id: "market_grid",
      label: "Grille marché FR (followers)",
      traffic: 50,
      priceMultiplier: 1,
      pricingStrategy: "ig_followers_market_grid_v1",
      priceOverrides: FOLLOWERS_GRID,
    },
  ],
};

const ENABLED_KEY = "pricing_experiments_enabled";
const JSON_KEY = "pricing_experiments_json";

await sql`CREATE TABLE IF NOT EXISTS smm_settings (key VARCHAR(50) PRIMARY KEY, value TEXT NOT NULL)`;

const rows = await sql`SELECT key, value FROM smm_settings WHERE key IN (${ENABLED_KEY}, ${JSON_KEY})`;
const current = Object.fromEntries(rows.map((r) => [r.key, r.value]));

let existing = [];
if (current[JSON_KEY]) {
  try { existing = JSON.parse(current[JSON_KEY]); if (!Array.isArray(existing)) existing = []; } catch { existing = []; }
}
// Merge-safe: replace our experiment if already present, keep all others.
const merged = [...existing.filter((e) => e && e.id !== EXPERIMENT_ID), experiment];

const nextEnabled = ENABLE ? "true" : (current[ENABLED_KEY] ?? "false");

console.log(`Experiment "${EXPERIMENT_ID}" — variant B overrides (${Object.keys(FOLLOWERS_GRID).length} packs):`);
for (const [k, v] of Object.entries(FOLLOWERS_GRID)) console.log(`  ${k.padEnd(22)} ${v.toFixed(2)} EUR`);
console.log(`\nexisting experiments kept: ${existing.filter((e) => e && e.id !== EXPERIMENT_ID).length}`);
console.log(`global pricing_experiments_enabled -> ${nextEnabled}${ENABLE ? "  (LIVE A/B)" : "  (staged; flip in admin to go live)"}`);

if (DRY) {
  console.log("\n[DRY] nothing written.");
  process.exit(0);
}

await sql`INSERT INTO smm_settings (key, value) VALUES (${JSON_KEY}, ${JSON.stringify(merged)})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
await sql`INSERT INTO smm_settings (key, value) VALUES (${ENABLED_KEY}, ${nextEnabled})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;

console.log(`\n✓ Wrote experiment config to smm_settings.`);
console.log(ENABLE
  ? "✓ A/B is LIVE: 50% of Instagram EUR visitors see the market grid on followers."
  : "Staged (disabled). To go live: admin → Pricing Experiments → enable, or re-run with --enable.");
