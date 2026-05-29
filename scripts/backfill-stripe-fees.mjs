import { neon } from "@neondatabase/serverless";
import Stripe from "stripe";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Backfills orders.stripe_fee_cents with the REAL Stripe processing fee read
// from each charge's balance_transaction (already in EUR, the settlement
// currency). Run once after deploying the stripe_fee_cents column so historical
// orders feed the net-profit calc instead of relying on the estimate fallback.
//
//   node scripts/backfill-stripe-fees.mjs [--all] [--limit N]
//
// By default only orders with stripe_fee_cents = 0 are processed. Pass --all to
// re-read every order (e.g. after a refund changed fees). --limit caps the run.

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

// process.env wins over .env.local so you can pass the LIVE key inline:
//   $env:STRIPE_SECRET_KEY="sk_live_…"; node scripts/backfill-stripe-fees.mjs
const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;
const stripeKey = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;

const sql = neon(databaseUrl);
const stripe = new Stripe(stripeKey, { apiVersion: "2026-04-22.dahlia" });
console.log(`Stripe key: ${stripeKey.slice(0, 8)}… (${stripeKey.startsWith("sk_live") ? "LIVE" : "TEST"} mode)`);

const args = process.argv.slice(2);
const all = args.includes("--all");
const limitIdx = args.indexOf("--limit");
const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) || 0 : 0;

console.log(`Backfilling Stripe fees (${all ? "ALL orders" : "missing only"}${limit ? `, limit ${limit}` : ""})...`);

// Idempotent: ensure the column exists even if initDb() hasn't run against
// this database yet (so the script is safe to run standalone before deploy).
await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_fee_cents INTEGER NOT NULL DEFAULT 0`;

// effectiveLimit: 0 means "no cap". Postgres has no LIMIT ALL via a param, so
// we pass a huge number when uncapped to keep a single parameterized query.
const effectiveLimit = limit > 0 ? limit : 1000000000;
const rows = all
  ? await sql`
      SELECT id, stripe_payment_intent_id
      FROM orders
      WHERE stripe_payment_intent_id IS NOT NULL AND stripe_payment_intent_id <> ''
      ORDER BY id DESC
      LIMIT ${effectiveLimit}
    `
  : await sql`
      SELECT id, stripe_payment_intent_id
      FROM orders
      WHERE stripe_fee_cents = 0
        AND stripe_payment_intent_id IS NOT NULL AND stripe_payment_intent_id <> ''
      ORDER BY id DESC
      LIMIT ${effectiveLimit}
    `;

console.log(`${rows.length} order(s) to process.`);

let updated = 0;
let skipped = 0;
let failed = 0;

for (const row of rows) {
  try {
    const pi = await stripe.paymentIntents.retrieve(row.stripe_payment_intent_id, {
      expand: ["latest_charge.balance_transaction"],
    });
    const charge = pi.latest_charge && typeof pi.latest_charge === "object" ? pi.latest_charge : null;
    const bt = charge?.balance_transaction && typeof charge.balance_transaction === "object" ? charge.balance_transaction : null;
    const fee = bt ? Number(bt.fee) || 0 : 0;
    if (!bt) {
      skipped++;
      console.warn(`  #${row.id} ${row.stripe_payment_intent_id}: no balance_transaction (skipped)`);
      continue;
    }
    await sql`UPDATE orders SET stripe_fee_cents = ${fee} WHERE id = ${row.id}`;
    updated++;
    if (updated % 25 === 0) console.log(`  ...${updated} updated`);
  } catch (err) {
    failed++;
    console.error(`  #${row.id} ${row.stripe_payment_intent_id}: ${err?.message || err}`);
  }
}

console.log(`Done. updated=${updated} skipped=${skipped} failed=${failed}`);
