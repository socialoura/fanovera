#!/usr/bin/env node
/**
 * One-off seeder for the email_flows / email_flow_runs tables.
 * Idempotent: CREATE IF NOT EXISTS + INSERT ON CONFLICT DO NOTHING.
 *
 * Usage:
 *   node scripts/seed-email-flows.mjs
 *
 * Reads DATABASE_URL from .env.local automatically.
 */

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {
    // ignore
  }
}

loadEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL missing — set it or add it to .env.local");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const FLOWS_SEED = [
  { key: "abandoned_cart",         group: "abandoned",     label_fr: "Panier abandonné (H+1)",       label_en: "Abandoned cart (H+1)",          delay: 1,    pct: 5,  subject_fr: "Tu as oublié quelque chose ?",  subject_en: "Did you forget something?",                sort: 10 },
  { key: "post_purchase_7d",       group: "post_purchase", label_fr: "Relance post-achat (J+7)",     label_en: "Post-purchase reminder (D+7)",  delay: 168,  pct: 10, subject_fr: "Tes followers tiennent bien ?", subject_en: "Are your followers still going strong?",   sort: 20 },
  { key: "cross_sell_likes",       group: "crosssell_likes", label_fr: "Cross-sell likes (J+2)",     label_en: "Likes cross-sell (D+2)",        delay: 48,   pct: 15, subject_fr: "Tes followers méritent des likes 👀", subject_en: "Your followers deserve some likes 👀", sort: 25 },
  { key: "post_purchase_30d",      group: "post_purchase", label_fr: "Relance post-achat (J+30)",    label_en: "Post-purchase reminder (D+30)", delay: 720,  pct: 15, subject_fr: "On te recharge ?",              subject_en: "Time for a top-up?",                       sort: 30 },
  { key: "win_back_60d",           group: "winback",       label_fr: "Win-back (J+60)",              label_en: "Win-back (D+60)",               delay: 1440, pct: 20, subject_fr: "Ça fait un moment...",          subject_en: "It's been a while...",                     sort: 40 },
  { key: "win_back_90d",           group: "winback",       label_fr: "Win-back agressif (J+90)",     label_en: "Aggressive win-back (D+90)",    delay: 2160, pct: 25, subject_fr: "Reviens avec -{pct}%",          subject_en: "Come back with -{pct}%",                   sort: 50 },
  { key: "confirmation_crosssell", group: "crosssell",     label_fr: "Cross-sell dans confirmation", label_en: "Cross-sell in confirmation",    delay: 0,    pct: 20, subject_fr: "",                              subject_en: "",                                         sort: 60 },
];

async function main() {
  console.log("→ Creating email_flows table...");
  await sql`
    CREATE TABLE IF NOT EXISTS email_flows (
      key VARCHAR(40) PRIMARY KEY,
      label_fr VARCHAR(120) NOT NULL DEFAULT '',
      label_en VARCHAR(120) NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT true,
      delay_hours INTEGER NOT NULL DEFAULT 0,
      discount_pct INTEGER NOT NULL DEFAULT 0,
      subject_fr VARCHAR(200) NOT NULL DEFAULT '',
      subject_en VARCHAR(200) NOT NULL DEFAULT '',
      min_order_cents INTEGER NOT NULL DEFAULT 0,
      group_key VARCHAR(40) NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  console.log("→ Creating email_flow_runs table...");
  await sql`
    CREATE TABLE IF NOT EXISTS email_flow_runs (
      id SERIAL PRIMARY KEY,
      flow_key VARCHAR(40) NOT NULL,
      order_id INTEGER,
      email VARCHAR(255) NOT NULL,
      promo_code VARCHAR(40) DEFAULT '',
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(flow_key, order_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_email_flow_runs_email ON email_flow_runs(LOWER(email), sent_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_email_flow_runs_sent_at ON email_flow_runs(sent_at DESC)`;

  console.log("→ Adding conversion-tracking columns (idempotent)...");
  await sql`ALTER TABLE email_flow_runs ADD COLUMN IF NOT EXISTS converted_order_id INTEGER`;
  await sql`ALTER TABLE email_flow_runs ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ`;
  await sql`ALTER TABLE email_flow_runs ADD COLUMN IF NOT EXISTS converted_revenue_cents INTEGER`;

  console.log("→ Seeding default flows (idempotent)...");
  for (const f of FLOWS_SEED) {
    await sql`
      INSERT INTO email_flows (key, group_key, label_fr, label_en, delay_hours, discount_pct, subject_fr, subject_en, sort_order)
      VALUES (${f.key}, ${f.group}, ${f.label_fr}, ${f.label_en}, ${f.delay}, ${f.pct}, ${f.subject_fr}, ${f.subject_en}, ${f.sort})
      ON CONFLICT (key) DO NOTHING
    `;
  }

  const rows = await sql`SELECT key, group_key, active, delay_hours, discount_pct FROM email_flows ORDER BY sort_order`;
  console.log("\n✓ Done. Flows in DB:");
  for (const r of rows) {
    console.log(`  ${r.active ? "✓" : "✗"} ${r.key.padEnd(28)} ${r.group_key.padEnd(14)} delay=${r.delay_hours}h pct=${r.discount_pct}%`);
  }
}

main().catch((err) => {
  console.error("✗ Seed failed:", err);
  process.exit(1);
});
