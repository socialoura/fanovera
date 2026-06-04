// READ-ONLY diagnostic: find orders that likely originated on the OTHER site
// (Fanovaly) sharing the same Stripe account.
//
//   node scripts/diag-foreign-orders.mjs
//
// Mechanism: Fanovera writes a `checkout_payloads` row for every PaymentIntent
// it creates (see create-payment-intent/route.ts). A payment made on Fanovaly
// fires our shared-account webhook and gets materialized in our `orders` table,
// but it has NO matching checkout_payloads row. So "orders with a stripe PI but
// no checkout_payload" is a strong proxy for foreign orders.
//
// This script ONLY reads. It never modifies anything.
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const sql = neon(env.DATABASE_URL);

function pct(n, d) { return d ? `${((n / d) * 100).toFixed(1)}%` : "—"; }

// 1) Totals.
const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM orders`;

// 2) Orders that have a stripe_payment_intent_id but NO checkout_payloads row.
//    These are the prime suspects (created by the webhook from a foreign PI).
const suspects = await sql`
  SELECT o.id, LOWER(o.email) AS email, o.platform, o.status,
         o.total_cents, o.currency, o.created_at,
         o.stripe_payment_intent_id AS pi
  FROM orders o
  LEFT JOIN checkout_payloads cp
    ON cp.payment_intent_id = o.stripe_payment_intent_id
  WHERE o.stripe_payment_intent_id IS NOT NULL
    AND o.stripe_payment_intent_id <> ''
    AND cp.payment_intent_id IS NULL
  ORDER BY o.created_at DESC
`;

// Orders with no PI at all (manual/admin-created) — list separately, not suspects.
const [{ no_pi }] = await sql`
  SELECT COUNT(*)::int AS no_pi FROM orders
  WHERE stripe_payment_intent_id IS NULL OR stripe_payment_intent_id = ''
`;

console.log(`\n=== ORDERS OVERVIEW ===`);
console.log(`Total orders:                 ${total}`);
console.log(`Without any Stripe PI:        ${no_pi} (manual/admin — ignored)`);
console.log(`With PI but NO checkout_payload (SUSPECTS = likely Fanovaly): ${suspects.length} (${pct(suspects.length, total)})`);

if (suspects.length === 0) {
  console.log(`\nNo suspects found. Either no foreign orders, or all PIs have payloads.`);
  process.exit(0);
}

// 3) Breakdown of suspects by platform (Fanovaly may sell platforms/services
//    you don't, or use labels not in your catalog — a useful distinctive sign).
const byPlatform = new Map();
const byDomain = new Map();
let minDate = null, maxDate = null, sumCents = 0;
for (const s of suspects) {
  byPlatform.set(s.platform || "(empty)", (byPlatform.get(s.platform || "(empty)") || 0) + 1);
  const domain = s.email && s.email.includes("@") ? s.email.split("@")[1] : "(no email)";
  byDomain.set(domain, (byDomain.get(domain) || 0) + 1);
  const d = new Date(s.created_at);
  if (!minDate || d < minDate) minDate = d;
  if (!maxDate || d > maxDate) maxDate = d;
  sumCents += Number(s.total_cents) || 0;
}

console.log(`\n=== SUSPECT BREAKDOWN ===`);
console.log(`Date range: ${minDate?.toISOString().slice(0, 10)} → ${maxDate?.toISOString().slice(0, 10)}`);
console.log(`Sum total_cents: ${(sumCents / 100).toFixed(2)} (mixed currencies)`);

console.log(`\nBy platform:`);
for (const [p, c] of [...byPlatform.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(p).padEnd(20)} ${c}`);
}

console.log(`\nTop email domains:`);
for (const [d, c] of [...byDomain.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${String(d).padEnd(30)} ${c}`);
}

console.log(`\n=== SAMPLE (most recent 20 suspects) ===`);
for (const s of suspects.slice(0, 20)) {
  console.log(
    `  #${String(s.id).padEnd(6)} ${new Date(s.created_at).toISOString().slice(0, 10)}  ` +
    `${String(s.platform || "—").padEnd(12)} ${String(s.status || "—").padEnd(14)} ` +
    `${((Number(s.total_cents) || 0) / 100).toFixed(2)} ${String(s.currency || "").toUpperCase().padEnd(4)} ` +
    `${s.email || "(no email)"}`
  );
}

console.log(`\nNOTHING WAS MODIFIED. Review the above to confirm the Fanovaly signature.`);
