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
const { GoogleAdsApi } = await import("google-ads-api");

console.log("ALTER TABLE ad_costs_by_search_term ADD COLUMN conversions_value...");
await sql`ALTER TABLE ad_costs_by_search_term ADD COLUMN IF NOT EXISTS conversions_value NUMERIC(12,2) NOT NULL DEFAULT 0`;
console.log("  done");

const client = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

const customer = client.Customer({
  customer_id: env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, ""),
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});

console.log("\nFetching search_term_view with conversions_value (LAST_30_DAYS)...");
const rows = await customer.query(`
  SELECT
    campaign.id, campaign.name,
    ad_group.id, ad_group.name,
    search_term_view.search_term,
    segments.date,
    metrics.cost_micros, metrics.clicks, metrics.impressions,
    metrics.conversions, metrics.conversions_value
  FROM search_term_view
  WHERE segments.date DURING LAST_30_DAYS
`);
console.log(`  fetched ${rows.length} rows`);

let upserted = 0;
let totalConvValue = 0;
let nonZeroConvValue = 0;
for (const r of rows) {
  const campaignId = r.campaign?.id;
  const adGroupId = r.ad_group?.id;
  const term = (r.search_term_view?.search_term || "").trim().slice(0, 400);
  const date = r.segments?.date;
  if (!campaignId || !adGroupId || !date || !term) continue;
  const costCents = Math.round((Number(r.metrics?.cost_micros) || 0) / 10000);
  const clicks = Number(r.metrics?.clicks) || 0;
  const impressions = Number(r.metrics?.impressions) || 0;
  const conversions = Number(r.metrics?.conversions) || 0;
  const conversionsValue = Number(r.metrics?.conversions_value) || 0;
  if (conversionsValue > 0) {
    nonZeroConvValue++;
    totalConvValue += conversionsValue;
  }
  await sql`
    INSERT INTO ad_costs_by_search_term
      (date, campaign_id, campaign_name, ad_group_id, ad_group_name, search_term, cost_cents, clicks, impressions, conversions, conversions_value, synced_at)
    VALUES
      (${date}::date, ${String(campaignId)}::bigint, ${r.campaign?.name || ""}, ${String(adGroupId)}::bigint, ${r.ad_group?.name || ""}, ${term}, ${costCents}, ${clicks}, ${impressions}, ${conversions}, ${conversionsValue}, NOW())
    ON CONFLICT (date, ad_group_id, search_term) DO UPDATE SET
      campaign_id = EXCLUDED.campaign_id,
      campaign_name = EXCLUDED.campaign_name,
      ad_group_name = EXCLUDED.ad_group_name,
      cost_cents = EXCLUDED.cost_cents,
      clicks = EXCLUDED.clicks,
      impressions = EXCLUDED.impressions,
      conversions = EXCLUDED.conversions,
      conversions_value = EXCLUDED.conversions_value,
      synced_at = NOW()
  `;
  upserted++;
}

console.log(`\nUpserted: ${upserted}`);
console.log(`Rows with conversions_value > 0: ${nonZeroConvValue}`);
console.log(`Total conversion value: ${totalConvValue.toFixed(2)} €`);

const [{ sum }] = await sql`SELECT COALESCE(SUM(conversions_value), 0)::float AS sum FROM ad_costs_by_search_term WHERE date >= CURRENT_DATE - INTERVAL '30 day'`;
console.log(`DB sum conversions_value (30d): ${Number(sum).toFixed(2)} €`);
