/**
 * Creates the Twitter FR ad group (campaign [FR] Fanovera = 23844165759).
 *
 * Usage:
 *   node scripts/create-twitter-fr-ag.mjs          # dry-run: prints JSON spec
 *   node scripts/create-twitter-fr-ag.mjs --live   # actually mutates Google Ads
 *
 * What it creates (in order):
 *   1. Ad group "Twitter" (ENABLED, SEARCH_STANDARD, CPC max 0.01 EUR)
 *   2. 24 positive keywords + ~239 negatives (Instagram FR base + 12 X-specific)
 *   3. 1 RSA (8 headlines, 4 descriptions) — created PAUSED for policy review
 *   4. 6 sitelink assets + ad-group-level links
 */

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

const LIVE = process.argv.includes("--live");
const CUSTOMER_ID = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
const FR_CAMPAIGN_ID = 23844165759;
const INSTAGRAM_FR_AG_ID = 200522508910; // source for negatives
const FINAL_URL_FR = "https://www.fanovera.com/promo?lang=fr";

const { GoogleAdsApi, enums } = await import("google-ads-api");
const client = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
});
const customer = client.Customer({
  customer_id: CUSTOMER_ID,
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});

// ─── 1. Fetch Instagram FR negatives at runtime (source of truth) ──────────
console.log("Fetching Instagram FR negatives…");
const igNegRows = await customer.query(`
  SELECT ad_group_criterion.criterion_id, ad_group_criterion.negative,
         ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
  FROM ad_group_criterion
  WHERE ad_group.id = ${INSTAGRAM_FR_AG_ID}
    AND ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.negative = TRUE
    AND ad_group_criterion.status != 'REMOVED'
`);
const igNegatives = igNegRows.map((r) => ({
  text: r.ad_group_criterion.keyword.text,
  match_type: r.ad_group_criterion.keyword.match_type,
}));
console.log(`  fetched ${igNegatives.length} negatives from Instagram FR`);

// ─── 2. Spec ────────────────────────────────────────────────────────────────
const POSITIVE_KEYWORDS = [
  { text: "acheter followers twitter", match_type: enums.KeywordMatchType.PHRASE },
  { text: "acheter follower twitter", match_type: enums.KeywordMatchType.PHRASE },
  { text: "achat followers twitter", match_type: enums.KeywordMatchType.PHRASE },
  { text: "achat follower twitter", match_type: enums.KeywordMatchType.PHRASE },
  { text: "acheter abonné twitter", match_type: enums.KeywordMatchType.PHRASE },
  { text: "acheter abonnés twitter", match_type: enums.KeywordMatchType.PHRASE },
  { text: "achat abonné twitter", match_type: enums.KeywordMatchType.PHRASE },
  { text: "achat abonnés twitter", match_type: enums.KeywordMatchType.PHRASE },
  { text: "followers twitter pas cher", match_type: enums.KeywordMatchType.PHRASE },
  { text: "abonnés twitter pas cher", match_type: enums.KeywordMatchType.PHRASE },
  { text: "followers twitter acheter", match_type: enums.KeywordMatchType.PHRASE },
  { text: "abonnés twitter acheter", match_type: enums.KeywordMatchType.PHRASE },
  { text: "payer abonnés twitter", match_type: enums.KeywordMatchType.PHRASE },
  { text: "meilleur site acheter abonnés twitter", match_type: enums.KeywordMatchType.PHRASE },
  { text: "acheter followers x", match_type: enums.KeywordMatchType.PHRASE },
  { text: "acheter follower x", match_type: enums.KeywordMatchType.PHRASE },
  { text: "achat followers x", match_type: enums.KeywordMatchType.PHRASE },
  { text: "acheter abonnés x", match_type: enums.KeywordMatchType.PHRASE },
  { text: "achat abonnés x", match_type: enums.KeywordMatchType.PHRASE },
  { text: "followers x pas cher", match_type: enums.KeywordMatchType.PHRASE },
  { text: "abonnés x pas cher", match_type: enums.KeywordMatchType.PHRASE },
  { text: "acheter followers twitter français", match_type: enums.KeywordMatchType.PHRASE },
  { text: "acheter followers twitter", match_type: enums.KeywordMatchType.BROAD },
  { text: "acheter abonnés twitter", match_type: enums.KeywordMatchType.BROAD },
];

