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

// 1. List campaigns
console.log("=== CAMPAIGNS ===");
const campaigns = await customer.query(`
  SELECT campaign.id, campaign.name, campaign.status
  FROM campaign
  WHERE campaign.status != 'REMOVED'
`);
for (const c of campaigns) {
  console.log(`  ${c.campaign.id}  ${c.campaign.name}  [${c.campaign.status}]`);
}

// 2. List ad groups for both campaigns (assume FR + EN in name)
console.log("\n=== AD GROUPS (all active campaigns) ===");
const ags = await customer.query(`
  SELECT campaign.id, campaign.name, ad_group.id, ad_group.name, ad_group.status
  FROM ad_group
  WHERE campaign.status != 'REMOVED' AND ad_group.status != 'REMOVED'
  ORDER BY campaign.name, ad_group.name
`);
for (const a of ags) {
  console.log(`  [${a.campaign.name}]  ${a.ad_group.id}  ${a.ad_group.name}  [${a.ad_group.status}]`);
}

// 3. Find Twitter EN ad group
const twitterEn = ags.find(
  (a) =>
    /twitter|x ads|^x /i.test(a.ad_group.name) &&
    /\[?EN\]?|english|anglais/i.test(a.campaign.name),
);
if (!twitterEn) {
  console.log("\n⚠️ No EN Twitter ad group found by name match. Inspect list above.");
  process.exit(0);
}
const adGroupId = twitterEn.ad_group.id;
console.log(`\n=== TWITTER EN ad group: ${adGroupId} (${twitterEn.ad_group.name}) ===`);

// 4. Keywords (positive + ad-group negatives)
console.log("\n--- Keywords (ad-group criteria) ---");
const kws = await customer.query(`
  SELECT
    ad_group_criterion.criterion_id,
    ad_group_criterion.type,
    ad_group_criterion.negative,
    ad_group_criterion.status,
    ad_group_criterion.keyword.text,
    ad_group_criterion.keyword.match_type
  FROM ad_group_criterion
  WHERE ad_group.id = ${adGroupId}
    AND ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.status != 'REMOVED'
`);
const pos = kws.filter((k) => !k.ad_group_criterion.negative);
const neg = kws.filter((k) => k.ad_group_criterion.negative);
console.log(`Positive (${pos.length}):`);
for (const k of pos) {
  console.log(`  [${k.ad_group_criterion.keyword.match_type}] ${k.ad_group_criterion.keyword.text}`);
}
console.log(`\nAd-group negatives (${neg.length}):`);
for (const k of neg) {
  console.log(`  [${k.ad_group_criterion.keyword.match_type}] ${k.ad_group_criterion.keyword.text}`);
}

// 5. Ads (RSA)
console.log("\n--- RSAs ---");
const ads = await customer.query(`
  SELECT
    ad_group_ad.ad.id,
    ad_group_ad.ad.type,
    ad_group_ad.status,
    ad_group_ad.ad.final_urls,
    ad_group_ad.ad.responsive_search_ad.headlines,
    ad_group_ad.ad.responsive_search_ad.descriptions,
    ad_group_ad.ad.responsive_search_ad.path1,
    ad_group_ad.ad.responsive_search_ad.path2
  FROM ad_group_ad
  WHERE ad_group.id = ${adGroupId}
    AND ad_group_ad.status != 'REMOVED'
`);
for (const a of ads) {
  const ad = a.ad_group_ad.ad;
  console.log(`\nAd ${ad.id} [${a.ad_group_ad.status}]`);
  console.log(`  Final URLs: ${(ad.final_urls || []).join(", ")}`);
  console.log(`  Path1/2: ${ad.responsive_search_ad?.path1 || ""} / ${ad.responsive_search_ad?.path2 || ""}`);
  console.log(`  Headlines (${ad.responsive_search_ad?.headlines?.length || 0}):`);
  for (const h of ad.responsive_search_ad?.headlines || []) {
    console.log(`    "${h.text}"  ${h.pinned_field ? `[PIN ${h.pinned_field}]` : ""}`);
  }
  console.log(`  Descriptions (${ad.responsive_search_ad?.descriptions?.length || 0}):`);
  for (const d of ad.responsive_search_ad?.descriptions || []) {
    console.log(`    "${d.text}"  ${d.pinned_field ? `[PIN ${d.pinned_field}]` : ""}`);
  }
}

// 6. Ad group settings (bid, target CPA etc.)
console.log("\n--- Ad group settings ---");
const settings = await customer.query(`
  SELECT
    ad_group.id, ad_group.name, ad_group.cpc_bid_micros, ad_group.target_cpa_micros,
    ad_group.target_roas, ad_group.type
  FROM ad_group
  WHERE ad_group.id = ${adGroupId}
`);
console.log(JSON.stringify(settings[0]?.ad_group || {}, null, 2));
