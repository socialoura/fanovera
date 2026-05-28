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

const targets = [
  { id: 200522508910, label: "Instagram FR" },
  { id: 195535404423, label: "Tiktok FR" },
  { id: 199534494209, label: "Twitch FR" },
];

for (const t of targets) {
  console.log(`\n========== ${t.label} (${t.id}) ==========`);

  const kws = await customer.query(`
    SELECT ad_group_criterion.criterion_id, ad_group_criterion.negative,
           ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
    FROM ad_group_criterion
    WHERE ad_group.id = ${t.id} AND ad_group_criterion.type = 'KEYWORD'
      AND ad_group_criterion.status != 'REMOVED'
  `);
  const pos = kws.filter((k) => !k.ad_group_criterion.negative);
  const neg = kws.filter((k) => k.ad_group_criterion.negative);
  console.log(`\nPositive (${pos.length}):`);
  for (const k of pos) console.log(`  [${k.ad_group_criterion.keyword.match_type}] ${k.ad_group_criterion.keyword.text}`);
  console.log(`\nNegative (${neg.length}):`);
  for (const k of neg) console.log(`  [${k.ad_group_criterion.keyword.match_type}] ${k.ad_group_criterion.keyword.text}`);

  const ads = await customer.query(`
    SELECT ad_group_ad.ad.id, ad_group_ad.status,
           ad_group_ad.ad.final_urls,
           ad_group_ad.ad.responsive_search_ad.headlines,
           ad_group_ad.ad.responsive_search_ad.descriptions
    FROM ad_group_ad
    WHERE ad_group.id = ${t.id} AND ad_group_ad.status != 'REMOVED'
  `);
  for (const a of ads) {
    const ad = a.ad_group_ad.ad;
    console.log(`\nAd ${ad.id} → ${(ad.final_urls || []).join(", ")}`);
    console.log("  Headlines:");
    for (const h of ad.responsive_search_ad?.headlines || []) {
      console.log(`    "${h.text}"${h.pinned_field ? `  [PIN ${h.pinned_field}]` : ""}`);
    }
    console.log("  Descriptions:");
    for (const d of ad.responsive_search_ad?.descriptions || []) {
      console.log(`    "${d.text}"${d.pinned_field ? `  [PIN ${d.pinned_field}]` : ""}`);
    }
  }
}
