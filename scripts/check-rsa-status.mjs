/** Read-only: RSA status for the new ES/IT ad groups. */
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
  client_id: env.GOOGLE_ADS_CLIENT_ID, client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, ""),
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});

const AGS = [197117786636, 192257550210, 199753097409, 198525215753, 200863096470, 197785315900];
const rows = await customer.query(`
  SELECT campaign.name, ad_group.name, ad_group.status,
         ad_group_ad.status, ad_group_ad.ad.id, ad_group_ad.policy_summary.approval_status
  FROM ad_group_ad
  WHERE ad_group.id IN (${AGS.join(",")}) AND ad_group_ad.status != 'REMOVED'
`);
for (const r of rows) {
  console.log(`${r.campaign.name} › ${r.ad_group.name}  | AG=${r.ad_group.status}   AD=${r.ad_group_ad.status}  policy=${r.ad_group_ad.policy_summary?.approval_status ?? "?"}`);
}
