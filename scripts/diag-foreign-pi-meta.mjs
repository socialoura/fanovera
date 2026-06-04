// READ-ONLY: dump Stripe metadata for the suspect (no-checkout_payload) PIs.
import { readFileSync } from "node:fs";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const sql = neon(env.DATABASE_URL);
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const rows = await sql`
  SELECT o.id, o.stripe_payment_intent_id AS pi
  FROM orders o
  LEFT JOIN checkout_payloads cp ON cp.payment_intent_id = o.stripe_payment_intent_id
  WHERE o.stripe_payment_intent_id <> '' AND cp.payment_intent_id IS NULL
  ORDER BY o.created_at DESC
`;

for (const r of rows) {
  try {
    const pi = await stripe.paymentIntents.retrieve(r.pi, { expand: ["latest_charge"] });
    const charge = pi.latest_charge && typeof pi.latest_charge === "object" ? pi.latest_charge : null;
    console.log(`order #${r.id}  ${r.pi}`);
    console.log(`  description:          ${pi.description || "(none)"}`);
    console.log(`  statement_descriptor:${pi.statement_descriptor || "(none)"}`);
    console.log(`  charge.statement_descriptor: ${charge?.statement_descriptor || "(none)"}`);
    console.log(`  charge.calculated_statement_descriptor: ${charge?.calculated_statement_descriptor || "(none)"}`);
    console.log(`  metadata: ${JSON.stringify(pi.metadata)}`);
    console.log("");
  } catch (e) {
    console.log(`order #${r.id} ${r.pi} ERR ${e.message}`);
  }
}
