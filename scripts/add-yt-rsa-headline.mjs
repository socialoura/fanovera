/**
 * Append a single headline "YouTube Views" to the [GLOBAL] YouTube Views RSA.
 * RSAs are immutable, so this clones the existing ad (verbatim) + the new
 * headline into a NEW ad, then pauses the old one.
 *
 *   node scripts/add-yt-rsa-headline.mjs          # DRY RUN (prints new ad)
 *   node scripts/add-yt-rsa-headline.mjs --apply   # create new + pause old
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
const APPLY = process.argv.includes("--apply");
const NEW_HEADLINE = "YouTube Views";
const { GoogleAdsApi, enums } = await import("google-ads-api");
const customerId = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
const customer = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID, client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: customerId,
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});
const CID = "23915914448";

// Read the existing enabled RSA in full.
const ads = await customer.query(`
  SELECT ad_group.resource_name, ad_group_ad.resource_name, ad_group_ad.status,
         ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.final_urls,
         ad_group_ad.ad.responsive_search_ad.headlines,
         ad_group_ad.ad.responsive_search_ad.descriptions,
         ad_group_ad.ad.responsive_search_ad.path1,
         ad_group_ad.ad.responsive_search_ad.path2
  FROM ad_group_ad
  WHERE campaign.id=${CID} AND ad_group_ad.ad.type='RESPONSIVE_SEARCH_AD'
    AND ad_group_ad.status != 'REMOVED'
`);
if (!ads.length) { console.log("No RSA found."); process.exit(1); }
if (ads.length > 1) console.log(`⚠️ ${ads.length} RSAs found — operating on the first enabled one.`);
const src = ads.find((a) => a.ad_group_ad.status === 2) || ads[0];
const rsa = src.ad_group_ad.ad.responsive_search_ad;

// Clone assets verbatim (preserve text + pinned_field).
const cloneAsset = (a) => {
  const o = { text: a.text };
  if (a.pinned_field && a.pinned_field !== 0 && a.pinned_field !== "UNSPECIFIED") o.pinned_field = a.pinned_field;
  return o;
};
const headlines = (rsa.headlines || []).map(cloneAsset);
if (headlines.some((h) => h.text.toLowerCase() === NEW_HEADLINE.toLowerCase())) {
  console.log(`Headline "${NEW_HEADLINE}" already present. Nothing to do.`); process.exit(0);
}
headlines.push({ text: NEW_HEADLINE }); // unpinned
const descriptions = (rsa.descriptions || []).map(cloneAsset);

const newAd = {
  final_urls: src.ad_group_ad.ad.final_urls,
  responsive_search_ad: {
    headlines, descriptions,
    ...(rsa.path1 ? { path1: rsa.path1 } : {}),
    ...(rsa.path2 ? { path2: rsa.path2 } : {}),
  },
};

console.log(`Source ad id=${src.ad_group_ad.ad.id} (status=${src.ad_group_ad.status})`);
console.log(`\nNEW ad to create (${headlines.length} headlines, ${descriptions.length} descriptions):`);
console.log(`  url: ${newAd.final_urls?.join(",")}`);
console.log(`  HEADLINES: ${headlines.map((h) => `"${h.text}"${h.pinned_field ? `[pin:${h.pinned_field}]` : ""}`).join(" | ")}`);
console.log(`  DESCRIPTIONS: ${descriptions.map((d) => `"${d.text}"`).join(" | ")}`);
console.log(`  path1=${rsa.path1 || "—"} path2=${rsa.path2 || "—"}`);

if (!APPLY) { console.log(`\nDRY RUN. Re-run with --apply to create the new ad and pause ad id=${src.ad_group_ad.ad.id}.`); process.exit(0); }

const created = await customer.adGroupAds.create([{
  ad_group: src.ad_group.resource_name,
  status: enums.AdGroupAdStatus.ENABLED,
  ad: newAd,
}]);
console.log(`\n✅ Created: ${created.results?.[0]?.resource_name}`);

await customer.adGroupAds.update([{
  resource_name: src.ad_group_ad.resource_name,
  status: enums.AdGroupAdStatus.PAUSED,
}]);
console.log(`⏸️  Paused old ad: ${src.ad_group_ad.resource_name}`);
