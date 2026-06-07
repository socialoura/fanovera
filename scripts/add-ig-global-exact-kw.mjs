/**
 * Promote the proven converter "followers instagram" to EXACT match in the
 * [GLOBAL] Instagram Followers campaign's "Instagram" ad group (200310409874).
 *
 * The phrase keyword is kept; exact wins the auction for the precise query
 * with tighter control + better Quality Score. No cpc_bid is set — the
 * campaign runs Maximize Clicks (TARGET_SPEND), so per-keyword bids are
 * managed automatically.
 *
 *   node scripts/add-ig-global-exact-kw.mjs           # DRY RUN
 *   node scripts/add-ig-global-exact-kw.mjs --apply    # write
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
const CID = "23920353991";
const AG = "200310409874";
const TEXT = "followers instagram";
const EXACT = enums.KeywordMatchType.EXACT;

// Guard: skip if an EXACT of this text already exists in the ad group.
const dup = await customer.query(`
  SELECT ad_group_criterion.criterion_id
  FROM ad_group_criterion
  WHERE ad_group.id=${AG} AND ad_group_criterion.type='KEYWORD'
    AND ad_group_criterion.keyword.match_type='EXACT'
    AND ad_group_criterion.keyword.text='${TEXT}'
`);
if (dup.length) { console.log(`EXACT "${TEXT}" already exists (critId=${dup[0].ad_group_criterion.criterion_id}). Nothing to do.`); process.exit(0); }

console.log(`PLAN: add ad-group criterion`);
console.log(`  ad_group=${AG}  [EXACT] "${TEXT}"  status=ENABLED  cpc_bid=inherit (Maximize Clicks)`);
if (!APPLY) { console.log(`\nDRY RUN. Re-run with --apply.`); process.exit(0); }

const res = await customer.adGroupCriteria.create([{
  ad_group: `customers/${customerId}/adGroups/${AG}`,
  status: enums.AdGroupCriterionStatus.ENABLED,
  keyword: { text: TEXT, match_type: EXACT },
}]);
console.log(`\n✅ Created: ${res.results?.[0]?.resource_name}`);
