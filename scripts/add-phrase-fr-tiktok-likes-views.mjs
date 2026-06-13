/**
 * Adds PHRASE keywords for TikTok likes & views on [FR] Fanovera TikTok AG.
 *
 * Usage:
 *   node scripts/add-phrase-fr-tiktok-likes-views.mjs          # dry-run
 *   node scripts/add-phrase-fr-tiktok-likes-views.mjs --live   # execute
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

const PHRASE_KW = [
  "acheter likes tiktok",
  "acheter like tiktok",
  "acheter vues tiktok",
  "acheter vue tiktok",
  "acheter des likes tiktok",
  "acheter des vues tiktok",
];

const tok = (s) => s.toLowerCase().split(/\s+/).filter(Boolean);

async function getNegatives() {
  const negs = [];
  const agNeg = await customer.query(`SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type FROM ad_group_criterion WHERE ad_group.id=${AG_ID} AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.negative=TRUE AND ad_group_criterion.status!='REMOVED'`);
  for (const r of agNeg) negs.push({ t: r.ad_group_criterion.keyword.text.toLowerCase(), mt: r.ad_group_criterion.keyword.match_type });
  const campNeg = await customer.query(`SELECT campaign_criterion.keyword.text, campaign_criterion.keyword.match_type FROM campaign_criterion WHERE campaign.id=${FR_CAMPAIGN_ID} AND campaign_criterion.type='KEYWORD' AND campaign_criterion.negative=true`);
  for (const r of campNeg) negs.push({ t: r.campaign_criterion.keyword.text.toLowerCase(), mt: r.campaign_criterion.keyword.match_type });
  const sets = await customer.query(`SELECT shared_set.id FROM campaign_shared_set WHERE campaign.id=${FR_CAMPAIGN_ID} AND campaign_shared_set.status!='REMOVED'`);
  for (const s of sets) {
    const members = await customer.query(`SELECT shared_criterion.keyword.text, shared_criterion.keyword.match_type FROM shared_criterion WHERE shared_set.id=${s.shared_set.id}`);
    for (const m of members) negs.push({ t: m.shared_criterion.keyword.text.toLowerCase(), mt: m.shared_criterion.keyword.match_type });
  }
  return negs;
}

function blockedBy(keyword, negs) {
  const kWords = new Set(tok(keyword)), lk = keyword.toLowerCase(), kArr = tok(keyword);
  for (const n of negs) {
    const nWords = tok(n.t);
    if (n.mt === 2) { if (n.t === lk) return n.t; }
    else if (n.mt === 3) {
      if (nWords.length <= kArr.length) {
        for (let i = 0; i + nWords.length <= kArr.length; i++) {
          let ok = true;
          for (let j = 0; j < nWords.length; j++) if (kArr[i + j] !== nWords[j]) { ok = false; break; }
          if (ok) return n.t;
        }
      }
    } else {
      if (nWords.length > 0 && nWords.every((w) => kWords.has(w))) return n.t;
    }
  }
  return null;
}

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));
console.log(`Campaign: [FR] Fanovera (${FR_CAMPAIGN_ID})`);
console.log(`Ad group: Tiktok (${AG_ID})`);

const existing = await customer.query(`SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type FROM ad_group_criterion WHERE ad_group.id=${AG_ID} AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.negative=FALSE AND ad_group_criterion.status!='REMOVED'`);
const hasPhrase = new Set(existing.filter((r) => r.ad_group_criterion.keyword.match_type === 3).map((r) => r.ad_group_criterion.keyword.text.toLowerCase()));

const negs = await getNegatives();

const toAdd = [], notes = [];
for (const kw of PHRASE_KW) {
  const lk = kw.toLowerCase();
  if (hasPhrase.has(lk)) { notes.push(`"${kw}" (already exists)`); continue; }
  const blocker = blockedBy(kw, negs);
  if (blocker) { notes.push(`"${kw}" (⛔ blocked by neg "${blocker}")`); continue; }
  toAdd.push(kw);
}

console.log(`\nPhrase to add: ${toAdd.length}`);
for (const kw of toAdd) console.log(`  + [PHRASE] "${kw}"`);
if (notes.length) { console.log(`\nNotes:`); for (const n of notes) console.log(`  ${n}`); }

if (!LIVE) { console.log(`\nDry-run. ${toAdd.length} phrase to add. Re-run with --live to execute.`); process.exit(0); }
if (!toAdd.length) { console.log("\nNothing to add."); process.exit(0); }

const agResource = `customers/${CUSTOMER_ID}/adGroups/${AG_ID}`;
let list = [...toAdd];
const skipped = [];
for (;;) {
  if (!list.length) break;
  const ops = list.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, keyword: { text, match_type: enums.KeywordMatchType.PHRASE } }));
  try {
    await customer.adGroupCriteria.create(ops);
    console.log(`\n✅ ${list.length} phrase keywords added.`);
    break;
  } catch (err) {
    const viol = (err?.errors || []).filter((e) => e?.error_code?.policy_violation_error != null && e?.trigger?.string_value).map((e) => e.trigger.string_value);
    if (!viol.length) throw err;
    for (const vt of viol) { if (!skipped.includes(vt)) skipped.push(vt); list = list.filter((t) => t !== vt); }
    console.log(`  ⚠ policy-rejected, dropped: ${viol.join(", ")}`);
  }
}
if (skipped.length) console.log(`  (${skipped.length} phrase dropped for policy: ${skipped.join(", ")})`);

console.log(`\nDone. Monitor search terms: node scripts/analyze-tiktok-fr-search-terms.mjs`);
