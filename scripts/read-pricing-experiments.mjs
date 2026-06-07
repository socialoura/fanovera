import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const { neon } = await import("@neondatabase/serverless");
const sql = neon(env.DATABASE_URL);
const rows = await sql`SELECT key, value FROM smm_settings WHERE key IN ('pricing_experiments_enabled','pricing_experiments_json')`;
const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
console.log("Global enabled:", s.pricing_experiments_enabled ?? "(unset)");
const json = s.pricing_experiments_json;
if (!json) { console.log("No DB experiments config (falls back to ENV/default)."); process.exit(0); }
const exps = JSON.parse(json);
console.log(`Experiments in DB: ${exps.length}`);
for (const e of exps) {
  console.log(`  - id=${e.id} enabled=${e.enabled} traffic=${e.traffic}% areas=[${e.productAreas}] locales=[${e.locales||"all"}]`);
  for (const v of e.variants) console.log(`      ${v.id} traffic=${v.traffic}% x${v.priceMultiplier} strat=${v.pricingStrategy}${v.paused?" PAUSED":""}`);
}
