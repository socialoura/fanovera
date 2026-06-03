/**
 * #6 cleanup: remove per-ad-group negative keywords that are now REDUNDANT with
 * the campaign-level shared negative list (created in
 * create-shared-negative-lists.mjs).
 *
 * For each ad group, a negative is removed iff its text is already a member of a
 * shared set attached to the campaign. What stays = only the product-specific
 * negatives that were EXCLUDED from the shared list because they'd block another
 * ad group's positive at campaign level (e.g. "vues" in the Instagram ad group,
 * since YouTube sells "vues").
 *
 * SAFE: the shared list stores each text at its broadest match type (the list
 * was built preferring BROAD ≥ PHRASE ≥ EXACT), so shared coverage ≥ the
 * ad-group copy for any shared text → removing the copy never reduces coverage.
 * Only NEGATIVE keyword criteria are touched. Positives are never removed.
 *
 * Usage:
 *   node scripts/dedupe-adgroup-negatives.mjs          # dry-run
 *   node scripts/dedupe-adgroup-negatives.mjs --live   # execute
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
const { GoogleAdsApi } = await import("google-ads-api");
const customer = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, ""),
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});

const CAMPS = { CH: 23882783997, ES: 23899357675, FR: 23844165759, IT: 23899365073, UK: 23844174192, US: 23883852621 };

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));

const allToRemove = [];
for (const [code, campId] of Object.entries(CAMPS)) {
  // shared-list member texts attached to this campaign
  const sets = await customer.query(`SELECT shared_set.id, shared_set.name FROM campaign_shared_set WHERE campaign.id=${campId} AND campaign_shared_set.status!='REMOVED'`);
  const sharedTexts = new Set();
  for (const s of sets) {
    const members = await customer.query(`SELECT shared_criterion.keyword.text FROM shared_criterion WHERE shared_set.id=${s.shared_set.id}`);
    for (const m of members) sharedTexts.add(m.shared_criterion.keyword.text.toLowerCase());
  }
  if (!sharedTexts.size) { console.log(`\n[${code}] no shared list attached — skip`); continue; }

  console.log(`\n████ [${code}] — shared list has ${sharedTexts.size} terms ████`);
  const ags = await customer.query(`SELECT ad_group.id, ad_group.name FROM ad_group WHERE campaign.id=${campId} AND ad_group.status!='REMOVED' ORDER BY ad_group.name`);
  for (const a of ags) {
    const agId = a.ad_group.id;
    const negs = await customer.query(`
      SELECT ad_group_criterion.resource_name, ad_group_criterion.keyword.text
      FROM ad_group_criterion WHERE ad_group.id=${agId}
        AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.negative=TRUE
        AND ad_group_criterion.status!='REMOVED'`);
    const remove = [], keep = [];
    for (const n of negs) {
      const c = n.ad_group_criterion;
      if (sharedTexts.has(c.keyword.text.toLowerCase())) remove.push(c.resource_name);
      else keep.push(c.keyword.text);
    }
    allToRemove.push(...remove);
    console.log(`  ${a.ad_group.name.padEnd(11)} neg ${String(negs.length).padStart(3)} → remove ${String(remove.length).padStart(3)} redundant · keep ${keep.length}${keep.length ? `: ${keep.join(", ")}` : ""}`);
  }
}

console.log(`\nTotal redundant ad-group negatives to remove: ${allToRemove.length}`);
if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

console.log("\n" + "─".repeat(70) + "\nExecuting…");
for (let i = 0; i < allToRemove.length; i += 1000) {
  await customer.adGroupCriteria.remove(allToRemove.slice(i, i + 1000));
  console.log(`  ✓ removed ${Math.min(i + 1000, allToRemove.length)}/${allToRemove.length}`);
}
console.log("\n✅ DONE. Ad-group negatives now hold only product-specific terms; the shared lists carry the universal layer.");
