// Delete orders that originated on the OTHER site (Fanovaly) sharing the same
// Stripe account. Criterion: has a Stripe PI but NO checkout_payloads row
// (only Fanovera writes a payload for its own PIs — see diag-foreign-orders.mjs).
//
//   node scripts/clean-foreign-orders.mjs           # DRY RUN — lists, deletes nothing
//   node scripts/clean-foreign-orders.mjs --apply    # actually delete
//
// Safety rails:
//  - Dry run by default.
//  - Refuses to run if it would delete more than MAX_DELETE rows (guards against
//    a checkout_payloads outage making every order look "foreign").
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const APPLY = process.argv.includes("--apply");
const MAX_DELETE = 20; // abort if more than this many suspects — investigate first.

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const sql = neon(env.DATABASE_URL);

const suspects = await sql`
  SELECT o.id, LOWER(o.email) AS email, o.platform, o.status,
         o.total_cents, o.currency, o.created_at
  FROM orders o
  LEFT JOIN checkout_payloads cp ON cp.payment_intent_id = o.stripe_payment_intent_id
  WHERE o.stripe_payment_intent_id IS NOT NULL
    AND o.stripe_payment_intent_id <> ''
    AND cp.payment_intent_id IS NULL
  ORDER BY o.created_at DESC
`;

console.log(`Found ${suspects.length} foreign-order suspect(s):`);
for (const s of suspects) {
  console.log(
    `  #${String(s.id).padEnd(6)} ${new Date(s.created_at).toISOString().slice(0, 10)}  ` +
    `${String(s.platform || "—").padEnd(12)} ${String(s.status || "—").padEnd(12)} ` +
    `${((Number(s.total_cents) || 0) / 100).toFixed(2)} ${String(s.currency || "").toUpperCase()}  ` +
    `${s.email || "(no email)"}`
  );
}

if (suspects.length === 0) { console.log("\nNothing to do."); process.exit(0); }

if (suspects.length > MAX_DELETE) {
  console.error(`\nABORT: ${suspects.length} suspects exceeds safety cap (${MAX_DELETE}). Investigate — a checkout_payloads outage can make legit orders look foreign.`);
  process.exit(1);
}

if (!APPLY) {
  console.log(`\nDRY RUN — nothing deleted. Re-run with --apply to delete the ${suspects.length} row(s) above.`);
  process.exit(0);
}

const ids = suspects.map((s) => s.id);
const del = await sql`DELETE FROM orders WHERE id = ANY(${ids}) RETURNING id`;
console.log(`\nDeleted ${del.length} order(s): ${del.map((r) => "#" + r.id).join(", ")}`);
