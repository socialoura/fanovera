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

const FR_CAMPAIGN = 23844165759;
const FR_AGS = [
  { id: 199407036191, label: "Commercial" },
  { id: 200522508910, label: "Instagram" },
  { id: 195535404423, label: "Tiktok" },
  { id: 199534494209, label: "Twitch" },
];

// 1. Campaign-level sitelinks
console.log(`=== CAMPAIGN-LEVEL sitelinks for [FR] Fanovera (${FR_CAMPAIGN}) ===`);
const campAssets = await customer.query(`
  SELECT
    campaign.id, campaign.name,
    campaign_asset.asset, campaign_asset.field_type, campaign_asset.status,
    asset.id, asset.name, asset.type,
    asset.sitelink_asset.link_text,
    asset.sitelink_asset.description1,
    asset.sitelink_asset.description2,
    asset.final_urls
  FROM campaign_asset
  WHERE campaign.id = ${FR_CAMPAIGN}
    AND campaign_asset.field_type = 'SITELINK'
    AND campaign_asset.status != 'REMOVED'
`);
console.log(`Found ${campAssets.length} campaign sitelinks`);
for (const a of campAssets) {
  const s = a.asset?.sitelink_asset;
  console.log(`  - "${s?.link_text}"  → ${(a.asset?.final_urls || []).join(", ")}`);
  if (s?.description1) console.log(`      ${s.description1}`);
  if (s?.description2) console.log(`      ${s.description2}`);
}

// 2. Ad-group-level sitelinks per FR AG
for (const ag of FR_AGS) {
  console.log(`\n=== AD-GROUP sitelinks for ${ag.label} (${ag.id}) ===`);
  const agAssets = await customer.query(`
    SELECT
      ad_group.id, ad_group.name,
      ad_group_asset.asset, ad_group_asset.field_type, ad_group_asset.status,
      asset.id, asset.name, asset.type,
      asset.sitelink_asset.link_text,
      asset.sitelink_asset.description1,
      asset.sitelink_asset.description2,
      asset.final_urls
    FROM ad_group_asset
    WHERE ad_group.id = ${ag.id}
      AND ad_group_asset.field_type = 'SITELINK'
      AND ad_group_asset.status != 'REMOVED'
  `);
  console.log(`Found ${agAssets.length} ad-group sitelinks`);
  for (const a of agAssets) {
    const s = a.asset?.sitelink_asset;
    console.log(`  - "${s?.link_text}"  → ${(a.asset?.final_urls || []).join(", ")}`);
    if (s?.description1) console.log(`      ${s.description1}`);
    if (s?.description2) console.log(`      ${s.description2}`);
  }
}

// 3. Account-level sitelinks (fallback)
console.log(`\n=== ACCOUNT-LEVEL sitelinks ===`);
const acctAssets = await customer.query(`
  SELECT
    customer_asset.asset, customer_asset.field_type, customer_asset.status,
    asset.id, asset.name, asset.type,
    asset.sitelink_asset.link_text,
    asset.sitelink_asset.description1,
    asset.sitelink_asset.description2,
    asset.final_urls
  FROM customer_asset
  WHERE customer_asset.field_type = 'SITELINK'
    AND customer_asset.status != 'REMOVED'
`);
console.log(`Found ${acctAssets.length} account sitelinks`);
for (const a of acctAssets) {
  const s = a.asset?.sitelink_asset;
  console.log(`  - "${s?.link_text}"  → ${(a.asset?.final_urls || []).join(", ")}`);
  if (s?.description1) console.log(`      ${s.description1}`);
  if (s?.description2) console.log(`      ${s.description2}`);
}
