/**
 * Replace the positive keywords on the Twitter FR ad group with EXACT-match
 * versions. Google Ads doesn't allow updating match_type in place — remove +
 * re-add is the only path.
 *
 * Negatives are left as-is (BROAD is the correct match for exclusions).
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

// 1. List current positive keywords on the AG
const rows = await customer.query(`
  SELECT
    ad_group_criterion.resource_name,
    ad_group_criterion.keyword.text,
    ad_group_criterion.keyword.match_type
  FROM ad_group_criterion
  WHERE ad_group.id = ${AD_GROUP_ID}
    AND ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.negative = FALSE
    AND ad_group_criterion.status != 'REMOVED'
`);
console.log(`Found ${rows.length} positive keywords currently on the AG`);

// 2. Remove all of them
const removeOps = rows.map((r) => r.ad_group_criterion.resource_name);
if (removeOps.length > 0) {
  console.log("Removing…");
  await customer.adGroupCriteria.remove(removeOps);
  console.log(`  ✓ ${removeOps.length} criteria removed`);
}

// 3. Re-create as EXACT (deduplicated — 22 unique)
const EXACT_KEYWORDS = [
  "acheter followers twitter",
  "acheter follower twitter",
  "achat followers twitter",
  "achat follower twitter",
  "acheter abonné twitter",
  "acheter abonnés twitter",
  "achat abonné twitter",
  "achat abonnés twitter",
  "followers twitter pas cher",
  "abonnés twitter pas cher",
  "followers twitter acheter",
  "abonnés twitter acheter",
  "payer abonnés twitter",
  "meilleur site acheter abonnés twitter",
  "acheter followers x",
  "acheter follower x",
  "achat followers x",
  "acheter abonnés x",
  "achat abonnés x",
  "followers x pas cher",
  "abonnés x pas cher",
  "acheter followers twitter français",
];

console.log(`\nCreating ${EXACT_KEYWORDS.length} EXACT-match keywords…`);
await customer.adGroupCriteria.create(
  EXACT_KEYWORDS.map((text) => ({
    ad_group: adGroupResource,
    status: enums.AdGroupCriterionStatus.ENABLED,
    keyword: { text, match_type: enums.KeywordMatchType.EXACT },
  })),
);
console.log(`  ✓ ${EXACT_KEYWORDS.length} EXACT keywords created`);

// 4. Verify
const verify = await customer.query(`
  SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
  FROM ad_group_criterion
  WHERE ad_group.id = ${AD_GROUP_ID}
    AND ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.negative = FALSE
    AND ad_group_criterion.status != 'REMOVED'
`);
console.log(`\nFinal state: ${verify.length} positive keywords`);
for (const v of verify) {
  const mt = v.ad_group_criterion.keyword.match_type;
  const name = Object.keys(enums.KeywordMatchType).find((k) => enums.KeywordMatchType[k] === mt);
  console.log(`  [${name}] ${v.ad_group_criterion.keyword.text}`);
}
