/**
 * Option A: move Brand out of the generic (Maximize-Conversion-Value) campaigns
 * into a dedicated "[Brand] Fanovera" campaign with MANUAL CPC capped at €0.30,
 * so brand clicks cost cents instead of being inflated by smart bidding.
 *
 *  - Search only (no search partners, no display)
 *  - Manual CPC, ad-group/keyword bid €0.30 (hard CPC cap)
 *  - Budget €5/day (brand volume is tiny — this is a safety cap)
 *  - Targets UK + US (the EN markets where Brand existed), final URL lang=en
 *  - Brand RSA is pure whitehat (name + official site) → created ENABLED
 *  - Removes the old PAUSED Brand ad groups in [UK]/[US] generic campaigns
 *
 * Idempotent: skips campaign creation if "[Brand] Fanovera" already exists.
 *
 * Usage:
 *   node scripts/create-brand-campaign.mjs          # dry-run
 *   node scripts/create-brand-campaign.mjs --live   # execute
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

const LIVE = process.argv.includes("--live");
const CUSTOMER_ID = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");

const { GoogleAdsApi, enums, ResourceNames } = await import("google-ads-api");
const customer = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: CUSTOMER_ID,
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});

const CAMPAIGN_NAME = "[Brand] Fanovera";
const FINAL_URL = "https://www.fanovera.com/promo?lang=en";
const CPC_MICROS = 300_000;        // €0.30 max CPC
const BUDGET_MICROS = 5_000_000;   // €5/day
const GEO = { UK: 2826, US: 2840 };
const OLD_BRAND_AGS = { UK: 196984776855, US: 194167244822 }; // paused, to remove

const KEYWORDS = [
  "fanovera", "fanovera.com", "fanovera reviews", "fanovera promotion",
  "fanovera instagram", "fanovera youtube", "fanovera spotify", "fanovera tiktok",
];

const RSA = {
  headlines: [
    "Fanovera — Official Site", "Fanovera Social Growth", "Grow Your Social Media",
    "Boost Every Network", "Real, Progressive Results", "Trusted by 8,000+ Clients",
    "No Password Needed", "Instagram, TikTok & More",
  ],
  descriptions: [
    "Fanovera — boost your presence on Instagram, TikTok, YouTube & more. No password.",
    "Trusted by 8,000+ clients. Progressive, natural growth. Secure payment, fast delivery.",
    "Official Fanovera site. Choose a network and launch your campaign in minutes.",
    "Grow your social media the safe way. 30-day guarantee, support 7/7.",
  ],
};
for (const h of RSA.headlines) if (h.length > 30) { console.error(`headline too long (${h.length}): "${h}"`); process.exit(1); }
for (const d of RSA.descriptions) if (d.length > 90) { console.error(`description too long (${d.length}): "${d}"`); process.exit(1); }

const existingCamp = await customer.query(`SELECT campaign.id, campaign.name FROM campaign WHERE campaign.name = '${CAMPAIGN_NAME}' AND campaign.status != 'REMOVED'`);

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));
console.log(`\nCampaign: "${CAMPAIGN_NAME}"  ${existingCamp.length ? `already exists (${existingCamp[0].campaign.id}) — will skip creation` : "→ CREATE"}`);
console.log(`  Search only · Manual CPC · CPC cap €${(CPC_MICROS / 1e6).toFixed(2)} · budget €${(BUDGET_MICROS / 1e6).toFixed(0)}/day`);
console.log(`  Geo: ${Object.keys(GEO).join(" + ")} · final URL ${FINAL_URL}`);
console.log(`  Ad group "Brand" · ${KEYWORDS.length} EXACT keywords: ${KEYWORDS.join(" | ")}`);
console.log(`  RSA (ENABLED, whitehat): ${RSA.headlines.length} H / ${RSA.descriptions.length} D`);
console.log(`\nRemove old PAUSED Brand ad groups: ${Object.entries(OLD_BRAND_AGS).map(([k, v]) => `[${k}] ${v}`).join(", ")}`);

if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

console.log("\n" + "─".repeat(70) + "\nExecuting…");

let campaignResource;
if (existingCamp.length) {
  campaignResource = ResourceNames.campaign(CUSTOMER_ID, existingCamp[0].campaign.id);
  console.log(`· reusing campaign ${existingCamp[0].campaign.id}`);
} else {
  const BUDGET_NAME = `${CAMPAIGN_NAME} — budget`;
  const existingBudget = await customer.query(`SELECT campaign_budget.resource_name FROM campaign_budget WHERE campaign_budget.name = '${BUDGET_NAME}' AND campaign_budget.status != 'REMOVED'`);
  let budgetResource;
  if (existingBudget.length) { budgetResource = existingBudget[0].campaign_budget.resource_name; console.log(`  · reusing budget`); }
  else {
    const budgetRes = await customer.campaignBudgets.create([{
      name: BUDGET_NAME,
      amount_micros: BUDGET_MICROS,
      delivery_method: enums.BudgetDeliveryMethod.STANDARD,
      explicitly_shared: false,
    }]);
    budgetResource = budgetRes.results[0].resource_name;
    console.log(`  ✓ budget`);
  }
  const campRes = await customer.campaigns.create([{
    name: CAMPAIGN_NAME,
    advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
    status: enums.CampaignStatus.ENABLED,
    campaign_budget: budgetResource,
    contains_eu_political_advertising: enums.EuPoliticalAdvertisingStatus.DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING,
    manual_cpc: { enhanced_cpc_enabled: false },
    network_settings: {
      target_google_search: true,
      target_search_network: false,
      target_content_network: false,
      target_partner_search_network: false,
    },
  }]);
  campaignResource = campRes.results[0].resource_name;
  console.log(`  ✓ campaign ${campaignResource.split("/").pop()}`);

  await customer.campaignCriteria.create(Object.values(GEO).map((g) => ({
    campaign: campaignResource,
    location: { geo_target_constant: ResourceNames.geoTargetConstant(g) },
  })));
  console.log(`  ✓ geo targets ${Object.keys(GEO).join(", ")}`);
}

const agRes = await customer.adGroups.create([{
  name: "Brand",
  campaign: campaignResource,
  status: enums.AdGroupStatus.ENABLED,
  type: enums.AdGroupType.SEARCH_STANDARD,
  cpc_bid_micros: CPC_MICROS,
}]);
const agResource = agRes.results[0].resource_name;
console.log(`  ✓ ad group ${agResource.split("/").pop()}`);

await customer.adGroupCriteria.create(KEYWORDS.map((text) => ({
  ad_group: agResource,
  status: enums.AdGroupCriterionStatus.ENABLED,
  cpc_bid_micros: CPC_MICROS,
  keyword: { text, match_type: enums.KeywordMatchType.EXACT },
})));
console.log(`  ✓ ${KEYWORDS.length} keywords (EXACT, €0.30 cap)`);

await customer.adGroupAds.create([{
  ad_group: agResource,
  status: enums.AdGroupAdStatus.ENABLED,
  ad: {
    final_urls: [FINAL_URL],
    responsive_search_ad: {
      headlines: RSA.headlines.map((text) => ({ text })),
      descriptions: RSA.descriptions.map((text) => ({ text })),
    },
  },
}]);
console.log(`  ✓ RSA (ENABLED)`);

// Remove old paused Brand ad groups from the generic campaigns
const rms = Object.values(OLD_BRAND_AGS).map((id) => ResourceNames.adGroup(CUSTOMER_ID, id));
await customer.adGroups.remove(rms);
console.log(`  ✓ removed old Brand ad groups (${Object.keys(OLD_BRAND_AGS).join(", ")})`);

console.log(`\n✅ DONE. "${CAMPAIGN_NAME}" is live (Manual CPC €0.30, €5/day).`);
