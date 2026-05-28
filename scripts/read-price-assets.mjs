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
const AGS = [
  { id: 199407036191, label: "Commercial FR" },
  { id: 200522508910, label: "Instagram FR" },
  { id: 195535404423, label: "Tiktok FR" },
  { id: 199534494209, label: "Twitch FR" },
  { id: 194699050457, label: "Twitter FR (new)" },
];

console.log("=== CAMPAIGN-LEVEL price assets on [FR] Fanovera ===");
const camp = await customer.query(`
  SELECT
    campaign.id, campaign.name,
    campaign_asset.asset, campaign_asset.field_type, campaign_asset.status,
    asset.id, asset.name, asset.type,
    asset.price_asset.type, asset.price_asset.price_qualifier,
    asset.price_asset.language_code, asset.price_asset.price_offerings
  FROM campaign_asset
  WHERE campaign.id = ${FR_CAMPAIGN}
    AND campaign_asset.field_type = 'PRICE'
    AND campaign_asset.status != 'REMOVED'
`);
console.log(`Found ${camp.length}`);
for (const a of camp) {
  const p = a.asset?.price_asset;
  console.log(`\nAsset ${a.asset?.id}  type=${p?.type}  qualifier=${p?.price_qualifier}  lang=${p?.language_code}`);
  for (const o of p?.price_offerings || []) {
    const amt = o.price?.amount_micros ? (Number(o.price.amount_micros) / 1_000_000).toFixed(2) : "?";
    console.log(`  - "${o.header}" — ${amt} ${o.price?.currency_code}  → ${o.final_urls?.join(", ")}`);
    if (o.description) console.log(`    "${o.description}"`);
  }
}

for (const ag of AGS) {
  console.log(`\n=== AD-GROUP price assets on ${ag.label} (${ag.id}) ===`);
  const r = await customer.query(`
    SELECT
      ad_group.id, ad_group.name,
      ad_group_asset.asset, ad_group_asset.field_type, ad_group_asset.status,
      asset.id, asset.name, asset.type,
      asset.price_asset.type, asset.price_asset.price_qualifier,
      asset.price_asset.language_code, asset.price_asset.price_offerings
    FROM ad_group_asset
    WHERE ad_group.id = ${ag.id}
      AND ad_group_asset.field_type = 'PRICE'
      AND ad_group_asset.status != 'REMOVED'
  `);
  console.log(`Found ${r.length}`);
  for (const a of r) {
    const p = a.asset?.price_asset;
    console.log(`Asset ${a.asset?.id}`);
    for (const o of p?.price_offerings || []) {
      const amt = o.price?.amount_micros ? (Number(o.price.amount_micros) / 1_000_000).toFixed(2) : "?";
      console.log(`  - "${o.header}" — ${amt} ${o.price?.currency_code}`);
    }
  }
}

console.log("\n=== ACCOUNT-LEVEL price assets ===");
const acct = await customer.query(`
  SELECT
    customer_asset.asset, customer_asset.field_type, customer_asset.status,
    asset.id, asset.name, asset.type,
    asset.price_asset.type, asset.price_asset.price_qualifier,
    asset.price_asset.language_code, asset.price_asset.price_offerings
  FROM customer_asset
  WHERE customer_asset.field_type = 'PRICE'
    AND customer_asset.status != 'REMOVED'
`);
console.log(`Found ${acct.length}`);
for (const a of acct) {
  const p = a.asset?.price_asset;
  console.log(`\nAsset ${a.asset?.id}  type=${p?.type}  qualifier=${p?.price_qualifier}  lang=${p?.language_code}`);
  for (const o of p?.price_offerings || []) {
    const amt = o.price?.amount_micros ? (Number(o.price.amount_micros) / 1_000_000).toFixed(2) : "?";
    console.log(`  - "${o.header}" — ${amt} ${o.price?.currency_code}  → ${o.final_urls?.join(", ")}`);
    if (o.description) console.log(`    "${o.description}"`);
  }
}
