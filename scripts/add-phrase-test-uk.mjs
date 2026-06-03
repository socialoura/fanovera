/**
 * Phrase-match expansion TEST on [UK] Fanovera (the profitable campaign).
 * Adds a PHRASE version of 2 head buy-intent terms per ACTIVE product ad group,
 * keeping the EXACT keywords intact (exact wins exact queries; phrase captures
 * the long tail like "where to buy ...", "... uk", "best place to buy ...").
 *
 * Guardrails:
 *   - UK only, enabled ad groups only (Instagram/Tiktok are paused → skipped)
 *   - 2 head terms per ad group (tight footprint, easy to monitor & roll back)
 *   - skips a term blocked by an existing negative (ad-group OR shared EN list)
 *   - skips dupes; policy-rejected terms dropped & retried (no exemption)
 *
 * NOTE: campaign is on "Maximize clicks" — watch the search terms report and
 * CPA closely (run mine-search-terms.mjs in ~2-3 weeks): harvest converters as
 * EXACT, push junk to negatives. Phrase is a discovery funnel, not set-and-forget.
 *
 * Usage:
 *   node scripts/add-phrase-test-uk.mjs          # dry-run
 *   node scripts/add-phrase-test-uk.mjs --live   # execute
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

const UK = 23844174192;
// 2 head terms per ad group (must already exist as EXACT) → added as PHRASE.
const HEADS = {
  Facebook: ["buy facebook likes", "buy facebook page likes"],
  LinkedIn: ["buy linkedin followers", "buy followers linkedin"],
  Spotify: ["buy spotify streams", "buy spotify plays"],
  Twitch: ["buy twitch followers", "buy twitch viewers"],
  Twitter: ["buy twitter followers", "buy x followers"],
  Youtube: ["buy youtube subscribers", "buy yt views"],
};

const tok = (s) => s.toLowerCase().split(/\s+/).filter(Boolean);
async function negativesFor(adGroupId) {
  const agNeg = await customer.query(`SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type FROM ad_group_criterion WHERE ad_group.id=${adGroupId} AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.negative=TRUE AND ad_group_criterion.status!='REMOVED'`);
  const negs = agNeg.map((r) => ({ t: r.ad_group_criterion.keyword.text.toLowerCase(), mt: r.ad_group_criterion.keyword.match_type }));
  const sets = await customer.query(`SELECT shared_set.id FROM campaign_shared_set WHERE campaign.id=${UK} AND campaign_shared_set.status!='REMOVED'`);
  for (const s of sets) {
    const members = await customer.query(`SELECT shared_criterion.keyword.text, shared_criterion.keyword.match_type FROM shared_criterion WHERE shared_set.id=${s.shared_set.id}`);
    for (const m of members) negs.push({ t: m.shared_criterion.keyword.text.toLowerCase(), mt: m.shared_criterion.keyword.match_type });
  }
  return negs;
}
function blockedBy(keyword, negs) {
  const kw = new Set(tok(keyword)), lk = keyword.toLowerCase();
  for (const n of negs) {
    if (n.mt === 2) { if (n.t === lk) return n.t; }
    else { const nw = tok(n.t); if (nw.every((w) => kw.has(w))) return n.t; }
  }
  return null;
}

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));

const PLAN = [];
for (const [agName, heads] of Object.entries(HEADS)) {
  const ag = await customer.query(`SELECT ad_group.id, ad_group.status FROM ad_group WHERE campaign.id=${UK} AND ad_group.name='${agName}' AND ad_group.status!='REMOVED'`);
  if (!ag.length) { console.log(`  ${agName}: not found — skip`); continue; }
  if (ag[0].ad_group.status !== 2) { console.log(`  ${agName}: PAUSED — skip`); continue; }
  const agId = ag[0].ad_group.id;
  const existing = await customer.query(`SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type FROM ad_group_criterion WHERE ad_group.id=${agId} AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.negative=FALSE AND ad_group_criterion.status!='REMOVED'`);
  const hasExact = new Set(existing.filter((r) => r.ad_group_criterion.keyword.match_type === 2).map((r) => r.ad_group_criterion.keyword.text.toLowerCase()));
  const hasPhrase = new Set(existing.filter((r) => r.ad_group_criterion.keyword.match_type === 3).map((r) => r.ad_group_criterion.keyword.text.toLowerCase()));
  const negs = await negativesFor(agId);

  const toAdd = [], notes = [];
  for (const h of heads) {
    const lh = h.toLowerCase();
    if (hasPhrase.has(lh)) { notes.push(`${h} (phrase exists)`); continue; }
    if (!hasExact.has(lh)) { notes.push(`${h} (⚠ no EXACT base — skipped)`); continue; }
    const b = blockedBy(h, negs);
    if (b) { notes.push(`${h} (⛔ blocked by neg "${b}")`); continue; }
    toAdd.push(h);
  }
  PLAN.push({ agName, agId, toAdd });
  console.log(`  ${agName.padEnd(10)} +${toAdd.length} phrase${toAdd.length ? `: ${toAdd.join(" | ")}` : ""}${notes.length ? `  [${notes.join("; ")}]` : ""}`);
}

if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

async function addPhrase(agId, texts) {
  const agResource = `customers/${CUSTOMER_ID}/adGroups/${agId}`;
  let list = [...texts]; const skipped = [];
  for (;;) {
    if (!list.length) return { added: 0, skipped };
    const ops = list.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, keyword: { text, match_type: enums.KeywordMatchType.PHRASE } }));
    try { await customer.adGroupCriteria.create(ops); return { added: list.length, skipped }; }
    catch (err) {
      const viol = (err?.errors || []).filter((e) => e?.error_code?.policy_violation_error != null && e?.trigger?.string_value).map((e) => e.trigger.string_value);
      if (!viol.length) throw err;
      for (const vt of viol) { if (!skipped.includes(vt)) skipped.push(vt); list = list.filter((t) => t !== vt); }
      console.log(`     ⚠ policy-rejected, dropped: ${viol.join(", ")}`);
    }
  }
}

console.log("\n" + "─".repeat(70) + "\nExecuting…");
let total = 0;
for (const { agName, agId, toAdd } of PLAN) {
  if (!toAdd.length) continue;
  const { added, skipped } = await addPhrase(agId, toAdd);
  total += added;
  console.log(`  [UK] ${agName}: +${added} phrase${skipped.length ? ` (${skipped.length} policy-skipped)` : ""}`);
}
console.log(`\n✅ DONE. ${total} phrase keywords added on UK. Run mine-search-terms.mjs in ~2-3 weeks to harvest/negate.`);
