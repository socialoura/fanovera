/**
 * #3 cleanup:
 *  A. REMOVE the "Commercial" catch-all ad groups (CH/FR/UK) — paused, all
 *     platforms mixed in one ad group (bad QS/relevance).
 *  B. De-duplicate Instagram + Twitch on FR & CH: each keyword that exists as
 *     BOTH exact and phrase keeps the EXACT and drops the redundant PHRASE
 *     (the whole account is EXACT-only — these phrase twins are leftovers).
 *
 * Idempotent: re-reads live state; only removes what still matches.
 *
 * Usage:
 *   node scripts/clean-commercial-and-dupes.mjs          # dry-run
 *   node scripts/clean-commercial-and-dupes.mjs --live   # execute
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

const { GoogleAdsApi } = await import("google-ads-api");
const customer = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: CUSTOMER_ID,
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});

const COMMERCIAL_CAMPS = { CH: 23882783997, FR: 23844165759, UK: 23844174192 };
const DEDUP_AGS = [
  ["FR Instagram", 200522508910], ["CH Instagram", 198431647153],
  ["FR Twitch", 199534494209], ["CH Twitch", 200677802527],
];

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));

// ── A. Commercial ad groups to remove ────────────────────────────────────────
console.log("\n[A] Commercial ad groups");
const agToRemove = [];
for (const [code, campId] of Object.entries(COMMERCIAL_CAMPS)) {
  const ag = await customer.query(`SELECT ad_group.id, ad_group.status FROM ad_group WHERE campaign.id=${campId} AND ad_group.name='Commercial' AND ad_group.status!='REMOVED'`);
  if (!ag.length) { console.log(`  [${code}] none (already gone)`); continue; }
  const id = ag[0].ad_group.id;
  const st = ag[0].ad_group.status;
  agToRemove.push({ code, rn: `customers/${CUSTOMER_ID}/adGroups/${id}`, id, st });
  console.log(`  [${code}] ${id} ${st === 2 ? "ENABLED ⚠" : "PAUSED"} → REMOVE`);
}

// ── B. Redundant PHRASE duplicates to remove ─────────────────────────────────
console.log("\n[B] Redundant PHRASE duplicates (keep EXACT)");
const critToRemove = [];
for (const [label, agId] of DEDUP_AGS) {
  const rows = await customer.query(`SELECT ad_group_criterion.resource_name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type FROM ad_group_criterion WHERE ad_group.id=${agId} AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.negative=FALSE AND ad_group_criterion.status!='REMOVED'`);
  const byText = {};
  for (const r of rows) { const c = r.ad_group_criterion; (byText[c.keyword.text.toLowerCase()] ||= []).push({ mt: c.keyword.match_type, rn: c.resource_name }); }
  const drops = [];
  for (const [text, arr] of Object.entries(byText)) {
    const hasExact = arr.some((x) => x.mt === 2);
    if (hasExact) for (const x of arr) if (x.mt === 3) { drops.push({ text, rn: x.rn }); critToRemove.push(x.rn); }
  }
  console.log(`  [${label}] ${drops.length} PHRASE to drop: ${drops.map((d) => d.text).join(" | ") || "—"}`);
}

console.log(`\nSummary: remove ${agToRemove.length} ad groups + ${critToRemove.length} phrase keywords.`);
if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

console.log("\n" + "─".repeat(70) + "\nExecuting…");
if (critToRemove.length) {
  for (let i = 0; i < critToRemove.length; i += 100) await customer.adGroupCriteria.remove(critToRemove.slice(i, i + 100));
  console.log(`  ✓ removed ${critToRemove.length} phrase keywords`);
}
if (agToRemove.length) {
  await customer.adGroups.remove(agToRemove.map((a) => a.rn));
  console.log(`  ✓ removed ${agToRemove.length} Commercial ad groups (${agToRemove.map((a) => a.code).join(", ")})`);
}
console.log("\n✅ DONE.");
