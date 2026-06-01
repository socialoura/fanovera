/**
 * Read-only dump of the upsells table to identify exact IDs before edits.
 * Run with: node scripts/inspect-upsells.mjs
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const sql = neon(env.DATABASE_URL);

const rows = await sql`
  SELECT id, trigger_platform, trigger_service, service, qty, price_cents,
         active, sort_order, label, label_en
  FROM upsells
  ORDER BY trigger_platform, trigger_service, sort_order, id
`;

for (const r of rows) {
  console.log(
    `#${String(r.id).padEnd(4)} ${(r.trigger_platform || "—").padEnd(10)} buy:${(r.trigger_service || "—").padEnd(10)} -> ${r.service.padEnd(16)} x${String(r.qty).padEnd(6)} ${(r.price_cents/100).toFixed(2)}€ sort:${r.sort_order} ${r.active ? "ON " : "off"}`,
  );
  console.log(`        FR: ${r.label}`);
  console.log(`        EN: ${r.label_en}`);
}
console.log(`\n${rows.length} rows`);
