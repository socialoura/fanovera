/**
 * READ-ONLY. Dumps the RSA (headlines + descriptions) of every ad group on the
 * [UK] campaign, so we can copy them verbatim into the new global campaigns.
 * Creates / modifies NOTHING.
 *
 *   node scripts/read-uk-rsa.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const CUSTOMER_ID = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
const UK = 23844174192;

const { GoogleAdsApi } = await import("google-ads-api");
const customer = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: CUSTOMER_ID,
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});

const rows = await customer.query(`
  SELECT ad_group.name, ad_group_ad.status,
         ad_group_ad.ad.final_urls,
         ad_group_ad.ad.responsive_search_ad.headlines,
         ad_group_ad.ad.responsive_search_ad.descriptions
  FROM ad_group_ad
  WHERE campaign.id = ${UK}
    AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
    AND ad_group_ad.status != 'REMOVED'
  ORDER BY ad_group.name
`);

const ST = { 2: "ENABLED", 3: "PAUSED" };
for (const r of rows) {
  const ag = r.ad_group.name;
  const rsa = r.ad_group_ad.ad.responsive_search_ad || {};
  console.log("\n" + "═".repeat(64));
  console.log(`AD GROUP: ${ag}   [${ST[r.ad_group_ad.status] || r.ad_group_ad.status}]`);
  console.log(`final_urls: ${(r.ad_group_ad.ad.final_urls || []).join(", ")}`);
  console.log("─ Headlines ─");
  for (const h of rsa.headlines || []) console.log(`  "${h.text}"  (${h.text.length})${h.pinned_field ? `  pin:${h.pinned_field}` : ""}`);
  console.log("─ Descriptions ─");
  for (const d of rsa.descriptions || []) console.log(`  "${d.text}"  (${d.text.length})${d.pinned_field ? `  pin:${d.pinned_field}` : ""}`);
}
console.log(`\n${rows.length} RSA found on [UK].`);
