/**
 * Continuation of create-twitter-fr-ag.mjs after the headline-too-long failure.
 * Creates only the RSA + sitelinks for the ad group already in place.
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
const AD_GROUP_ID = 194699050457;
const adGroupResource = `customers/${CUSTOMER_ID}/adGroups/${AD_GROUP_ID}`;
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

const RSA = {
  final_urls: [FINAL_URL_FR],
  headlines: [
    { text: "+8 000 Clients Satisfaits" }, // 25
    { text: "Résultats Dès 2 minutes" }, // 23
    { text: "-5% avec le Code FANO5" }, // 22
    { text: "Prix Le Plus Bas du Marché" }, // 26
    { text: "Démarrage Immédiat" }, // 18
    { text: "À partir de 5.99 €" }, // 18
    { text: "Fanovera Followers X/Twitter" }, // 28 (was 32)
    { text: "Livraison Rapide" }, // 16
  ],
  descriptions: [
    { text: "Développez votre présence sur X / Twitter, Instagram, YouTube et Tiktok. Code -5% : FANO5." },
    { text: "+8 000 clients satisfaits. Approche progressive, sans mot de passe. Commencez maintenant" },
    { text: "Service de promotion sociale professionnel, Démarrage immédiat. Essayez avec FANO5." },
    { text: "Visibilité optimisée sur tous vos réseaux sociaux. Prix imbattable, support 7j/7." },
  ],
};

// Sanity-check lengths
for (const h of RSA.headlines) {
  if (h.text.length > 30) {
    console.error(`Headline too long (${h.text.length}): "${h.text}"`);
    process.exit(1);
  }
}
for (const d of RSA.descriptions) {
  if (d.text.length > 90) {
    console.error(`Description too long (${d.text.length}): "${d.text}"`);
    process.exit(1);
  }
}

const SITELINKS = [
  { link_text: "Instagram", final_urls: ["https://www.fanovera.com/promo?utm_term=instagram"] },
  { link_text: "Spotify", final_urls: ["https://www.fanovera.com/promo?utm_term=spotify"] },
  { link_text: "Tiktok", final_urls: ["https://www.fanovera.com/promo?utm_term=tiktok"] },
  { link_text: "Youtube", final_urls: ["https://www.fanovera.com/promo?utm_term=youtube"] },
  { link_text: "FAQ", final_urls: ["https://www.fanovera.com/#faq"] },
  { link_text: "Le Fonctionnement", final_urls: ["https://www.fanovera.com/#how"] },
];

console.log(`Targeting ad group: ${adGroupResource}`);
console.log("\nCreating RSA (PAUSED)…");
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
console.log("  ✓ RSA created");

console.log("\nCreating sitelink assets…");
const assetOps = SITELINKS.map((s) => ({
  sitelink_asset: { link_text: s.link_text },
  final_urls: s.final_urls,
}));
const assetRes = await customer.assets.create(assetOps);
const assetResourceNames = assetRes.results.map((r) => r.resource_name);
console.log(`  ✓ ${assetResourceNames.length} sitelink assets created`);

console.log("Attaching sitelinks to ad group…");
const linkOps = assetResourceNames.map((rn) => ({
  ad_group: adGroupResource,
  asset: rn,
  field_type: enums.AssetFieldType.SITELINK,
}));
await customer.adGroupAssets.create(linkOps);
console.log(`  ✓ ${linkOps.length} sitelinks attached`);

console.log(`\nDone. AG ${AD_GROUP_ID} on campaign [FR] Fanovera.`);
