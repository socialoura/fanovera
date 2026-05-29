import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Seeds the `pricing` table with the Twitter/X retweets (x_retweets) packs so
// the retweets product can be checked out (calculateCheckoutPricing throws
// "Unknown pricing pack" without DB rows). EUR base prices only — other
// currency columns stay 0 and fall back to EUR at runtime. Adjust prices /
// per-currency overrides afterwards in the admin Pricing view.
//
//   node scripts/seed-x-retweets.mjs
//
// Idempotent: skips qtys that already exist for service "x_retweets".

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, "..", ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const sql = neon(env.DATABASE_URL);

// Mirrors RETWEET_PACKS in app/twitter/data.ts (EUR fallback prices).
const PACKS = [
  { qty: 100, price: 4.99, popular: false },
  { qty: 250, price: 9.99, popular: false },
  { qty: 500, price: 17.99, popular: false },
  { qty: 1000, price: 29.99, popular: true },
  { qty: 2500, price: 64.99, popular: false },
  { qty: 5000, price: 119.99, popular: false },
  { qty: 10000, price: 199.99, popular: false },
  { qty: 25000, price: 449.99, popular: false },
  { qty: 50000, price: 799.99, popular: false },
  { qty: 100000, price: 1399.99, popular: false },
];

console.log("Seeding pricing rows for service x_retweets...");

let inserted = 0, skipped = 0;
for (let i = 0; i < PACKS.length; i++) {
  const p = PACKS[i];
  const existing = await sql`SELECT id FROM pricing WHERE service = 'x_retweets' AND qty = ${p.qty} LIMIT 1`;
  if (existing.length > 0) { skipped++; continue; }
  await sql`
    INSERT INTO pricing (service, qty, price, popular, active, sort_order)
    VALUES ('x_retweets', ${p.qty}, ${p.price}, ${p.popular}, true, ${(i + 1) * 1000})
  `;
  inserted++;
}

const rows = await sql`SELECT qty, price, popular, active FROM pricing WHERE service = 'x_retweets' ORDER BY qty ASC`;
console.log(`\nInserted ${inserted}, skipped ${skipped} (already present).`);
console.log("Current x_retweets pricing rows:");
for (const r of rows) {
  console.log(`  ${String(r.qty).padStart(7)}  €${r.price}${r.popular ? "  (popular)" : ""}${r.active ? "" : "  [inactive]"}`);
}
process.exit(0);
