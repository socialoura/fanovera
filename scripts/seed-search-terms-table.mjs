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

console.log("Creating ad_costs_by_campaign...");
await sql`
  CREATE TABLE IF NOT EXISTS ad_costs_by_campaign (
    date DATE NOT NULL,
    campaign_id BIGINT NOT NULL,
    campaign_name VARCHAR(200) NOT NULL DEFAULT '',
    cost_cents BIGINT NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    conversions NUMERIC(10,2) NOT NULL DEFAULT 0,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (date, campaign_id)
  )
`;
await sql`CREATE INDEX IF NOT EXISTS idx_ad_costs_campaign_date ON ad_costs_by_campaign(campaign_id, date DESC)`;
await sql`CREATE INDEX IF NOT EXISTS idx_ad_costs_date ON ad_costs_by_campaign(date DESC)`;

console.log("Creating ad_costs_by_ad_group...");
await sql`
  CREATE TABLE IF NOT EXISTS ad_costs_by_ad_group (
    date DATE NOT NULL,
    campaign_id BIGINT NOT NULL,
    campaign_name VARCHAR(200) NOT NULL DEFAULT '',
    ad_group_id BIGINT NOT NULL,
    ad_group_name VARCHAR(200) NOT NULL DEFAULT '',
    cost_cents BIGINT NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    conversions NUMERIC(10,2) NOT NULL DEFAULT 0,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (date, ad_group_id)
  )
`;
await sql`CREATE INDEX IF NOT EXISTS idx_ad_costs_adgroup_date ON ad_costs_by_ad_group(ad_group_id, date DESC)`;
await sql`CREATE INDEX IF NOT EXISTS idx_ad_costs_adgroup_campaign ON ad_costs_by_ad_group(campaign_id, date DESC)`;

console.log("Creating ad_costs_by_search_term...");
await sql`
  CREATE TABLE IF NOT EXISTS ad_costs_by_search_term (
    date DATE NOT NULL,
    campaign_id BIGINT NOT NULL,
    campaign_name VARCHAR(200) NOT NULL DEFAULT '',
    ad_group_id BIGINT NOT NULL,
    ad_group_name VARCHAR(200) NOT NULL DEFAULT '',
    search_term VARCHAR(400) NOT NULL,
    cost_cents BIGINT NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    conversions NUMERIC(10,2) NOT NULL DEFAULT 0,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (date, ad_group_id, search_term)
  )
`;
await sql`CREATE INDEX IF NOT EXISTS idx_search_term_date ON ad_costs_by_search_term(date DESC)`;
await sql`CREATE INDEX IF NOT EXISTS idx_search_term_term ON ad_costs_by_search_term(search_term)`;

console.log("Creating gclid_campaign_map...");
await sql`
  CREATE TABLE IF NOT EXISTS gclid_campaign_map (
    gclid VARCHAR(200) PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    campaign_name VARCHAR(200) NOT NULL DEFAULT '',
    ad_group_id BIGINT,
    click_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;
await sql`CREATE INDEX IF NOT EXISTS idx_gclid_campaign ON gclid_campaign_map(campaign_id)`;
await sql`CREATE INDEX IF NOT EXISTS idx_gclid_click_date ON gclid_campaign_map(click_date DESC)`;

console.log("\nRow counts:");
const [{ count: c1 }] = await sql`SELECT COUNT(*)::int AS count FROM ad_costs_by_campaign`;
const [{ count: c2 }] = await sql`SELECT COUNT(*)::int AS count FROM ad_costs_by_ad_group`;
const [{ count: c3 }] = await sql`SELECT COUNT(*)::int AS count FROM ad_costs_by_search_term`;
const [{ count: c4 }] = await sql`SELECT COUNT(*)::int AS count FROM gclid_campaign_map`;
console.log(`  ad_costs_by_campaign:     ${c1}`);
console.log(`  ad_costs_by_ad_group:     ${c2}`);
console.log(`  ad_costs_by_search_term:  ${c3}`);
console.log(`  gclid_campaign_map:       ${c4}`);
