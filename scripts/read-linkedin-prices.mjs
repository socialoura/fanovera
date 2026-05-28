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

console.log("=== All active EN ad groups (looking for any LinkedIn) ===");
const ags = await customer.query(`
  SELECT campaign.name, ad_group.id, ad_group.name
  FROM ad_group
  WHERE campaign.status != 'REMOVED' AND ad_group.status != 'REMOVED'
    AND campaign.name LIKE '%EN%'
  ORDER BY ad_group.name
`);
for (const a of ags) {
  console.log(`  [${a.campaign.name}]  ${a.ad_group.id}  ${a.ad_group.name}`);
}

console.log("\n=== DB LinkedIn prices (li_followers) ===");
const sql = neon(env.DATABASE_URL);
const rows = await sql`
  SELECT qty, price::float AS price, popular
  FROM pricing
  WHERE service = 'li_followers' AND active = true
  ORDER BY qty
`;
for (const r of rows) {
  console.log(`  qty=${r.qty.toString().padStart(8)}  €${r.price.toFixed(2).padStart(10)}  popular=${r.popular}`);
}
