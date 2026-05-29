import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Seeds the `pricing` table with the Instagram reposts (ig_reposts) packs so the
// reposts product can be checked out (calculateCheckoutPricing throws
// "Unknown pricing pack" without DB rows). EUR base prices only — other
// currency columns stay 0 and fall back to EUR at runtime. Adjust prices /
// per-currency overrides afterwards in the admin Pricing view.
//
//   node scripts/seed-ig-reposts.mjs
//
// Idempotent: skips qtys that already exist for service "ig_reposts".

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

// Mirrors REPOST_PACKS in app/instagram/data.ts (EUR fallback prices).
const PACKS = [
  { qty: 100, price: 1.29, popular: false },
  { qty: 250, price: 2.49, popular: false },
  { qty: 500, price: 3.99, popular: false },
  { qty: 1000, price: 6.99, popular: false },
  { qty: 2500, price: 13.99, popular: true },
  { qty: 5000, price: 24.99, popular: false },
  { qty: 10000, price: 44.99, popular: false },
  { qty: 25000, price: 99.99, popular: false },
  { qty: 50000, price: 179.99, popular: false },
  { qty: 100000, price: 329.99, popular: false },
];

console.log("Seeding pricing rows for service ig_reposts...");

let inserted = 0;
let skipped = 0;
for (let i = 0; i < PACKS.length; i++) {
  const p = PACKS[i];
  const existing = await sql`
    SELECT id FROM pricing WHERE service = 'ig_reposts' AND qty = ${p.qty} LIMIT 1
  `;
  if (existing.length > 0) {
    skipped++;
    continue;
  }
  await sql`
    INSERT INTO pricing (service, qty, price, popular, active, sort_order)
    VALUES ('ig_reposts', ${p.qty}, ${p.price}, ${p.popular}, true, ${(i + 1) * 1000})
  `;
  inserted++;
}

const rows = await sql`
  SELECT qty, price, popular, active FROM pricing WHERE service = 'ig_reposts' ORDER BY qty ASC
`;
console.log(`\nInserted ${inserted}, skipped ${skipped} (already present).`);
console.log("Current ig_reposts pricing rows:");
for (const r of rows) {
  console.log(`  ${String(r.qty).padStart(7)}  €${r.price}${r.popular ? "  (popular)" : ""}${r.active ? "" : "  [inactive]"}`);
}
process.exit(0);
