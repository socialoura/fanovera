/**
 * Adds the new upsells columns. Idempotent — safe to run multiple times.
 *
 * Run with: node scripts/migrate-upsells.mjs
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

if (!env.DATABASE_URL) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const sql = neon(env.DATABASE_URL);

const steps = [
  {
    label: "price_cents column",
    run: () => sql`ALTER TABLE upsells ADD COLUMN IF NOT EXISTS price_cents INTEGER NOT NULL DEFAULT 0`,
  },
  {
    label: "trigger_platform column",
    run: () => sql`ALTER TABLE upsells ADD COLUMN IF NOT EXISTS trigger_platform VARCHAR(30)`,
  },
  {
    label: "trigger_service column",
    run: () => sql`ALTER TABLE upsells ADD COLUMN IF NOT EXISTS trigger_service VARCHAR(30)`,
  },
  {
    label: "trigger index",
    run: () => sql`CREATE INDEX IF NOT EXISTS idx_upsells_trigger ON upsells(trigger_platform, trigger_service) WHERE active = true`,
  },
  // Per-currency prices. Nullable: NULL = "auto-convert from EUR baseline".
  { label: "price_cents_usd", run: () => sql`ALTER TABLE upsells ADD COLUMN IF NOT EXISTS price_cents_usd INTEGER` },
  { label: "price_cents_gbp", run: () => sql`ALTER TABLE upsells ADD COLUMN IF NOT EXISTS price_cents_gbp INTEGER` },
  { label: "price_cents_brl", run: () => sql`ALTER TABLE upsells ADD COLUMN IF NOT EXISTS price_cents_brl INTEGER` },
  { label: "price_cents_try", run: () => sql`ALTER TABLE upsells ADD COLUMN IF NOT EXISTS price_cents_try INTEGER` },
  { label: "price_cents_cad", run: () => sql`ALTER TABLE upsells ADD COLUMN IF NOT EXISTS price_cents_cad INTEGER` },
  { label: "price_cents_aud", run: () => sql`ALTER TABLE upsells ADD COLUMN IF NOT EXISTS price_cents_aud INTEGER` },
  { label: "price_cents_chf", run: () => sql`ALTER TABLE upsells ADD COLUMN IF NOT EXISTS price_cents_chf INTEGER` },
  { label: "price_cents_mxn", run: () => sql`ALTER TABLE upsells ADD COLUMN IF NOT EXISTS price_cents_mxn INTEGER` },
  { label: "price_cents_sek", run: () => sql`ALTER TABLE upsells ADD COLUMN IF NOT EXISTS price_cents_sek INTEGER` },
];

console.log("Migrating upsells table…\n");

for (const step of steps) {
  process.stdout.write(`  - ${step.label} … `);
  try {
    await step.run();
    console.log("ok");
  } catch (err) {
    console.log("FAILED");
    console.error(err);
    process.exit(1);
  }
}

const cols = await sql`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'upsells'
  ORDER BY ordinal_position
`;

console.log("\nCurrent upsells columns:");
for (const c of cols) {
  console.log(`  ${c.column_name.padEnd(24)} ${c.data_type.padEnd(20)} ${c.is_nullable === "NO" ? "NOT NULL" : "NULL"}`);
}

console.log("\nDone.");
