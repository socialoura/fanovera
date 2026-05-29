/**
 * Clones the [UK] Fanovera campaign (23844174192) to a new [US] Fanovera
 * campaign targeting the United States. Keeps all keywords/RSA/sitelinks/
 * price assets identical — only changes geo (UK→US/2840) and creates a new
 * budget. Language stays English (1000), exclusions cloned from UK.
 *
 * Campaign + RSAs created PAUSED. Re-enable after policy review.
 *
 * Usage:
 *   node scripts/clone-uk-to-us.mjs            # dry-run
 *   node scripts/clone-uk-to-us.mjs --live     # execute
 *   node scripts/clone-uk-to-us.mjs --live --budget=70
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
const budgetArg = process.argv.find((a) => a.startsWith("--budget="));
const BUDGET_EUR = budgetArg ? Number(budgetArg.split("=")[1]) : 70;
if (!Number.isFinite(BUDGET_EUR) || BUDGET_EUR < 1) {
  console.error("Invalid --budget value"); process.exit(1);
}

const CUSTOMER_ID = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
const SOURCE_CAMPAIGN_ID = 23844174192;          // [UK] Fanovera
const TARGET_GEO = "geoTargetConstants/2840";    // United States
const TARGET_LANG = "languageConstants/1000";    // English
const NEW_CAMPAIGN_NAME = "[US] Fanovera";

const { GoogleAdsApi, enums } = await import("google-ads-api");
const customer = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: CUSTOMER_ID,
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});

// ─── 1. Read source structure ───────────────────────────────────────────────
console.log(`Reading source campaign ${SOURCE_CAMPAIGN_ID}…`);

const src = await customer.query(`
  SELECT campaign.id, campaign.name,
         campaign.target_spend.cpc_bid_ceiling_micros
  FROM campaign WHERE campaign.id = ${SOURCE_CAMPAIGN_ID}
`);
if (src.length === 0) { console.error("Source not found"); process.exit(1); }
const cpcCeilingMicros = Number(src[0].campaign?.target_spend?.cpc_bid_ceiling_micros) || 1_000_000;

const srcGeoExclusions = (await customer.query(`
  SELECT campaign_criterion.location.geo_target_constant, campaign_criterion.negative
  FROM campaign_criterion
  WHERE campaign.id = ${SOURCE_CAMPAIGN_ID}
    AND campaign_criterion.type = 'LOCATION'
    AND campaign_criterion.negative = TRUE
    AND campaign_criterion.status != 'REMOVED'
`)).map((r) => r.campaign_criterion.location.geo_target_constant);

const SKIP_AGS = new Set(["Commercial"]);
const srcAgsRaw = await customer.query(`
  SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.cpc_bid_micros, ad_group.type
  FROM ad_group
  WHERE campaign.id = ${SOURCE_CAMPAIGN_ID} AND ad_group.status != 'REMOVED'
  ORDER BY ad_group.id
`);
const srcAgs = srcAgsRaw.filter((r) => !SKIP_AGS.has(r.ad_group.name));
const skipped = srcAgsRaw.filter((r) => SKIP_AGS.has(r.ad_group.name)).map((r) => r.ad_group.name);
if (skipped.length) console.log(`  skipping: ${skipped.join(", ")}`);

const agSpecs = [];
for (const row of srcAgs) {
  const ag = row.ad_group;
  const agId = ag.id;

  const kwRows = await customer.query(`
    SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.negative
    FROM ad_group_criterion
    WHERE ad_group.id = ${agId} AND ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.status != 'REMOVED'
  `);
  const positives = kwRows.filter((r) => !r.ad_group_criterion.negative)
    .map((r) => ({ text: r.ad_group_criterion.keyword.text, match_type: r.ad_group_criterion.keyword.match_type }));
  const negatives = kwRows.filter((r) => r.ad_group_criterion.negative)
    .map((r) => ({ text: r.ad_group_criterion.keyword.text, match_type: r.ad_group_criterion.keyword.match_type }));

  const adRows = await customer.query(`
    SELECT ad_group.id,
           ad_group_ad.ad.responsive_search_ad.headlines,
           ad_group_ad.ad.responsive_search_ad.descriptions,
           ad_group_ad.ad.final_urls,
           ad_group_ad.status
    FROM ad_group_ad
    WHERE ad_group.id = ${agId} AND ad_group_ad.status != 'REMOVED'
      AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
  `);
  const rsas = adRows.map((r) => ({
    final_urls: r.ad_group_ad.ad.final_urls || [],
    headlines: (r.ad_group_ad.ad.responsive_search_ad?.headlines || []).map((h) => ({ text: h.text })),
    descriptions: (r.ad_group_ad.ad.responsive_search_ad?.descriptions || []).map((d) => ({ text: d.text })),
  }));

  const slLinks = await customer.query(`
    SELECT ad_group.id, ad_group_asset.asset, ad_group_asset.field_type
    FROM ad_group_asset
    WHERE ad_group.id = ${agId} AND ad_group_asset.field_type = 'SITELINK' AND ad_group_asset.status != 'REMOVED'
  `);
  const sitelinks = [];
  for (const r of slLinks) {
    const d = await customer.query(`
      SELECT asset.sitelink_asset.link_text, asset.final_urls
      FROM asset WHERE asset.resource_name = '${r.ad_group_asset.asset}'
    `);
    if (d[0]) sitelinks.push({ link_text: d[0].asset.sitelink_asset.link_text, final_urls: d[0].asset.final_urls || [] });
  }

  const prLinks = await customer.query(`
    SELECT ad_group.id, ad_group_asset.asset, ad_group_asset.field_type
    FROM ad_group_asset
    WHERE ad_group.id = ${agId} AND ad_group_asset.field_type = 'PRICE' AND ad_group_asset.status != 'REMOVED'
  `);
  const prices = [];
  for (const r of prLinks) {
    const d = await customer.query(`
      SELECT asset.price_asset.type, asset.price_asset.price_qualifier,
             asset.price_asset.language_code, asset.price_asset.price_offerings
      FROM asset WHERE asset.resource_name = '${r.ad_group_asset.asset}'
    `);
    const pa = d[0]?.asset?.price_asset;
    if (pa) prices.push({
      type: pa.type, price_qualifier: pa.price_qualifier, language_code: pa.language_code,
      price_offerings: (pa.price_offerings || []).map((o) => ({
        header: o.header, description: o.description, final_url: o.final_url, unit: o.unit,
        amount_micros: Number(o.price?.amount_micros) || 0,
        currency_code: o.price?.currency_code || "EUR",
      })),
    });
  }

  agSpecs.push({ id: agId, name: ag.name, cpc_bid_micros: Number(ag.cpc_bid_micros) || 10000, positives, negatives, rsas, sitelinks, prices });
}

// ─── 2. Preview ─────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));
console.log(`\nNew campaign: ${NEW_CAMPAIGN_NAME}`);
console.log(`  Budget:        ${BUDGET_EUR} €/day`);
console.log(`  Status:        PAUSED · Bidding: MAXIMIZE_CLICKS (ceiling ${(cpcCeilingMicros / 1_000_000).toFixed(2)} €)`);
console.log(`  Geo positive:  United States (2840)`);
console.log(`  Geo negative:  ${srcGeoExclusions.length} exclusions (cloned: ${srcGeoExclusions.map((g) => g.split("/").pop()).join(", ") || "—"})`);
console.log(`  Language:      English (1000)`);
console.log(`\nAd groups (${agSpecs.length}, cloned from UK):`);
for (const a of agSpecs) {
  console.log(`  • ${a.name.padEnd(12)}  ${String(a.positives.length).padStart(3)} pos · ${String(a.negatives.length).padStart(4)} neg · ${a.rsas.length} RSA · ${a.sitelinks.length} sitelinks · ${a.prices.length} price`);
}

if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

// ─── 3. Execute ─────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(70));
console.log("Executing…");

const budgetRes = await customer.campaignBudgets.create([{
  name: `${NEW_CAMPAIGN_NAME} ${Date.now()}`,
  amount_micros: BUDGET_EUR * 1_000_000,
  delivery_method: enums.BudgetDeliveryMethod.STANDARD,
  explicitly_shared: false,
}]);
const budgetResource = budgetRes.results[0].resource_name;
console.log(`  ✓ budget: ${budgetResource}`);

const campRes = await customer.campaigns.create([{
  name: NEW_CAMPAIGN_NAME,
  status: enums.CampaignStatus.PAUSED,
  advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
  campaign_budget: budgetResource,
  target_spend: { cpc_bid_ceiling_micros: cpcCeilingMicros },
  network_settings: {
    target_google_search: true, target_search_network: false,
    target_content_network: false, target_partner_search_network: false,
  },
  geo_target_type_setting: {
    positive_geo_target_type: enums.PositiveGeoTargetType.PRESENCE,
    negative_geo_target_type: enums.NegativeGeoTargetType.PRESENCE,
  },
  contains_eu_political_advertising: enums.EuPoliticalAdvertisingStatus.DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING,
}]);
const campResource = campRes.results[0].resource_name;
const campaignId = campResource.split("/").pop();
console.log(`  ✓ campaign: ${campResource}`);

await customer.campaignCriteria.create([
  { campaign: campResource, location: { geo_target_constant: TARGET_GEO } },
  ...srcGeoExclusions.map((g) => ({ campaign: campResource, location: { geo_target_constant: g }, negative: true })),
  { campaign: campResource, language: { language_constant: TARGET_LANG } },
]);
console.log(`  ✓ geo (+${srcGeoExclusions.length} exclusions) + lang attached`);

for (const a of agSpecs) {
  console.log(`\n  [${a.name}]`);
  const agRes = await customer.adGroups.create([{
    name: a.name, campaign: campResource,
    status: enums.AdGroupStatus.ENABLED, type: enums.AdGroupType.SEARCH_STANDARD,
    cpc_bid_micros: a.cpc_bid_micros,
  }]);
  const agResource = agRes.results[0].resource_name;
  console.log(`    ✓ AG ${agResource.split("/").pop()}`);

  const kwOps = [
    ...a.positives.map((k) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, keyword: { text: k.text, match_type: k.match_type } })),
    ...a.negatives.map((k) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, negative: true, keyword: { text: k.text, match_type: k.match_type } })),
  ];
  for (let i = 0; i < kwOps.length; i += 100) {
    await customer.adGroupCriteria.create(kwOps.slice(i, i + 100));
  }
  console.log(`    ✓ ${kwOps.length} criteria`);

  for (const rsa of a.rsas) {
    await customer.adGroupAds.create([{
      ad_group: agResource, status: enums.AdGroupAdStatus.PAUSED,
      ad: { final_urls: rsa.final_urls, responsive_search_ad: { headlines: rsa.headlines, descriptions: rsa.descriptions } },
    }]);
  }
  console.log(`    ✓ ${a.rsas.length} RSA (PAUSED)`);

  if (a.sitelinks.length > 0) {
    const slRes = await customer.assets.create(a.sitelinks.map((s) => ({
      sitelink_asset: { link_text: s.link_text }, final_urls: s.final_urls,
    })));
    await customer.adGroupAssets.create(slRes.results.map((r) => ({
      ad_group: agResource, asset: r.resource_name, field_type: enums.AssetFieldType.SITELINK,
    })));
    console.log(`    ✓ ${a.sitelinks.length} sitelinks`);
  }

  for (const p of a.prices) {
    const prRes = await customer.assets.create([{
      price_asset: {
        type: p.type, price_qualifier: p.price_qualifier, language_code: p.language_code,
        price_offerings: p.price_offerings.map((o) => ({
          header: o.header, description: o.description, final_url: o.final_url, unit: o.unit,
          price: { amount_micros: o.amount_micros, currency_code: o.currency_code },
        })),
      },
    }]);
    await customer.adGroupAssets.create([{
      ad_group: agResource, asset: prRes.results[0].resource_name, field_type: enums.AssetFieldType.PRICE,
    }]);
  }
  if (a.prices.length > 0) console.log(`    ✓ ${a.prices.length} price asset`);
}

console.log(`\n✅ DONE. Campaign ${campaignId} (PAUSED) cloned from UK.`);
console.log(`URL: https://ads.google.com/aw/adgroups?campaignId=${campaignId}`);
