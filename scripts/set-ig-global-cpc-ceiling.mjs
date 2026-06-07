/** Set the max-CPC ceiling on [GLOBAL] IG (Maximize Clicks / TARGET_SPEND). */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const { GoogleAdsApi } = await import("google-ads-api");
const customerId = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
const customer = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID, client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: customerId,
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});
const CID = "23920353991";
const CEIL = 600000; // 0.60€
const eur = (m) => (Number(m) / 1e6).toFixed(2);

const before = (await customer.query(`
  SELECT campaign.bidding_strategy_type, campaign.target_spend.cpc_bid_ceiling_micros
  FROM campaign WHERE campaign.id=${CID}
`))[0];
console.log(`Before: strategy=${before.campaign.bidding_strategy_type} ceiling=${before.campaign.target_spend?.cpc_bid_ceiling_micros ? eur(before.campaign.target_spend.cpc_bid_ceiling_micros)+"€" : "(none)"}`);

const res = await customer.campaigns.update([{
  resource_name: `customers/${customerId}/campaigns/${CID}`,
  target_spend: { cpc_bid_ceiling_micros: CEIL },
}]);
console.log(`Updated: ${res.results?.[0]?.resource_name}`);

const after = (await customer.query(`
  SELECT campaign.target_spend.cpc_bid_ceiling_micros
  FROM campaign WHERE campaign.id=${CID}
`))[0];
console.log(`After: ceiling=${eur(after.campaign.target_spend.cpc_bid_ceiling_micros)}€`);
