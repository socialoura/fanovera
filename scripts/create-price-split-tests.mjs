/**
 * Create two 3-way price split tests (normal / -50% / +50%) for Instagram and
 * YouTube, write them to smm_settings (same store the admin UI uses), disable
 * the conflicting IG grid test, and turn the global flag ON.
 *
 *   node scripts/create-price-split-tests.mjs          # DRY RUN (prints final config)
 *   node scripts/create-price-split-tests.mjs --apply   # write to DB (goes LIVE)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const APPLY = process.argv.includes("--apply");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(env.DATABASE_URL);

const threeWay = (id, area) => ({
  id,
  enabled: true,
  traffic: 100,
  seed: `fanovera-${id}`,
  productAreas: [area],
  variants: [
    { id: "control", label: "Prix normal", traffic: 34, priceMultiplier: 1, pricingStrategy: "standard" },
    { id: "discount_50", label: "Prix -50%", traffic: 33, priceMultiplier: 0.5, pricingStrategy: "discount_50" },
    { id: "premium_50", label: "Prix +50%", traffic: 33, priceMultiplier: 1.5, pricingStrategy: "premium_50" },
  ],
});

const rows = await sql`SELECT key, value FROM smm_settings WHERE key='pricing_experiments_json'`;
const current = rows.length ? JSON.parse(rows[0].value) : [];

// Drop any prior versions of our two ids, disable the conflicting IG grid,
// keep everything else verbatim.
const IG = threeWay("pricing_ig_split_3way", "instagram");
const YT = threeWay("pricing_yt_split_3way", "youtube");
const NEW_IDS = new Set([IG.id, YT.id]);
const preserved = current
  .filter((e) => !NEW_IDS.has(e.id))
  .map((e) => (e.id === "ig_followers_grid_2026q2" ? { ...e, enabled: false } : e));

// New tests first so they take precedence in the first-match assignment loop.
const final = [IG, YT, ...preserved];

console.log("FINAL experiments array (order = assignment priority):");
for (const e of final) {
  console.log(`  ${e.enabled ? "🟢" : "⚪"} ${e.id} traffic=${e.traffic}% areas=[${e.productAreas}]`);
  for (const v of e.variants) console.log(`       ${v.id} ${v.traffic}% x${v.priceMultiplier} (${v.pricingStrategy})${v.paused ? " PAUSED" : ""}`);
}
console.log(`\nGlobal flag → enabled=true`);

if (!APPLY) { console.log(`\nDRY RUN. Re-run with --apply to write + go LIVE.`); process.exit(0); }

await sql`
  INSERT INTO smm_settings (key, value) VALUES ('pricing_experiments_enabled', 'true')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
`;
await sql`
  INSERT INTO smm_settings (key, value) VALUES ('pricing_experiments_json', ${JSON.stringify(final)})
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
`;
console.log(`\n✅ Saved. Tests are LIVE (global flag ON). ${final.filter((e) => e.enabled).length} active experiment(s).`);
