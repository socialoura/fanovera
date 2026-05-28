/**
 * Creates the LinkedIn FR ad group on campaign [FR] Fanovera with all assets.
 * No EN reference exists — built from scratch following the FR template.
 *
 * Usage:
 *   node scripts/create-linkedin-fr-ag.mjs           # dry-run
 *   node scripts/create-linkedin-fr-ag.mjs --live    # execute
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
const INSTAGRAM_FR_AG_ID = 200522508910;
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

const POSITIVE_KEYWORDS = [
  "acheter followers linkedin",
  "acheter follower linkedin",
  "achat followers linkedin",
  "achat follower linkedin",
  "acheter abonnés linkedin",
  "acheter abonné linkedin",
  "achat abonnés linkedin",
  "achat abonné linkedin",
  "acheter abonnés page linkedin",
  "acheter followers page linkedin",
  "acheter followers entreprise linkedin",
  "followers linkedin pas cher",
  "abonnés linkedin pas cher",
  "acheter 100 followers linkedin",
  "acheter 500 followers linkedin",
  "payer abonnés linkedin",
  "meilleur site followers linkedin",
  "acheter abonnés profil linkedin",
];

const LINKEDIN_SPECIFIC_NEGATIVES = [
  "linkedin ads", "linkedin premium", "linkedin sales navigator",
  "linkedin app", "linkedin login", "linkedin learning", "linkedin recruiter",
  "linkedin business", "linkedin pro", "linkedin api",
  "créer compte linkedin", "supprimer linkedin",
  "emploi linkedin", "recruteur linkedin", "offre emploi linkedin",
];

const RSA = {
  final_urls: [FINAL_URL_FR],
  headlines: [
    { text: "+8 000 Clients Satisfaits" },
    { text: "Résultats Dès 2 minutes" },
    { text: "-5% avec le Code FANO5" },
    { text: "Prix Le Plus Bas du Marché" },
    { text: "Démarrage Immédiat" },
    { text: "À partir de 3.99 €" },
    { text: "Livraison Rapide" },
  ],
  descriptions: [
    { text: "Développez votre présence sur LinkedIn, Instagram, YouTube et Tiktok. Code -5% : FANO5." },
    { text: "+8 000 clients satisfaits. Approche progressive, sans mot de passe. Commencez maintenant" },
    { text: "Service de promotion sociale professionnel, Démarrage immédiat. Essayez avec FANO5." },
    { text: "Visibilité optimisée sur tous vos réseaux sociaux. Prix imbattable, support 7j/7." },
  ],
};
for (const h of RSA.headlines) if (h.text.length > 30) { console.error(`Headline too long (${h.text.length}): "${h.text}"`); process.exit(1); }
for (const d of RSA.descriptions) if (d.text.length > 90) { console.error(`Description too long (${d.text.length}): "${d.text}"`); process.exit(1); }

const SITELINKS = [
  { link_text: "Instagram", final_urls: ["https://www.fanovera.com/promo?utm_term=instagram"] },
  { link_text: "YouTube", final_urls: ["https://www.fanovera.com/promo?utm_term=youtube"] },
  { link_text: "X / Twitter", final_urls: ["https://www.fanovera.com/promo?utm_term=twitter"] },
  { link_text: "Facebook", final_urls: ["https://www.fanovera.com/promo?utm_term=facebook"] },
  { link_text: "FAQ", final_urls: ["https://www.fanovera.com/#faq"] },
  { link_text: "Le Fonctionnement", final_urls: ["https://www.fanovera.com/#how"] },
];

const PRICE_OFFERINGS = [
  { header: "Pack de 50", description: "Le Moins Cher du Marché", amount_eur: 3.99 },
  { header: "Pack de 100", description: "Le Moins Cher du Marché", amount_eur: 7.99 },
  { header: "Pack de 500", description: "Le Moins Cher du Marché", amount_eur: 24.99 },
];
for (const o of PRICE_OFFERINGS) {
  if (o.header.length > 25) { console.error(`Price header too long: ${o.header}`); process.exit(1); }
  if (o.description.length > 25) { console.error(`Price description too long: ${o.description}`); process.exit(1); }
}

console.log("Fetching Instagram FR negatives…");
const igNegRows = await customer.query(`
  SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
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

const ALL_NEGATIVES = [
  ...igNegatives,
  ...LINKEDIN_SPECIFIC_NEGATIVES.map((text) => ({ text, match_type: enums.KeywordMatchType.BROAD })),
];

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));
console.log(`\n[1] Ad group: "LinkedIn"  ENABLED  cpc_bid=10000 micros`);
console.log(`[2] Positive keywords (EXACT): ${POSITIVE_KEYWORDS.length}`);
for (const k of POSITIVE_KEYWORDS) console.log(`    [EXACT] ${k}`);
console.log(`\n[3] Negatives: ${ALL_NEGATIVES.length} (${igNegatives.length} IG FR + ${LINKEDIN_SPECIFIC_NEGATIVES.length} LinkedIn-specific)`);
console.log(`\n[4] RSA (PAUSED): ${RSA.headlines.length} headlines, ${RSA.descriptions.length} descriptions`);
for (const h of RSA.headlines) console.log(`    H: "${h.text}"  (${h.text.length})`);
for (const d of RSA.descriptions) console.log(`    D: "${d.text}"  (${d.text.length})`);
console.log(`\n[5] Sitelinks: ${SITELINKS.length}`);
for (const s of SITELINKS) console.log(`    "${s.link_text}" → ${s.final_urls[0]}`);
console.log(`\n[6] Price asset: ${PRICE_OFFERINGS.length} offerings`);
for (const o of PRICE_OFFERINGS) console.log(`    - ${o.header} — ${o.amount_eur.toFixed(2)} €`);

if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

console.log("\nExecuting…");
const agRes = await customer.adGroups.create([{
  name: "LinkedIn",
  campaign: `customers/${CUSTOMER_ID}/campaigns/${FR_CAMPAIGN_ID}`,
  status: enums.AdGroupStatus.ENABLED,
  type: enums.AdGroupType.SEARCH_STANDARD,
  cpc_bid_micros: 10000,
}]);
const adGroupResource = agRes.results[0].resource_name;
const adGroupId = adGroupResource.split("/").pop();
console.log(`  ✓ Ad group: ${adGroupResource}`);

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

const priceAssetRes = await customer.assets.create([{
  price_asset: {
    type: enums.PriceExtensionType.BRANDS,
    price_qualifier: enums.PriceExtensionPriceQualifier.FROM,
    language_code: "fr",
    price_offerings: PRICE_OFFERINGS.map((o) => ({
      header: o.header,
      description: o.description,
      final_url: FINAL_URL_FR,
      price: { amount_micros: Math.round(o.amount_eur * 1_000_000), currency_code: "EUR" },
      unit: enums.PriceExtensionPriceUnit.UNSPECIFIED,
    })),
  },
}]);
await customer.adGroupAssets.create([{
  ad_group: adGroupResource,
  asset: priceAssetRes.results[0].resource_name,
  field_type: enums.AssetFieldType.PRICE,
}]);
console.log(`  ✓ price asset created + attached`);

console.log(`\nDone. AG ${adGroupId} on campaign [FR] Fanovera.`);
