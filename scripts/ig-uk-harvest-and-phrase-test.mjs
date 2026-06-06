/**
 * [UK] Instagram ad group — harvest + protect + phrase test, in one shot.
 *
 * IG [UK] is ENABLED, 100% EXACT, ~3.3x ROAS / 2.97€ CPA but volume-starved
 * (~500 imp/mo) and has ZERO negatives. This script:
 *
 *   1. HARVEST  → add converting search terms as EXACT, re-enable a paused winner
 *   2. PROTECT  → add the exact junk negative + a base of non-buyer negatives
 *                 (must land BEFORE phrase, or phrase pulls free/how-to/app junk)
 *   3. PHRASE   → add 2 head terms as PHRASE to discover the long tail
 *                 (exact stays intact: exact wins exact queries, phrase catches the rest)
 *
 * Guardrails:
 *   - dedupes against existing criteria (won't re-add)
 *   - conflict guard: aborts if any negative would block an existing positive
 *   - policy-rejected positives/phrases are dropped & retried (NO exemption)
 *
 * After ~2-3 weeks: run mine-search-terms.mjs, harvest new converters as EXACT,
 * push spenders to negatives.
 *
 * Usage:
 *   node scripts/ig-uk-harvest-and-phrase-test.mjs          # dry-run
 *   node scripts/ig-uk-harvest-and-phrase-test.mjs --live   # execute
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
const MT = { 2: "EXACT", 3: "PHRASE", 4: "BROAD" };
const E = enums.KeywordMatchType;

// ── 1. HARVEST: converting search terms not yet keywords (add as EXACT) ──────
const HARVEST_EXACT = [
  "instagram follower seller",   // 2 conv
  "ig followers buy",            // 1 conv
  "real ig followers buy",       // 1 conv
];
const REENABLE = ["get instagram followers"]; // paused but converted → turn back on

// ── 2. PROTECT: negatives (junk that spent w/ 0 conv + non-buyer base) ───────
const NEG_EXACT = ["buy instagram follows"];                 // 5.16€, 0 conv
const NEG_BROAD = ["free", "hack", "hacker", "generator", "app", "apk", "bot", "bots"];
const NEG_PHRASE = ["how to", "for free", "no survey"];

// ── 3. PHRASE TEST: 2 proven head converters (exact stays) ───────────────────
const PHRASE = ["buy instagram followers", "buy ig followers"];

const tok = (s) => s.toLowerCase().split(/\s+/).filter(Boolean);

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN — [UK] Instagram" : "▶  DRY-RUN — [UK] Instagram");
console.log("═".repeat(70));

// Resolve ad group
const agRows = await customer.query(`SELECT ad_group.id, ad_group.status FROM ad_group WHERE campaign.id=${UK} AND ad_group.name='Instagram' AND ad_group.status!='REMOVED'`);
if (!agRows.length) { console.log("Instagram ad group not found on UK — abort"); process.exit(1); }
const agId = agRows[0].ad_group.id;
const agResource = `customers/${CUSTOMER_ID}/adGroups/${agId}`;
console.log(`Ad group ${agId} (status ${agRows[0].ad_group.status === 2 ? "ENABLED" : agRows[0].ad_group.status})`);

// Existing criteria
const crit = await customer.query(`SELECT ad_group_criterion.criterion_id, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, ad_group_criterion.negative FROM ad_group_criterion WHERE ad_group.id=${agId} AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.status!='REMOVED'`);
const pos = crit.filter((c) => !c.ad_group_criterion.negative);
const neg = crit.filter((c) => c.ad_group_criterion.negative);
const posKey = new Set(pos.map((c) => `${c.ad_group_criterion.keyword.text.toLowerCase()}|${c.ad_group_criterion.keyword.match_type}`));
const negKey = new Set(neg.map((c) => `${c.ad_group_criterion.keyword.text.toLowerCase()}|${c.ad_group_criterion.keyword.match_type}`));
const posTexts = pos.map((c) => ({ text: c.ad_group_criterion.keyword.text.toLowerCase(), mt: c.ad_group_criterion.keyword.match_type }));

// Conflict guard: would a new negative block an existing positive?
function negBlocksPositive(text, mt) {
  const t = text.toLowerCase();
  for (const p of posTexts) {
    if (mt === E.EXACT && p.text === t) return p.text;
    if (mt === E.PHRASE && p.text.includes(t)) return p.text;
    if (mt === E.BROAD) { const nw = tok(t); if (nw.every((w) => p.text.split(/\s+/).includes(w))) return p.text; }
  }
  return null;
}
const conflicts = [];
for (const [list, mt] of [[NEG_EXACT, E.EXACT], [NEG_BROAD, E.BROAD], [NEG_PHRASE, E.PHRASE]]) {
  for (const t of list) { const hit = negBlocksPositive(t, mt); if (hit) conflicts.push(`neg "${t}" (${MT[mt]}) would block positive "${hit}"`); }
}
if (conflicts.length) { console.log("\n⛔ CONFLICT — aborting, fix the lists:"); conflicts.forEach((c) => console.log("   " + c)); process.exit(1); }

// Build plans (dedupe)
const addExact = HARVEST_EXACT.filter((t) => !posKey.has(`${t.toLowerCase()}|${E.EXACT}`));
const addPhrase = PHRASE.filter((t) => !posKey.has(`${t.toLowerCase()}|${E.PHRASE}`));
const addNeg = [];
for (const t of NEG_EXACT) if (!negKey.has(`${t.toLowerCase()}|${E.EXACT}`)) addNeg.push({ text: t, match_type: E.EXACT });
for (const t of NEG_BROAD) if (!negKey.has(`${t.toLowerCase()}|${E.BROAD}`)) addNeg.push({ text: t, match_type: E.BROAD });
for (const t of NEG_PHRASE) if (!negKey.has(`${t.toLowerCase()}|${E.PHRASE}`)) addNeg.push({ text: t, match_type: E.PHRASE });
const reenable = pos.filter((c) => REENABLE.includes(c.ad_group_criterion.keyword.text.toLowerCase()) && c.ad_group_criterion.status === 3);

console.log(`\n1. HARVEST exact (+${addExact.length}): ${addExact.join(" | ") || "—"}`);
console.log(`   Re-enable (+${reenable.length}): ${reenable.map((c) => c.ad_group_criterion.keyword.text).join(" | ") || "—"}`);
console.log(`2. NEGATIVES (+${addNeg.length}): ${addNeg.map((n) => `${n.text}[${MT[n.match_type]}]`).join(" | ") || "—"}`);
console.log(`3. PHRASE (+${addPhrase.length}): ${addPhrase.join(" | ") || "—"}`);

if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

// ── execute ──────────────────────────────────────────────────────────────────
async function createPositives(texts, match_type, label) {
  let list = [...texts]; const skipped = [];
  for (;;) {
    if (!list.length) break;
    const ops = list.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, keyword: { text, match_type } }));
    try { await customer.adGroupCriteria.create(ops); break; }
    catch (err) {
      const viol = (err?.errors || []).filter((e) => e?.error_code?.policy_violation_error != null && e?.trigger?.string_value).map((e) => e.trigger.string_value);
      if (!viol.length) throw err;
      for (const vt of viol) { if (!skipped.includes(vt)) skipped.push(vt); list = list.filter((t) => t !== vt); }
      console.log(`   ⚠ policy-rejected, dropped: ${viol.join(", ")}`);
    }
  }
  console.log(`   ✅ ${label}: +${texts.length - skipped.length}${skipped.length ? ` (${skipped.length} policy-skipped)` : ""}`);
}

console.log("\n" + "─".repeat(70) + "\nExecuting…");

if (addExact.length) await createPositives(addExact, E.EXACT, "harvest exact");

if (reenable.length) {
  await customer.adGroupCriteria.update(reenable.map((c) => ({
    resource_name: `customers/${CUSTOMER_ID}/adGroupCriteria/${agId}~${c.ad_group_criterion.criterion_id}`,
    status: enums.AdGroupCriterionStatus.ENABLED,
  })));
  console.log(`   ✅ re-enabled: ${reenable.map((c) => c.ad_group_criterion.keyword.text).join(", ")}`);
}

if (addNeg.length) {
  await customer.adGroupCriteria.create(addNeg.map((n) => ({
    ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, negative: true,
    keyword: { text: n.text, match_type: n.match_type },
  })));
  console.log(`   ✅ negatives: +${addNeg.length}`);
}

if (addPhrase.length) await createPositives(addPhrase, E.PHRASE, "phrase test");

console.log(`\n✅ DONE. Run mine-search-terms.mjs in ~2-3 weeks to harvest/negate the phrase tail.`);
