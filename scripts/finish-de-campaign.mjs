/**
 * Continuation after create-de-campaign-and-ags.mjs failed on campaign creation.
 * Reuses the orphaned budget and proceeds with everything else.
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

const CUSTOMER_ID = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
const INSTAGRAM_FR_AG_ID = 200522508910;
const FINAL_URL_DE = "https://www.fanovera.com/promo?lang=de";
const ORPHANED_BUDGET = "customers/7881570874/campaignBudgets/15603271661";

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

const PLATFORMS = [
  {
    name: "Instagram", descPlatform: "Instagram", priceFrom: "0.99",
    keywords: ["instagram follower kaufen", "instagram abonnenten kaufen", "follower instagram kaufen", "abonnenten instagram kaufen", "insta follower kaufen", "ig follower kaufen", "instagram likes kaufen", "günstig instagram follower", "instagram follower günstig", "instagram abonnenten günstig", "1000 instagram follower kaufen", "100 instagram follower kaufen", "bezahlen instagram follower", "bester anbieter instagram follower", "instagram seite kaufen", "instagram reichweite kaufen"],
    specificNegatives: ["instagram ads", "instagram business", "instagram app", "instagram login"],
    priceOfferings: [{ header: "100er Paket", amount: 0.99 }, { header: "500er Paket", amount: 2.49 }, { header: "1000er Paket", amount: 3.99 }],
  },
  {
    name: "Tiktok", descPlatform: "Tiktok", priceFrom: "2.50",
    keywords: ["tiktok follower kaufen", "tiktok abonnenten kaufen", "follower tiktok kaufen", "abonnenten tiktok kaufen", "tt follower kaufen", "tiktok likes kaufen", "tiktok views kaufen", "tiktok aufrufe kaufen", "günstig tiktok follower", "tiktok follower günstig", "1000 tiktok follower kaufen", "100 tiktok follower kaufen", "bezahlen tiktok follower", "bester anbieter tiktok"],
    specificNegatives: ["tiktok ads", "tiktok app", "tiktok shop", "tiktok live", "tiktok download"],
    priceOfferings: [{ header: "100er Paket", amount: 2.50 }, { header: "500er Paket", amount: 7.99 }, { header: "1000er Paket", amount: 13.99 }],
  },
  {
    name: "Twitch", descPlatform: "Twitch", priceFrom: "3.99",
    keywords: ["twitch follower kaufen", "twitch abonnenten kaufen", "twitch viewer kaufen", "twitch zuschauer kaufen", "follower twitch kaufen", "günstig twitch follower", "twitch follower günstig", "1000 twitch follower kaufen", "100 twitch follower kaufen", "twitch live viewer kaufen", "bezahlen twitch follower", "bester anbieter twitch", "twitch kanal aufbauen kaufen", "twitch reichweite kaufen"],
    specificNegatives: ["twitch ads", "twitch app", "twitch prime", "twitch turbo", "twitch studio", "twitch chat", "streamlabs", "twitch downloader", "twitch tracker"],
    priceOfferings: [{ header: "100er Paket", amount: 3.99 }, { header: "500er Paket", amount: 9.99 }, { header: "1000er Paket", amount: 14.99 }],
  },
  {
    name: "Twitter", descPlatform: "X / Twitter", priceFrom: "3.50",
    keywords: ["twitter follower kaufen", "twitter abonnenten kaufen", "x follower kaufen", "x abonnenten kaufen", "follower twitter kaufen", "abonnenten x kaufen", "günstig twitter follower", "twitter follower günstig", "1000 twitter follower kaufen", "100 twitter follower kaufen", "bezahlen twitter follower", "bester anbieter twitter", "twitter likes kaufen", "twitter reichweite kaufen"],
    specificNegatives: ["twitter ads", "twitter app", "twitter blue", "x premium", "twitter login", "twitter business", "tweetdeck", "download twitter"],
    priceOfferings: [{ header: "100er Paket", amount: 3.50 }, { header: "500er Paket", amount: 17.99 }, { header: "1000er Paket", amount: 34.99 }],
  },
  {
    name: "Spotify", descPlatform: "Spotify", priceFrom: "3.99",
    keywords: ["spotify streams kaufen", "spotify plays kaufen", "spotify abonnenten kaufen", "spotify hörer kaufen", "spotify follower kaufen", "monatliche hörer spotify kaufen", "günstig spotify streams", "spotify streams günstig", "1000 spotify streams kaufen", "10000 spotify streams kaufen", "bezahlen spotify streams", "bester anbieter spotify", "spotify song promoten", "spotify musik promoten"],
    specificNegatives: ["spotify ads", "spotify app", "spotify premium", "spotify free", "spotify download", "spotify login", "spotify family", "spotify wrapped", "spotify for artists"],
    priceOfferings: [{ header: "1000er Paket", amount: 3.99 }, { header: "10000er Paket", amount: 18.99 }, { header: "50000er Paket", amount: 69.99 }],
  },
  {
    name: "Facebook", descPlatform: "Facebook", priceFrom: "2.50",
    keywords: ["facebook likes kaufen", "facebook gefällt mir kaufen", "fb likes kaufen", "likes facebook kaufen", "facebook seite likes kaufen", "facebook page likes", "facebook follower kaufen", "facebook abonnenten kaufen", "günstig facebook likes", "facebook likes günstig", "1000 facebook likes kaufen", "100 facebook likes kaufen", "bezahlen facebook likes", "bester anbieter facebook"],
    specificNegatives: ["facebook ads", "facebook business", "facebook login", "facebook app", "facebook marketplace", "facebook messenger", "facebook stories", "meta verified"],
    priceOfferings: [{ header: "100er Paket", amount: 2.50 }, { header: "500er Paket", amount: 7.99 }, { header: "1000er Paket", amount: 14.99 }],
  },
  {
    name: "LinkedIn", descPlatform: "LinkedIn", priceFrom: "3.99",
    keywords: ["linkedin follower kaufen", "linkedin abonnenten kaufen", "follower linkedin kaufen", "abonnenten linkedin kaufen", "linkedin profil follower kaufen", "linkedin unternehmen follower kaufen", "günstig linkedin follower", "linkedin follower günstig", "100 linkedin follower kaufen", "500 linkedin follower kaufen", "bezahlen linkedin follower", "bester anbieter linkedin", "linkedin reichweite kaufen", "linkedin connections kaufen"],
    specificNegatives: ["linkedin ads", "linkedin premium", "linkedin sales navigator", "linkedin app", "linkedin login", "linkedin learning", "linkedin recruiter", "linkedin pro"],
    priceOfferings: [{ header: "50er Paket", amount: 3.99 }, { header: "100er Paket", amount: 7.99 }, { header: "500er Paket", amount: 24.99 }],
  },
  {
    name: "YouTube", descPlatform: "YouTube", priceFrom: "4.99",
    keywords: ["youtube aufrufe kaufen", "youtube views kaufen", "youtube abonnenten kaufen", "youtube subscriber kaufen", "abonnenten youtube kaufen", "aufrufe youtube kaufen", "1000 youtube aufrufe kaufen", "10000 youtube aufrufe kaufen", "günstig youtube aufrufe", "youtube aufrufe günstig", "youtube video promoten", "youtube kanal promoten", "100 youtube abonnenten kaufen", "bezahlen youtube aufrufe", "bester anbieter youtube", "youtube reichweite kaufen"],
    specificNegatives: ["youtube ads", "youtube premium", "youtube music", "youtube kids", "youtube tv", "youtube shorts", "youtube vanced", "youtube app", "youtube login", "youtube downloader"],
    priceOfferings: [{ header: "1000er Paket", amount: 4.99 }, { header: "5000er Paket", amount: 18.99 }, { header: "10000er Paket", amount: 34.99 }],
  },
];

const DE_BASE_NEGATIVES = [
  "kostenlos", "anleitung", "gehalt", "ausbildung", "karriere", "praktikum",
  "generator", "bot", "bots", "hack", "piraterie",
  "konto erstellen", "konto löschen", "app store",
  "abmelden", "löschen", "ändern", "wie geht das", "wie funktioniert",
  "agentur", "werbung", "werbeanzeigen", "erfahrungen", "vergleich", "tipps",
];

const SITELINKS = [
  { link_text: "Instagram", final_urls: ["https://www.fanovera.com/promo?utm_term=instagram"] },
  { link_text: "YouTube", final_urls: ["https://www.fanovera.com/promo?utm_term=youtube"] },
  { link_text: "Tiktok", final_urls: ["https://www.fanovera.com/promo?utm_term=tiktok"] },
  { link_text: "X / Twitter", final_urls: ["https://www.fanovera.com/promo?utm_term=twitter"] },
  { link_text: "FAQ", final_urls: ["https://www.fanovera.com/#faq"] },
  { link_text: "Wie es funktioniert", final_urls: ["https://www.fanovera.com/#how"] },
];

function buildRsa(platform) {
  const otherPlatforms = ["Instagram", "YouTube", "Tiktok"].filter((p) => p !== platform.descPlatform).slice(0, 3);
  const platformList = [platform.descPlatform, ...otherPlatforms].slice(0, 4).join(", ").replace(/, ([^,]*)$/, " und $1");
  return {
    final_urls: [FINAL_URL_DE],
    headlines: [
      { text: "8.000+ zufriedene Kunden" },
      { text: "Ergebnisse in 2 Minuten" },
      { text: "-5% mit Code FANO5" },
      { text: "Bester Preis garantiert" },
      { text: "Sofortiger Start" },
      { text: `Ab ${platform.priceFrom} €` },
      { text: "Schnelle Lieferung" },
    ],
    descriptions: [
      { text: `Steigern Sie Ihre Präsenz auf ${platformList}. Code -5%: FANO5.` },
      { text: "8.000+ zufriedene Kunden. Sanfter Anstieg, kein Passwort nötig. Jetzt starten." },
      { text: "Professioneller Social-Media-Promotion-Service. Sofortiger Start. Mit FANO5 testen." },
      { text: "Optimale Sichtbarkeit auf allen Ihren sozialen Netzwerken. Top Preis, 7/7 Support." },
    ],
  };
}

console.log("Fetching base negatives from Instagram FR…");
const igNegRows = await customer.query(`
  SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
  FROM ad_group_criterion
  WHERE ad_group.id = ${INSTAGRAM_FR_AG_ID}
    AND ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.negative = TRUE
    AND ad_group_criterion.status != 'REMOVED'
`);
const baseNegatives = igNegRows.map((r) => ({ text: r.ad_group_criterion.keyword.text, match_type: r.ad_group_criterion.keyword.match_type }));
console.log(`  fetched ${baseNegatives.length}`);

console.log("\nReusing orphaned budget + creating campaign…");
const campRes = await customer.campaigns.create([{
  name: "[DE] Fanovera",
  status: enums.CampaignStatus.PAUSED,
  advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
  campaign_budget: ORPHANED_BUDGET,
  target_spend: { cpc_bid_ceiling_micros: 1_000_000 },
  network_settings: {
    target_google_search: true,
    target_search_network: false,
    target_content_network: false,
    target_partner_search_network: false,
  },
  contains_eu_political_advertising: enums.EuPoliticalAdvertisingStatus.DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING,
}]);
const campResource = campRes.results[0].resource_name;
const campaignId = campResource.split("/").pop();
console.log(`  ✓ campaign: ${campResource}`);

await customer.campaignCriteria.create([
  { campaign: campResource, location: { geo_target_constant: "geoTargetConstants/2276" } },
  { campaign: campResource, location: { geo_target_constant: "geoTargetConstants/2050" }, negative: true },
  { campaign: campResource, location: { geo_target_constant: "geoTargetConstants/2356" }, negative: true },
  { campaign: campResource, location: { geo_target_constant: "geoTargetConstants/2586" }, negative: true },
  { campaign: campResource, location: { geo_target_constant: "geoTargetConstants/2608" }, negative: true },
  { campaign: campResource, language: { language_constant: "languageConstants/1001" } },
]);
console.log(`  ✓ geo/lang criteria`);

for (const platform of PLATFORMS) {
  console.log(`\n  [${platform.name}]`);
  const rsa = buildRsa(platform);

  const agRes = await customer.adGroups.create([{
    name: platform.name,
    campaign: campResource,
    status: enums.AdGroupStatus.ENABLED,
    type: enums.AdGroupType.SEARCH_STANDARD,
    cpc_bid_micros: 10000,
  }]);
  const adGroupResource = agRes.results[0].resource_name;
  console.log(`    ✓ AG ${adGroupResource.split("/").pop()}`);

  const allNegs = [
    ...baseNegatives,
    ...DE_BASE_NEGATIVES.map((text) => ({ text, match_type: enums.KeywordMatchType.BROAD })),
    ...platform.specificNegatives.map((text) => ({ text, match_type: enums.KeywordMatchType.BROAD })),
  ];
  const criteriaOps = [
    ...platform.keywords.map((text) => ({
      ad_group: adGroupResource,
      status: enums.AdGroupCriterionStatus.ENABLED,
      keyword: { text, match_type: enums.KeywordMatchType.EXACT },
    })),
    ...allNegs.map((k) => ({
      ad_group: adGroupResource,
      status: enums.AdGroupCriterionStatus.ENABLED,
      negative: true,
      keyword: { text: k.text, match_type: k.match_type },
    })),
  ];
  for (let i = 0; i < criteriaOps.length; i += 100) {
    await customer.adGroupCriteria.create(criteriaOps.slice(i, i + 100));
  }
  console.log(`    ✓ ${criteriaOps.length} criteria`);

  await customer.adGroupAds.create([{
    ad_group: adGroupResource,
    status: enums.AdGroupAdStatus.PAUSED,
    ad: { final_urls: rsa.final_urls, responsive_search_ad: { headlines: rsa.headlines, descriptions: rsa.descriptions } },
  }]);
  console.log(`    ✓ RSA (PAUSED)`);

  const slRes = await customer.assets.create(SITELINKS.map((s) => ({
    sitelink_asset: { link_text: s.link_text },
    final_urls: s.final_urls,
  })));
  await customer.adGroupAssets.create(slRes.results.map((r) => ({
    ad_group: adGroupResource,
    asset: r.resource_name,
    field_type: enums.AssetFieldType.SITELINK,
  })));
  console.log(`    ✓ 6 sitelinks`);

  const priceRes = await customer.assets.create([{
    price_asset: {
      type: enums.PriceExtensionType.BRANDS,
      price_qualifier: enums.PriceExtensionPriceQualifier.FROM,
      language_code: "de",
      price_offerings: platform.priceOfferings.map((o) => ({
        header: o.header,
        description: "Bester Preis am Markt",
        final_url: FINAL_URL_DE,
        price: { amount_micros: Math.round(o.amount * 1_000_000), currency_code: "EUR" },
        unit: enums.PriceExtensionPriceUnit.UNSPECIFIED,
      })),
    },
  }]);
  await customer.adGroupAssets.create([{
    ad_group: adGroupResource,
    asset: priceRes.results[0].resource_name,
    field_type: enums.AssetFieldType.PRICE,
  }]);
  console.log(`    ✓ price asset`);
}

console.log(`\n✅ DONE. Campaign ${campaignId} with ${PLATFORMS.length} ad groups.`);
console.log(`URL: https://ads.google.com/aw/adgroups?campaignId=${campaignId}`);
