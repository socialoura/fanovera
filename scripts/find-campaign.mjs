/** List all enabled/paused campaigns with their geo targets. */
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
const customer = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, ""),
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});

const camps = await customer.query(`
  SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type
  FROM campaign
  WHERE campaign.status != 'REMOVED'
  ORDER BY campaign.name
`);

for (const c of camps) {
  const cc = c.campaign;
  const geo = await customer.query(`
    SELECT campaign_criterion.location.geo_target_constant, campaign_criterion.negative
    FROM campaign_criterion
    WHERE campaign.id = ${cc.id} AND campaign_criterion.type = 'LOCATION' AND campaign_criterion.status != 'REMOVED'
  `);
  const positives = geo.filter((g) => !g.campaign_criterion.negative).map((g) => g.campaign_criterion.location.geo_target_constant.split("/").pop());
  const negatives = geo.filter((g) => g.campaign_criterion.negative).map((g) => g.campaign_criterion.location.geo_target_constant.split("/").pop());
  console.log(`[${cc.status === 2 ? "ENABLED" : cc.status === 3 ? "PAUSED " : "OTHER  "}] ${String(cc.id).padEnd(12)} ${cc.name.padEnd(28)} geo+=${positives.join(",") || "—"}  geo-=${negatives.join(",") || "—"}`);
}