const TWITTER_SPECIFIC_NEGATIVES = [
  "twitter ads", "twitter app", "twitter blue", "x premium",
  "twitter login", "twitter business", "twitter pro",
  "créer compte twitter", "supprimer twitter", "compte twitter",
  "download twitter", "tweetdeck",
].map((text) => ({ text, match_type: enums.KeywordMatchType.BROAD }));

const ALL_NEGATIVES = [...igNegatives, ...TWITTER_SPECIFIC_NEGATIVES];

const RSA = {
  final_urls: [FINAL_URL_FR],
  headlines: [
    { text: "+8 000 Clients Satisfaits" },
    { text: "Résultats Dès 2 minutes" },
    { text: "-5% avec le Code FANO5" },
    { text: "Prix Le Plus Bas du Marché" },
    { text: "Démarrage Immédiat" },
    { text: "À partir de 5.99 €" },
    { text: "Fanovera - Followers X / Twitter" },
    { text: "Livraison Rapide" },
  ],
  descriptions: [
    { text: "Développez votre présence sur X / Twitter, Instagram, YouTube et Tiktok. Code -5% : FANO5." },
    { text: "+8 000 clients satisfaits. Approche progressive, sans mot de passe. Commencez maintenant" },
    { text: "Service de promotion sociale professionnel, Démarrage immédiat. Essayez avec FANO5." },
    { text: "Visibilité optimisée sur tous vos réseaux sociaux. Prix imbattable, support 7j/7." },
  ],
};

const SITELINKS = [
  { link_text: "Instagram", final_urls: ["https://www.fanovera.com/promo?utm_term=instagram"] },
  { link_text: "Spotify", final_urls: ["https://www.fanovera.com/promo?utm_term=spotify"] },
  { link_text: "Tiktok", final_urls: ["https://www.fanovera.com/promo?utm_term=tiktok"] },
  { link_text: "Youtube", final_urls: ["https://www.fanovera.com/promo?utm_term=youtube"] },
  { link_text: "FAQ", final_urls: ["https://www.fanovera.com/#faq"] },
  { link_text: "Le Fonctionnement", final_urls: ["https://www.fanovera.com/#how"] },
];

// ─── 3. Preview ─────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN — will mutate Google Ads" : "▶  DRY-RUN — no API mutations");
console.log("═".repeat(70));
console.log(`\nCampaign:  [FR] Fanovera (${FR_CAMPAIGN_ID})`);
console.log(`Customer:  ${CUSTOMER_ID}`);
console.log(`\n[1] Ad group: "Twitter"`);
console.log(`    type=SEARCH_STANDARD  status=ENABLED  cpc_bid=10000 micros (0.01 €)`);
console.log(`\n[2] Positive keywords: ${POSITIVE_KEYWORDS.length}`);
for (const k of POSITIVE_KEYWORDS) console.log(`    [${matchTypeName(k.match_type)}] ${k.text}`);
console.log(`\n[3] Negative keywords: ${ALL_NEGATIVES.length} (= ${igNegatives.length} from IG FR + ${TWITTER_SPECIFIC_NEGATIVES.length} X-specific)`);
console.log(`    sample: ${TWITTER_SPECIFIC_NEGATIVES.slice(0, 5).map((n) => `"${n.text}"`).join(", ")} …`);
console.log(`\n[4] RSA (status=PAUSED for policy review): ${RSA.headlines.length} headlines, ${RSA.descriptions.length} descriptions`);
console.log(`    URL: ${RSA.final_urls[0]}`);
console.log(`    Headlines:`);
for (const h of RSA.headlines) console.log(`      "${h.text}"`);
console.log(`    Descriptions:`);
for (const d of RSA.descriptions) console.log(`      "${d.text}"`);
console.log(`\n[5] Sitelinks (ad-group level): ${SITELINKS.length}`);
for (const s of SITELINKS) console.log(`    "${s.link_text}" → ${s.final_urls[0]}`);

