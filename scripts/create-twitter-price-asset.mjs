/**
 * Creates a PRICE asset specific to the Twitter FR ad group with the 3 packs
 * (100, 500, 1000) and attaches it at ad-group level. This overrides the
 * campaign-level PRICE asset (which shows Instagram prices) for this AG only.
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

// micros: 1 EUR = 1_000_000 micros
const eurToMicros = (eur) => Math.round(eur * 1_000_000);

const OFFERINGS = [
  { header: "Pack de 100", description: "Le Moins Cher du Marché", amount_eur: 3.5, final_url: "https://www.fanovera.com/promo?lang=fr" },
  { header: "Pack de 500", description: "Le Moins Cher du Marché", amount_eur: 17.99, final_url: "https://www.fanovera.com/promo?lang=fr" },
  { header: "Pack de 1000", description: "Le Moins Cher du Marché", amount_eur: 34.99, final_url: "https://www.fanovera.com/promo?lang=fr" },
];

// Sanity-check
for (const o of OFFERINGS) {
  if (o.header.length > 25) {
    console.error(`Header too long (${o.header.length}): "${o.header}"`);
    process.exit(1);
  }
  if (o.description.length > 25) {
    console.error(`Description too long (${o.description.length}): "${o.description}"`);
    process.exit(1);
  }
}

console.log("Creating PRICE asset for Twitter FR…");
console.log("Offerings:");
for (const o of OFFERINGS) {
  console.log(`  - ${o.header} — ${o.amount_eur.toFixed(2)} €  "${o.description}"`);
}

const assetRes = await customer.assets.create([{
  price_asset: {
    type: enums.PriceExtensionType.BRANDS,
    price_qualifier: enums.PriceExtensionPriceQualifier.FROM,
    language_code: "fr",
    price_offerings: OFFERINGS.map((o) => ({
      header: o.header,
      description: o.description,
      final_url: o.final_url,
      price: {
        amount_micros: eurToMicros(o.amount_eur),
        currency_code: "EUR",
      },
      unit: enums.PriceExtensionPriceUnit.UNSPECIFIED,
    })),
  },
}]);

const assetResourceName = assetRes.results[0].resource_name;
console.log(`  ✓ asset created: ${assetResourceName}`);

console.log("\nAttaching to ad group…");
await customer.adGroupAssets.create([{
  ad_group: adGroupResource,
  asset: assetResourceName,
  field_type: enums.AssetFieldType.PRICE,
}]);
console.log(`  ✓ attached to AG ${AD_GROUP_ID}`);

console.log("\nDone.");
