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

const DAYS = Number(process.argv[2]) || 30;
let totalFetched = 0;
let totalInserted = 0;

const today = new Date();
today.setUTCHours(0, 0, 0, 0);

for (let i = 0; i < DAYS; i++) {
  const d = new Date(today);
  d.setUTCDate(today.getUTCDate() - i);
  const day = d.toISOString().slice(0, 10);

  let rows;
  try {
    rows = await customer.query(`
      SELECT click_view.gclid, campaign.id, campaign.name, ad_group.id, segments.date
      FROM click_view
      WHERE segments.date = '${day}'
    `);
  } catch (err) {
    console.log(`  ${day}: ERROR ${err?.errors ? JSON.stringify(err.errors) : err?.message || err}`);
    continue;
  }

  let inserted = 0;
  for (const r of rows) {
    const gclid = r.click_view?.gclid;
    const campaignId = r.campaign?.id;
    if (!gclid || !campaignId) continue;
    const result = await sql`
      INSERT INTO gclid_campaign_map (gclid, campaign_id, campaign_name, ad_group_id, click_date)
      VALUES (${gclid}, ${String(campaignId)}::bigint, ${r.campaign?.name || ""}, ${r.ad_group?.id ? String(r.ad_group.id) : null}, ${day}::date)
      ON CONFLICT (gclid) DO NOTHING
      RETURNING gclid
    `;
    if (result.length > 0) inserted++;
  }
  totalFetched += rows.length;
  totalInserted += inserted;
  console.log(`  ${day}: fetched=${rows.length} inserted=${inserted}`);
}

console.log(`\nTotal: fetched=${totalFetched} inserted=${totalInserted}`);

const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM gclid_campaign_map`;
console.log(`gclid_campaign_map total rows: ${count}`);
