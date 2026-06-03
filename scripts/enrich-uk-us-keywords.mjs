/**
 * Enriches the thin UK/US ad groups (6-9 EXACT keywords) with the missing
 * buy-intent angles (real / cheap / get / increase / pay for / best site /
 * extra quantities / Twitch viewers+views). LinkedIn, Tiktok, Brand are already
 * rich and left untouched.
 *
 * Adds the SAME English set to [UK] and [US] (identical campaigns).
 *
 * Safety:
 *   - skips a proposed keyword already present (dupe)
 *   - skips any keyword that an EXISTING negative would block — ad-group
 *     negatives AND the attached "Fanovera Negatives — EN" shared list
 *     (BROAD/PHRASE: all negative words ⊆ keyword; EXACT: equal). Reported.
 *   - policy-rejected keywords are dropped & retried (NO exemption).
 *
 * Usage:
 *   node scripts/enrich-uk-us-keywords.mjs          # dry-run
 *   node scripts/enrich-uk-us-keywords.mjs --live   # execute
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

const CAMPS = { UK: 23844174192, US: 23883852621 };

// New buy-intent keywords to add per ad group (EXACT). Dupes/blocked filtered out.
const ADDS = {
  Instagram: [
    "buy real instagram followers", "buy active instagram followers", "buy followers instagram",
    "get instagram followers", "increase instagram followers", "grow instagram followers",
    "instagram followers cheap", "cheap instagram followers", "pay for instagram followers",
    "best site to buy instagram followers", "buy 500 instagram followers", "buy 2000 instagram followers",
    "buy real ig followers", "get ig followers",
  ],
  Facebook: [
    "buy real facebook likes", "get facebook likes", "increase facebook likes",
    "facebook likes cheap", "cheap facebook likes", "pay for facebook likes",
    "best site to buy facebook likes", "buy 100 facebook likes", "buy 500 facebook likes",
    "buy real facebook page likes", "get facebook page likes", "buy facebook page likes cheap",
  ],
  Spotify: [
    "buy real spotify streams", "get spotify streams", "increase spotify streams",
    "spotify streams cheap", "cheap spotify streams", "pay for spotify streams",
    "best site to buy spotify streams", "buy 5000 spotify streams", "buy 50000 spotify streams",
    "buy real spotify plays", "cheap spotify plays", "buy spotify monthly listeners cheap",
    "increase spotify monthly listeners",
  ],
  Twitch: [
    "buy real twitch followers", "get twitch followers", "twitch followers cheap",
    "cheap twitch followers", "best site to buy twitch followers", "buy twitch viewers",
    "buy twitch live viewers", "buy live viewers twitch", "buy twitch views",
    "increase twitch followers", "pay for twitch followers", "buy 1k twitch followers",
    "buy twitch channel followers",
  ],
  Twitter: [
    "buy real twitter followers", "get twitter followers", "twitter followers cheap",
    "cheap twitter followers", "best site to buy twitter followers", "increase twitter followers",
    "pay for twitter followers", "buy 500 twitter followers", "buy real x followers",
    "buy 100 x followers", "buy 5000 x followers", "x followers cheap",
    "buy followers x", "buy followers twitter",
  ],
  Youtube: [
    "buy youtube views", "buy real youtube views", "get youtube views",
    "youtube views cheap", "cheap youtube views", "buy 5000 youtube views",
    "buy 50000 youtube views", "buy 500000 youtube views", "buy real youtube subscribers",
    "buy 1000 youtube subscribers", "buy 100 youtube subscribers", "get youtube subscribers",
    "youtube subscribers cheap", "increase youtube subscribers", "best site to buy youtube views",
  ],
};

const MT_NAME = { 2: "EXACT", 3: "PHRASE", 4: "BROAD" };
const tok = (s) => s.toLowerCase().split(/\s+/).filter(Boolean);

// Build the negative set applying to an ad group = its own negatives + shared-list negatives.
async function negativesFor(campaignId, adGroupId) {
  const agNeg = await customer.query(`
    SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
    FROM ad_group_criterion WHERE ad_group.id=${adGroupId}
      AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.negative=TRUE
      AND ad_group_criterion.status!='REMOVED'`);
  const negs = agNeg.map((r) => ({ t: r.ad_group_criterion.keyword.text.toLowerCase(), mt: r.ad_group_criterion.keyword.match_type }));
  const sets = await customer.query(`
    SELECT shared_set.id FROM campaign_shared_set
    WHERE campaign.id=${campaignId} AND campaign_shared_set.status!='REMOVED'`);
  for (const s of sets) {
    const members = await customer.query(`
      SELECT shared_criterion.keyword.text, shared_criterion.keyword.match_type
      FROM shared_criterion WHERE shared_set.id=${s.shared_set.id}`);
    for (const m of members) negs.push({ t: m.shared_criterion.keyword.text.toLowerCase(), mt: m.shared_criterion.keyword.match_type });
  }
  return negs;
}

// Does any negative block this keyword?
function blockedBy(keyword, negs) {
  const kw = new Set(tok(keyword));
  const lk = keyword.toLowerCase();
  for (const n of negs) {
    if (n.mt === 2) { if (n.t === lk) return n; }
    else { const nw = tok(n.t); if (nw.every((w) => kw.has(w))) return n; }
  }
  return null;
}

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));

const PLAN = []; // {code, agName, agId, toAdd[]}
for (const [code, campId] of Object.entries(CAMPS)) {
  console.log(`\n████ [${code}] ████`);
  for (const [agName, proposed] of Object.entries(ADDS)) {
    const ag = await customer.query(`SELECT ad_group.id FROM ad_group WHERE campaign.id=${campId} AND ad_group.name='${agName}' AND ad_group.status!='REMOVED'`);
    if (!ag.length) { console.log(`  ${agName}: ad group not found — skip`); continue; }
    const agId = ag[0].ad_group.id;
    const existing = new Set((await customer.query(`
      SELECT ad_group_criterion.keyword.text FROM ad_group_criterion
      WHERE ad_group.id=${agId} AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.negative=FALSE
        AND ad_group_criterion.status!='REMOVED'`)).map((r) => r.ad_group_criterion.keyword.text.toLowerCase()));
    const negs = await negativesFor(campId, agId);

    const toAdd = [], dupes = [], blocked = [];
    for (const kw of proposed) {
      if (existing.has(kw.toLowerCase())) { dupes.push(kw); continue; }
      const b = blockedBy(kw, negs);
      if (b) { blocked.push(`${kw}  ⟵ ${MT_NAME[b.mt]} neg "${b.t}"`); continue; }
      toAdd.push(kw);
    }
    PLAN.push({ code, agName, agId, toAdd });
    console.log(`  ${agName} (${existing.size} existing) → +${toAdd.length} new${dupes.length ? `, ${dupes.length} dupe` : ""}${blocked.length ? `, ${blocked.length} blocked` : ""}`);
    if (toAdd.length) console.log(`     ADD: ${toAdd.join(" | ")}`);
    if (blocked.length) for (const b of blocked) console.log(`     ⛔ ${b}`);
  }
}

if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

async function addWithPolicyRetry(agId, texts) {
  const agResource = `customers/${CUSTOMER_ID}/adGroups/${agId}`;
  const skipped = [];
  let list = [...texts];
  for (;;) {
    if (!list.length) return { added: 0, skipped };
    const ops = list.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, keyword: { text, match_type: enums.KeywordMatchType.EXACT } }));
    try {
      for (let i = 0; i < ops.length; i += 100) await customer.adGroupCriteria.create(ops.slice(i, i + 100));
      return { added: list.length, skipped };
    } catch (err) {
      const viol = (err?.errors || []).filter((e) => e?.error_code?.policy_violation_error != null && e?.trigger?.string_value).map((e) => e.trigger.string_value);
      if (viol.length === 0) throw err;
      for (const vt of viol) { if (!skipped.includes(vt)) skipped.push(vt); list = list.filter((t) => t !== vt); }
      console.log(`     ⚠ policy-rejected, dropped: ${viol.join(", ")}`);
    }
  }
}

console.log("\n" + "─".repeat(70) + "\nExecuting…");
let totalAdded = 0;
for (const { code, agName, agId, toAdd } of PLAN) {
  if (!toAdd.length) continue;
  const { added, skipped } = await addWithPolicyRetry(agId, toAdd);
  totalAdded += added;
  console.log(`[${code}] ${agName}: +${added}${skipped.length ? ` (${skipped.length} policy-skipped)` : ""}`);
}
console.log(`\n✅ DONE. ${totalAdded} keywords added across UK/US.`);