function matchTypeName(mt) {
  return Object.keys(enums.KeywordMatchType).find((k) => enums.KeywordMatchType[k] === mt) || mt;
}

// ─── 4. Mutate (only if --live) ─────────────────────────────────────────────
if (!LIVE) {
  console.log("\n" + "─".repeat(70));
  console.log("Dry-run complete. Re-run with --live to execute.");
  process.exit(0);
}

console.log("\n" + "─".repeat(70));
console.log("Executing mutations…");

// 4a. Create ad group
const adGroupRes = await customer.adGroups.create([{
  name: "Twitter",
  campaign: `customers/${CUSTOMER_ID}/campaigns/${FR_CAMPAIGN_ID}`,
  status: enums.AdGroupStatus.ENABLED,
  type: enums.AdGroupType.SEARCH_STANDARD,
  cpc_bid_micros: 10000,
}]);
const adGroupResource = adGroupRes.results[0].resource_name;
const adGroupId = adGroupResource.split("/").pop();
console.log(`  ✓ Ad group created: ${adGroupResource}`);

// 4b. Keywords (positive + negative) — batch in chunks of 100
const criteriaOps = [
  ...POSITIVE_KEYWORDS.map((k) => ({
    ad_group: adGroupResource,
    status: enums.AdGroupCriterionStatus.ENABLED,
    keyword: { text: k.text, match_type: k.match_type },
  })),
  ...ALL_NEGATIVES.map((k) => ({
    ad_group: adGroupResource,
    status: enums.AdGroupCriterionStatus.ENABLED,
    negative: true,
    keyword: { text: k.text, match_type: k.match_type },
  })),
];
console.log(`  creating ${criteriaOps.length} criteria in batches of 100…`);
for (let i = 0; i < criteriaOps.length; i += 100) {
  const batch = criteriaOps.slice(i, i + 100);
  await customer.adGroupCriteria.create(batch);
  console.log(`    batch ${i / 100 + 1}: ${batch.length} criteria`);
}
console.log(`  ✓ ${criteriaOps.length} criteria created`);

// 4c. RSA (paused)
await customer.adGroupAds.create([{
  ad_group: adGroupResource,
  status: enums.AdGroupAdStatus.PAUSED,
  ad: {
    final_urls: RSA.final_urls,
    responsive_search_ad: {
      headlines: RSA.headlines,
      descriptions: RSA.descriptions,
    },
  },
}]);
console.log(`  ✓ RSA created (PAUSED — awaiting your activation after policy review)`);

// 4d. Sitelinks: create assets, then attach as ad_group_asset
const assetOps = SITELINKS.map((s) => ({
  sitelink_asset: { link_text: s.link_text },
  final_urls: s.final_urls,
}));
const assetRes = await customer.assets.create(assetOps);
const assetResourceNames = assetRes.results.map((r) => r.resource_name);
console.log(`  ✓ ${assetResourceNames.length} sitelink assets created`);

const linkOps = assetResourceNames.map((rn) => ({
  ad_group: adGroupResource,
  asset: rn,
  field_type: enums.AssetFieldType.SITELINK,
}));
await customer.adGroupAssets.create(linkOps);
console.log(`  ✓ ${linkOps.length} sitelinks attached to ad group`);

console.log(`\nAd group ID: ${adGroupId}`);
console.log(`URL: https://ads.google.com/aw/adgroups?ocid=&campaignId=${FR_CAMPAIGN_ID}&adGroupId=${adGroupId}`);
console.log("Done.");
