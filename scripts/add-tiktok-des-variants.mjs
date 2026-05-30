/**
 * Adds the proven-converting French "des" search-term variants as EXACT
 * keywords to the FR and CH Tiktok ad groups. These showed conversions in the
 * FR search-terms report but were only matched as close variants — adding them
 * explicitly gives bid/QS control.
 *
 * Dedupes against existing positives. Dry-run by default.
 *
 * Usage:
 *   node scripts/add-tiktok-des-variants.mjs          # dry-run
 *   node scripts/add-tiktok-des-variants.mjs --live   # execute
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

// Active ad groups only (CH 202617485251 belongs to a REMOVED duplicate campaign — excluded)
const TARGETS = [
  { label: "[FR] Tiktok", agId: 195535404423 },
  { label: "[CH] Tiktok", agId: 198431611833 },
];

const NEW_KEYWORDS = [
  "acheter des followers sur tiktok",
  "acheter des followers tiktok",
  "acheter des abonnés tiktok",
];

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

console.log("\n" + "═".repeat(60));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(60));

const ops = [];
for (const t of TARGETS) {
  const existing = new Set(
    (await customer.query(`
      SELECT ad_group_criterion.keyword.text
      FROM ad_group_criterion
      WHERE ad_group.id = ${t.agId}
        AND ad_group_criterion.type = 'KEYWORD'
        AND ad_group_criterion.negative = FALSE
        AND ad_group_criterion.status != 'REMOVED'
    `)).map((r) => r.ad_group_criterion.keyword.text.toLowerCase()),
  );
  const toAdd = NEW_KEYWORDS.filter((k) => !existing.has(k.toLowerCase()));
  console.log(`\n${t.label} (AG ${t.agId}):`);
  for (const k of NEW_KEYWORDS) {
    console.log(`   ${existing.has(k.toLowerCase()) ? "skip (exists)" : "ADD [EXACT]   "}  ${k}`);
  }
  for (const text of toAdd) {
    ops.push({
      ad_group: `customers/${CUSTOMER_ID}/adGroups/${t.agId}`,
      status: enums.AdGroupCriterionStatus.ENABLED,
      keyword: { text, match_type: enums.KeywordMatchType.EXACT },
    });
  }
}

console.log(`\nTotal new criteria to create: ${ops.length}`);
if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }
if (ops.length === 0) { console.log("Nothing to add."); process.exit(0); }

await customer.adGroupCriteria.create(ops);
console.log(`\n✅ Created ${ops.length} EXACT keyword(s).`);
