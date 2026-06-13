/**
 * Replaces the broad negative "vues" on [FR] TikTok AG with targeted negatives
 * so "acheter vues tiktok" phrase can pass while junk stays blocked.
 *
 * Usage:
 *   node scripts/swap-views-neg-fr-tiktok.mjs          # dry-run
 *   node scripts/swap-views-neg-fr-tiktok.mjs --live   # execute
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
const FR_CAMPAIGN_ID = 23844165759;
const AG_ID = 195535404423;

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

// FR equivalents — "vues" is the phrase/broad we need to swap
const TARGETS_TO_REMOVE = ["vues", "views"];
const REPLACEMENTS = [
  "vues gratuites",
  "vues story",
  "vues reels",
  "compteur vues",
  "nombre de vues",
  "free views",
  "story views",
  "reels views",
  "views count",
];

// Find negatives on the AG
const negRows = await customer.query(`SELECT ad_group_criterion.resource_name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type FROM ad_group_criterion WHERE ad_group.id=${AG_ID} AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.negative=TRUE AND ad_group_criterion.status!='REMOVED'`);

const toRemove = [];
for (const target of TARGETS_TO_REMOVE) {
  // Match both BROAD (4) and PHRASE (3) — a single-word phrase neg blocks
  // the same as a broad for any query containing that word.
  const found = negRows.find((r) => r.ad_group_criterion.keyword.text.toLowerCase() === target && (r.ad_group_criterion.keyword.match_type === 4 || r.ad_group_criterion.keyword.match_type === 3));
  if (found) toRemove.push(found);
}

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));
console.log(`Campaign: [FR] Fanovera (${FR_CAMPAIGN_ID})`);
console.log(`Ad group: Tiktok (${AG_ID})`);

if (!toRemove.length) {
  console.log(`\n⚠ No broad negative "vues" or "views" found on this ad group. Nothing to swap.`);
  process.exit(0);
}

console.log(`\n1) REMOVE broad negatives:`);
for (const r of toRemove) console.log(`   - [BROAD] "${r.ad_group_criterion.keyword.text}" (${r.ad_group_criterion.resource_name})`);

console.log(`\n2) ADD targeted negatives (BROAD):`);
const existingNegs = new Set(negRows.map((r) => r.ad_group_criterion.keyword.text.toLowerCase()));
const toAdd = REPLACEMENTS.filter((r) => !existingNegs.has(r.toLowerCase()));
const alreadyExist = REPLACEMENTS.filter((r) => existingNegs.has(r.toLowerCase()));
for (const r of toAdd) console.log(`   + [BROAD] "${r}"`);
if (alreadyExist.length) console.log(`\n   Already present (skip): ${alreadyExist.join(", ")}`);

if (!LIVE) {
  console.log(`\nDry-run. Will remove ${toRemove.length} neg(s) + add ${toAdd.length} targeted negs. Re-run with --live.`);
  process.exit(0);
}

// Execute
for (const r of toRemove) {
  await customer.adGroupCriteria.remove([r.ad_group_criterion.resource_name]);
  console.log(`\n✅ Removed broad negative "${r.ad_group_criterion.keyword.text}".`);
}

if (toAdd.length) {
  const agResource = `customers/${CUSTOMER_ID}/adGroups/${AG_ID}`;
  await customer.adGroupCriteria.create(toAdd.map((text) => ({
    ad_group: agResource,
    negative: true,
    keyword: { text, match_type: enums.KeywordMatchType.BROAD },
  })));
  console.log(`✅ Added ${toAdd.length} targeted negatives: ${toAdd.join(", ")}`);
}

console.log(`\nDone. "acheter vues tiktok" is now unblocked on FR.`);
