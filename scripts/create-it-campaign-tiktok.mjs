/**
 * Creates a fresh [IT] Fanovera Search campaign targeting Italy (Italian),
 * containing ONLY the Tiktok ad group. Mirrors the lean UK/ES Tiktok structure
 * adapted to Italian (keywords + negatives + whitehat RSA + sitelinks,
 * no price asset).
 *
 * Campaign is created PAUSED and the RSA is created PAUSED — enable both
 * manually after policy review (fragile-account rule).
 *
 * IMPORTANT — whitehat: RSA copy has no "comprare"/quantities/"economici".
 * Those words live only in keywords (targeting), which is allowed.
 *
 * NOTE — IT keywords are a translated mirror of the UK/ES set; no Italian
 * search-term data backs them yet. Review after a few days of delivery.
 *
 * Usage:
 *   node scripts/create-it-campaign-tiktok.mjs                 # dry-run (budget 20€)
 *   node scripts/create-it-campaign-tiktok.mjs --budget=30     # dry-run, custom budget
 *   node scripts/create-it-campaign-tiktok.mjs --live --budget=30
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
const BUDGET_EUR = budgetArg ? Number(budgetArg.split("=")[1]) : 20;
if (!Number.isFinite(BUDGET_EUR) || BUDGET_EUR < 1) { console.error("Invalid --budget value"); process.exit(1); }

const CUSTOMER_ID = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
const UK_CAMPAIGN_ID = 23844174192;              // source for CPC ceiling parity
const TARGET_GEO = "geoTargetConstants/2380";    // Italy
const TARGET_LANG = "languageConstants/1004";    // Italian
const NEW_CAMPAIGN_NAME = "[IT] Fanovera";
const FINAL_URL = "https://www.fanovera.com/promo?lang=it";

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

// ── Positive keywords (EXACT) — Italian, followers-focused
const POSITIVE_KEYWORDS = [
  "comprare follower tiktok",
  "comprare followers tiktok",
  "comprare seguaci tiktok",
  "follower tiktok comprare",
  "comprare fan tiktok",
  "comprare 1000 follower tiktok",
  "comprare 100 follower tiktok",
  "comprare 5000 follower tiktok",
  "comprare 10000 follower tiktok",
  "follower tiktok economici",
  "comprare follower tiktok economici",
  "follower tiktok reali",
  "aumentare follower tiktok",
  "pagare follower tiktok",
  "miglior sito per comprare follower tiktok",
];

// ── Negatives (BROAD) — Italian + competitor brands.
// Omits comprare / follower(s) / economici / reali to avoid blocking positives.
const BROAD_NEGATIVES = [
  // generic non-buyer intent
  "gratis", "gratuito", "gratuiti", "hack", "hackerare", "trucco", "trucchi",
  "bot", "bots", "generatore", "falsi", "falso", "scaricare", "apk", "forum",
  "reddit", "tutorial", "lavoro", "agenzia", "app", "applicazione",
  "come ottenere", "come avere", "come aumentare", "come crescere", "cos'è",
  "perché", "visualizzazioni", "like", "mi piace", "accedi", "influencer",
  "monetizzare", "verifica", "verificato", "hashtag", "hashtags",
  // tiktok product / non-service intent
  "tiktok ads", "tiktok shop", "tiktok studio", "tiktok pro", "tiktok business",
  "tiktok live", "monete tiktok", "scaricare tiktok", "creator tiktok", "zefoy",
  // instagram cross-contamination
  "comprare instagram", "instagram ads", "instagram business",
  // competitor brands
  "famoid", "viralyft", "topfollow", "twicsy", "buzzoid", "stormlike", "leofame",
  "famety", "socialdoper", "sitefame", "getinsta", "mrinsta", "mr insta",
  "buyfollowers", "fire like", "followersgram", "socialfame", "fastagram",
  "followersup", "runpost", "viralrace", "skweezer", "goread", "anotherfollower",
  "toolzu", "insfollowup", "instamama", "instamoda", "plixi", "upleap",
];

// ── EXACT negatives — tracker/counter junk
const EXACT_NEGATIVES = [
  "contatore follower tiktok",
  "conteggio follower tiktok",
  "follower tiktok in diretta",
];

// ── RSA (Italian, whitehat — no comprare/quantities/economici)
const RSA = {
  final_urls: [FINAL_URL],
  headlines: [
    { text: "Risultati in 2 Minuti" },
    { text: "+8.000 Clienti Soddisfatti" },
    { text: "Fai Crescere il Tuo TikTok" },
    { text: "Prezzo Più Basso" },
    { text: "Avvio Immediato" },
    { text: "-5% con il Codice FANO5" },
    { text: "Fanovera - TikTok" },
    { text: "Consegna Rapida e Sicura" },
  ],
  descriptions: [
    { text: "Più di 8.000 clienti. Crescita naturale e progressiva, senza password, pagamento sicuro." },
    { text: "Fai crescere il tuo pubblico su TikTok. Sicuro, veloce e affidabile. Garanzia 30 giorni." },
    { text: "Promuovi il tuo TikTok con fiducia. Codice FANO5 per un 5% sul primo ordine." },
    { text: "Aumenta la tua portata su TikTok. Pagamento sicuro, senza password, risultati rapidi." },
  ],
};
for (const h of RSA.headlines) if (h.text.length > 30) { console.error(`Headline too long (${h.text.length}): "${h.text}"`); process.exit(1); }
for (const d of RSA.descriptions) if (d.text.length > 90) { console.error(`Description too long (${d.text.length}): "${d.text}"`); process.exit(1); }

// ── Sitelinks (Italian)
const SITELINKS = [
  { link_text: "Recensioni dei Clienti", final_urls: ["https://www.fanovera.com/promo?lang=it#proof"] },
  { link_text: "Come Funziona", final_urls: ["https://www.fanovera.com/promo?lang=it#how"] },
  { link_text: "Contattaci", final_urls: ["https://www.fanovera.com/contact"] },
  { link_text: "Traccia il Tuo Ordine", final_urls: ["https://www.fanovera.com/track"] },
  { link_text: "Domande Frequenti", final_urls: ["https://www.fanovera.com/#faq"] },
];
for (const s of SITELINKS) if (s.link_text.length > 25) { console.error(`Sitelink text too long (${s.link_text.length}): "${s.link_text}"`); process.exit(1); }

// ── Conflict guard: no BROAD negative may suppress a positive
const positiveWordSets = POSITIVE_KEYWORDS.map((k) => new Set(k.split(/\s+/)));
for (const neg of BROAD_NEGATIVES) {
  const negWords = neg.split(/\s+/);
  for (let i = 0; i < POSITIVE_KEYWORDS.length; i++) {
    if (negWords.every((w) => positiveWordSets[i].has(w))) {
      console.error(`✗ CONFLICT: BROAD negative "${neg}" would block positive "${POSITIVE_KEYWORDS[i]}"`);
      process.exit(1);
    }
  }
}

const ALL_NEGATIVES = [
  ...BROAD_NEGATIVES.map((text) => ({ text, match_type: enums.KeywordMatchType.BROAD })),
  ...EXACT_NEGATIVES.map((text) => ({ text, match_type: enums.KeywordMatchType.EXACT })),
];

// ── Read CPC ceiling from UK campaign for bidding parity
console.log(`Reading CPC ceiling from [UK] Fanovera (${UK_CAMPAIGN_ID})…`);
const ukRows = await customer.query(`
  SELECT campaign.target_spend.cpc_bid_ceiling_micros
  FROM campaign WHERE campaign.id = ${UK_CAMPAIGN_ID}
`);
const cpcCeilingMicros = Number(ukRows[0]?.campaign?.target_spend?.cpc_bid_ceiling_micros) || 1_000_000;

// ── Preview
console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));
console.log(`\nNew campaign: ${NEW_CAMPAIGN_NAME}`);
console.log(`  Budget:    ${BUDGET_EUR} €/day`);
console.log(`  Status:    PAUSED · Bidding: MAXIMIZE_CLICKS (ceiling ${(cpcCeilingMicros / 1_000_000).toFixed(2)} €)`);
console.log(`  Geo:       Italy (2380) · presence`);
console.log(`  Language:  Italian (1004)`);
console.log(`\n[1] Ad group: "Tiktok"  ENABLED  cpc_bid=10000 micros`);
console.log(`[2] Positive keywords (EXACT): ${POSITIVE_KEYWORDS.length}`);
for (const k of POSITIVE_KEYWORDS) console.log(`    [EXACT] ${k}`);
console.log(`\n[3] Negatives: ${ALL_NEGATIVES.length} (${BROAD_NEGATIVES.length} BROAD + ${EXACT_NEGATIVES.length} EXACT)`);
console.log(`    conflict guard: PASSED (no negative blocks a positive)`);
console.log(`\n[4] RSA (PAUSED): ${RSA.headlines.length} headlines, ${RSA.descriptions.length} descriptions`);
for (const h of RSA.headlines) console.log(`    H: "${h.text}"  (${h.text.length})`);
for (const d of RSA.descriptions) console.log(`    D: "${d.text}"  (${d.text.length})`);
console.log(`\n[5] Sitelinks: ${SITELINKS.length}`);
for (const s of SITELINKS) console.log(`    "${s.link_text}" → ${s.final_urls[0]}`);
console.log(`\n[6] Price asset: none`);

if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

// ── Execute
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
  { campaign: campResource, language: { language_constant: TARGET_LANG } },
]);
console.log(`  ✓ geo + language attached`);

const agRes = await customer.adGroups.create([{
  name: "Tiktok",
  campaign: campResource,
  status: enums.AdGroupStatus.ENABLED,
  type: enums.AdGroupType.SEARCH_STANDARD,
  cpc_bid_micros: 10000,
}]);
const adGroupResource = agRes.results[0].resource_name;
const adGroupId = adGroupResource.split("/").pop();
console.log(`  ✓ ad group: ${adGroupResource}`);

const criteriaOps = [
  ...POSITIVE_KEYWORDS.map((text) => ({
    ad_group: adGroupResource,
    status: enums.AdGroupCriterionStatus.ENABLED,
    keyword: { text, match_type: enums.KeywordMatchType.EXACT },
  })),
  ...ALL_NEGATIVES.map((k) => ({
    ad_group: adGroupResource,
    status: enums.AdGroupCriterionStatus.ENABLED,
    negative: true,
    keyword: { text: k.text, match_type: k.match_type },
  })),
];
console.log(`  creating ${criteriaOps.length} criteria…`);
for (let i = 0; i < criteriaOps.length; i += 100) {
  await customer.adGroupCriteria.create(criteriaOps.slice(i, i + 100));
}
console.log(`  ✓ ${criteriaOps.length} criteria`);

await customer.adGroupAds.create([{
  ad_group: adGroupResource,
  status: enums.AdGroupAdStatus.PAUSED,
  ad: {
    final_urls: RSA.final_urls,
    responsive_search_ad: { headlines: RSA.headlines, descriptions: RSA.descriptions },
  },
}]);
console.log(`  ✓ RSA created (PAUSED)`);

const slAssetRes = await customer.assets.create(SITELINKS.map((s) => ({
  sitelink_asset: { link_text: s.link_text },
  final_urls: s.final_urls,
})));
await customer.adGroupAssets.create(slAssetRes.results.map((r) => ({
  ad_group: adGroupResource,
  asset: r.resource_name,
  field_type: enums.AssetFieldType.SITELINK,
})));
console.log(`  ✓ ${SITELINKS.length} sitelinks`);

console.log(`\n✅ DONE. [IT] Fanovera campaign ${campaignId} (PAUSED) + Tiktok AG ${adGroupId} (RSA PAUSED).`);
console.log(`Enable campaign + RSA after policy review.`);
console.log(`URL: https://ads.google.com/aw/adgroups?campaignId=${campaignId}`);
