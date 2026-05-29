import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Seeds ad_costs_by_keyword from the live Google Ads keyword_view (real data,
// like seed-gclids.mjs — NOT synthetic). Also ensures the table + the
// checkout_payloads.keyword/match_type columns exist so the keyword-LTV ROAS
// view has somewhere to read from.
//
//   node scripts/seed-keyword-costs.mjs [days]   (default 30)
//
// Revenue stays 0 in the view until the ad Final URL suffix
// `kw={keyword}&mt={matchtype}` is live and orders start carrying a keyword.

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

console.log("Ensuring ad_costs_by_keyword + checkout_payloads columns...");
await sql`
  CREATE TABLE IF NOT EXISTS ad_costs_by_keyword (
    date DATE NOT NULL,
    campaign_id BIGINT NOT NULL,
    campaign_name VARCHAR(200) NOT NULL DEFAULT '',
    ad_group_id BIGINT NOT NULL,
    ad_group_name VARCHAR(200) NOT NULL DEFAULT '',
    criterion_id BIGINT NOT NULL,
    keyword_text VARCHAR(400) NOT NULL,
    match_type VARCHAR(20) NOT NULL DEFAULT '',
    cost_cents BIGINT NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    conversions NUMERIC(10,2) NOT NULL DEFAULT 0,
    conversions_value NUMERIC(12,2) NOT NULL DEFAULT 0,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (date, ad_group_id, criterion_id)
  )
`;
await sql`CREATE INDEX IF NOT EXISTS idx_kw_cost_date ON ad_costs_by_keyword(date DESC)`;
await sql`CREATE INDEX IF NOT EXISTS idx_kw_cost_text ON ad_costs_by_keyword(LOWER(keyword_text))`;
await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS keyword VARCHAR(400) DEFAULT ''`;
await sql`ALTER TABLE checkout_payloads ADD COLUMN IF NOT EXISTS match_type VARCHAR(20) DEFAULT ''`;
await sql`CREATE INDEX IF NOT EXISTS idx_checkout_keyword ON checkout_payloads(LOWER(keyword)) WHERE keyword <> ''`;

const haveAds =
  env.GOOGLE_ADS_CLIENT_ID &&
  env.GOOGLE_ADS_CLIENT_SECRET &&
  env.GOOGLE_ADS_DEVELOPER_TOKEN &&
  env.GOOGLE_ADS_REFRESH_TOKEN &&
  env.GOOGLE_ADS_CUSTOMER_ID;

if (!haveAds) {
  console.log("Google Ads env not fully set — tables ensured, no cost pulled.");
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM ad_costs_by_keyword`;
  console.log(`ad_costs_by_keyword rows: ${count}`);
  process.exit(0);
}

const { GoogleAdsApi } = await import("google-ads-api");
const client = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, ""),
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: (env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "").replace(/-/g, "") || undefined,
});

const DAYS = Math.max(1, Math.min(90, Number(process.argv[2]) || 30));
const microsToCents = (m) => (Number.isFinite(Number(m)) && m ? Math.round(Number(m) / 10_000) : 0);
const isoDate = (d) => (typeof d === "string" ? d.slice(0, 10) : "");

console.log(`Pulling keyword_view for LAST_${DAYS}_DAYS...`);
let rows;
try {
  rows = await customer.query(`
    SELECT
      campaign.id, campaign.name,
      ad_group.id, ad_group.name,
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      segments.date,
      metrics.cost_micros, metrics.clicks, metrics.impressions,
      metrics.conversions, metrics.conversions_value
    FROM keyword_view
    WHERE segments.date DURING LAST_${DAYS}_DAYS
  `);
} catch (err) {
  console.error("keyword_view query failed:", err?.errors ? JSON.stringify(err.errors) : err?.message || err);
  process.exit(1);
}

let upserted = 0;
for (const r of rows) {
  const keywordText = (r.ad_group_criterion?.keyword?.text || "").trim().slice(0, 400);
  if (!r.campaign?.id || !r.ad_group?.id || !r.ad_group_criterion?.criterion_id || !r.segments?.date || !keywordText) {
    continue;
  }
  await sql`
    INSERT INTO ad_costs_by_keyword
      (date, campaign_id, campaign_name, ad_group_id, ad_group_name, criterion_id, keyword_text, match_type, cost_cents, clicks, impressions, conversions, conversions_value, synced_at)
    VALUES
      (${isoDate(r.segments.date)}::date, ${String(r.campaign.id)}::bigint, ${r.campaign.name || ""},
       ${String(r.ad_group.id)}::bigint, ${r.ad_group.name || ""}, ${String(r.ad_group_criterion.criterion_id)}::bigint,
       ${keywordText}, ${String(r.ad_group_criterion?.keyword?.match_type ?? "").slice(0, 20)},
       ${microsToCents(r.metrics?.cost_micros)}, ${Number(r.metrics?.clicks) || 0}, ${Number(r.metrics?.impressions) || 0},
       ${Number(r.metrics?.conversions) || 0}, ${Number(r.metrics?.conversions_value) || 0}, NOW())
    ON CONFLICT (date, ad_group_id, criterion_id) DO UPDATE SET
      campaign_id = EXCLUDED.campaign_id,
      campaign_name = EXCLUDED.campaign_name,
      ad_group_name = EXCLUDED.ad_group_name,
      keyword_text = EXCLUDED.keyword_text,
      match_type = EXCLUDED.match_type,
      cost_cents = EXCLUDED.cost_cents,
      clicks = EXCLUDED.clicks,
      impressions = EXCLUDED.impressions,
      conversions = EXCLUDED.conversions,
      conversions_value = EXCLUDED.conversions_value,
      synced_at = NOW()
  `;
  upserted++;
}

console.log(`\nFetched ${rows.length} keyword-day rows, upserted ${upserted}.`);
const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM ad_costs_by_keyword`;
const [{ kws }] = await sql`SELECT COUNT(DISTINCT LOWER(keyword_text))::int AS kws FROM ad_costs_by_keyword`;
console.log(`ad_costs_by_keyword total rows: ${count} · distinct keywords: ${kws}`);
