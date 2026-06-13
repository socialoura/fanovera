/**
 * Replaces the broad negative "views" on [UK] TikTok AG with targeted negatives
 * so "buy tiktok views" phrase can pass while junk stays blocked.
 *
 * Steps:
 *   1) Remove broad negative "views" from the ad group
 *   2) Add targeted negatives: "free views", "story views", "reels views",
 *      "views count", "views tracker"
 *
 * Usage:
 *   node scripts/swap-views-neg-uk-tiktok.mjs          # dry-run
 *   node scripts/swap-views-neg-uk-tiktok.mjs --live   # execute
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
const UK_CAMPAIGN_ID = 23844174192;
const TIKTOK_AG_NAME = "Tiktok";

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

const REPLACEMENTS = [
  "free views",
  "story views",
  "reels views",
  "views count",
  "views tracker",
];

// Find the TikTok AG
const agRows = await customer.query(`SELECT ad_group.id FROM ad_group WHERE campaign.id=${UK_CAMPAIGN_ID} AND ad_group.name='${TIKTOK_AG_NAME}' AND ad_group.status!='REMOVED'`);
if (!agRows.length) { console.error(`AG "${TIKTOK_AG_NAME}" not found.`); process.exit(1); }
const agId = agRows[0].ad_group.id;

// Find the broad negative "views"
const negRows = await customer.query(`SELECT ad_group_criterion.resource_name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type FROM ad_group_criterion WHERE ad_group.id=${agId} AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.negative=TRUE AND ad_group_criterion.status!='REMOVED'`);
const viewsNeg = negRows.find((r) => r.ad_group_criterion.keyword.text.toLowerCase() === "views" && r.ad_group_criterion.keyword.match_type === 4);

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));
console.log(`Campaign: [UK] Fanovera (${UK_CAMPAIGN_ID})`);
console.log(`Ad group: ${TIKTOK_AG_NAME} (${agId})`);

if (!viewsNeg) {
  console.log(`\n⚠ Broad negative "views" NOT FOUND on this ad group. Nothing to swap.`);
  process.exit(0);
}

console.log(`\n1) REMOVE: [BROAD] "views" (${viewsNeg.ad_group_criterion.resource_name})`);
console.log(`\n2) ADD targeted negatives (BROAD):`);
for (const r of REPLACEMENTS) console.log(`   + [BROAD] "${r}"`);

// Check which replacements already exist
const existingNegs = new Set(negRows.map((r) => r.ad_group_criterion.keyword.text.toLowerCase()));
const toAdd = REPLACEMENTS.filter((r) => !existingNegs.has(r.toLowerCase()));
const alreadyExist = REPLACEMENTS.filter((r) => existingNegs.has(r.toLowerCase()));
if (alreadyExist.length) console.log(`\n   Already present (skip): ${alreadyExist.join(", ")}`);

if (!LIVE) {
  console.log(`\nDry-run. Will remove 1 neg + add ${toAdd.length} targeted negs. Re-run with --live.`);
  process.exit(0);
}

// Execute: remove "views" broad
await customer.adGroupCriteria.remove([viewsNeg.ad_group_criterion.resource_name]);
console.log(`\n✅ Removed broad negative "views".`);

// Execute: add replacements
if (toAdd.length) {
  const agResource = `customers/${CUSTOMER_ID}/adGroups/${agId}`;
  await customer.adGroupCriteria.create(toAdd.map((text) => ({
    ad_group: agResource,
    negative: true,
    keyword: { text, match_type: enums.KeywordMatchType.BROAD },
  })));
  console.log(`✅ Added ${toAdd.length} targeted negatives: ${toAdd.join(", ")}`);
}

console.log(`\nDone. "buy tiktok views" is now unblocked. Run add-phrase-uk-tiktok-likes-views.mjs --live next.`);
