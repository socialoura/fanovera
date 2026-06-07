/**
 * Add a "Prix x2" (+100%) variant to the IG + YouTube 3-way split tests and
 * rebalance each to four equal buckets (25% each). Other experiments untouched.
 *
 *   node scripts/add-x2-variant.mjs           # DRY RUN
 *   node scripts/add-x2-variant.mjs --apply    # write
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
const TARGETS = new Set(["pricing_ig_split_3way", "pricing_yt_split_3way"]);

const rows = await sql`SELECT key, value FROM smm_settings WHERE key='pricing_experiments_json'`;
if (!rows.length) { console.log("No config found."); process.exit(1); }
const current = JSON.parse(rows[0].value);

const final = current.map((e) => {
  if (!TARGETS.has(e.id)) return e;
  const hasX2 = e.variants.some((v) => Number(v.priceMultiplier) === 2);
  const variants = hasX2 ? [...e.variants] : [
    ...e.variants,
    { id: "premium_100", label: "Prix x2", traffic: 0, priceMultiplier: 2, pricingStrategy: "premium_100" },
  ];
  // Rebalance to equal buckets summing to 100 (remainder on the first bucket).
  const n = variants.length;
  const base = Math.floor(100 / n);
  const rebalanced = variants.map((v, i) => ({ ...v, traffic: base + (i === 0 ? 100 - base * n : 0) }));
  return { ...e, variants: rebalanced };
});

console.log("Updated split tests:");
for (const e of final) {
  if (!TARGETS.has(e.id)) continue;
  console.log(`  ${e.id} (${e.variants.reduce((s, v) => s + v.traffic, 0)}%):`);
  for (const v of e.variants) console.log(`     ${v.id} ${v.traffic}% x${v.priceMultiplier} (${v.pricingStrategy})`);
}
if (!APPLY) { console.log(`\nDRY RUN. Re-run with --apply.`); process.exit(0); }

await sql`
  INSERT INTO smm_settings (key, value) VALUES ('pricing_experiments_json', ${JSON.stringify(final)})
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
`;
console.log(`\n✅ Saved.`);
