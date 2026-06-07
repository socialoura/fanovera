/**
 * Add campaign-level negative keywords to [GLOBAL] Instagram Followers
 * (id 23920353991) to plug the three leak clusters identified in the
 * search-term analysis:
 *   1. unfollower / "who-followed" analytics intent
 *   2. free apps / bot ("nakrutka") / follower-counter tools
 *   3. off-LP multilingual buyer intent (LP is English-only)
 *
 * Negatives only RESTRICT traffic — they cannot trigger a policy strike.
 * Root-token phrase/broad negatives are used so whole families are caught,
 * not just the exact queries already seen.
 *
 * Verified: none of these block the proven converter "followers instagram".
 *
 *   node scripts/add-ig-global-negatives.mjs           # DRY RUN (plan only)
 *   node scripts/add-ig-global-negatives.mjs --apply    # write mutations
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
const CID = "23920353991";
const { GoogleAdsApi, enums } = await import("google-ads-api");
const customerId = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
const customer = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: customerId,
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});

const P = enums.KeywordMatchType.PHRASE; // 3
const B = enums.KeywordMatchType.BROAD;  // 4
const MTNAME = { [P]: "PHRASE", [B]: "BROAD" };

// (text, matchType, bucket) — text must be lowercase for negatives.
const PLANNED = [
  // 1) unfollower / "who-followed" analytics intent ---------------------------
  ["recently followed", P, "1·unfollower"],
  ["recent follow", P, "1·unfollower"],
  ["recent following", P, "1·unfollower"],
  ["recent followers", P, "1·unfollower"],
  ["see who", B, "1·unfollower"],
  ["who unfollowed", B, "1·unfollower"],
  ["unfollow", B, "1·unfollower"],
  ["follower tracker", B, "1·unfollower"],
  ["follower counter", B, "1·unfollower"],
  // 2) free apps / bots / counter tools --------------------------------------
  ["turbo followers", P, "2·free/bot"],
  ["freer services", P, "2·free/bot"],
  ["nakrutka", B, "2·free/bot"],
  ["free followers", B, "2·free/bot"],
  ["followers app", B, "2·free/bot"],
  ["ig obserwacje", P, "2·free/bot"],
  ["licznik obserwacji", P, "2·free/bot"],
  ["obserwacje", B, "2·free/bot"],
  // 3) off-LP multilingual buyer intent (LP is EN only) -----------------------
  ["comprar seguidores", P, "3·multilingual"],
  ["seguidores en instagram", P, "3·multilingual"],
  ["seguidores para instagram", P, "3·multilingual"],
  ["seguidores", B, "3·multilingual"],
];

// Pull existing negatives so we don't double-insert (API errors on dupes).
const existing = await customer.query(`
  SELECT campaign_criterion.keyword.text, campaign_criterion.keyword.match_type
  FROM campaign_criterion
  WHERE campaign.id=${CID} AND campaign_criterion.type='KEYWORD'
    AND campaign_criterion.negative=true
`);
const have = new Set(
  existing.map((r) => `${(r.campaign_criterion.keyword.text || "").toLowerCase()}|${r.campaign_criterion.keyword.match_type}`)
);

const toAdd = PLANNED.filter(([t, mt]) => !have.has(`${t}|${mt}`));
const skipped = PLANNED.filter(([t, mt]) => have.has(`${t}|${mt}`));

console.log(`Campaign ${CID} — existing negatives: ${existing.length}`);
console.log(`\nPLAN (${toAdd.length} new, ${skipped.length} already present):`);
let bucket = "";
for (const [t, mt, b] of toAdd) {
  if (b !== bucket) { console.log(`  — ${b} —`); bucket = b; }
  console.log(`    + [${MTNAME[mt]}] "${t}"`);
}
if (skipped.length) console.log(`  skipped (dup): ${skipped.map(([t]) => `"${t}"`).join(", ")}`);

if (!APPLY) { console.log(`\nDRY RUN. Re-run with --apply to write these ${toAdd.length} negatives.`); process.exit(0); }
if (toAdd.length === 0) { console.log(`\nNothing to add.`); process.exit(0); }

const ops = toAdd.map(([text, match_type]) => ({
  campaign: `customers/${customerId}/campaigns/${CID}`,
  negative: true,
  keyword: { text, match_type },
}));

const res = await customer.campaignCriteria.create(ops);
console.log(`\n✅ Created ${res.results?.length ?? ops.length} negative keywords.`);
for (const r of res.results || []) console.log(`   ${r.resource_name}`);
