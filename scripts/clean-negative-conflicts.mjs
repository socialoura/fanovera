/**
 * Cleanup: removes "conflicting negative keywords" — i.e. any ad-group-level
 * negative keyword that blocks one of THAT ad group's own positive keywords.
 * Mirrors Google Ads' own conflict detection, match-type aware:
 *   EXACT  negative blocks positive  iff  normalized text is identical
 *   PHRASE negative blocks positive  iff  it appears as a contiguous word run
 *   BROAD  negative blocks positive  iff  all its tokens appear in the positive
 *
 * Scans every non-removed campaign/ad group. Only removes genuine conflicts,
 * so Instagram's legitimate "vues"/"musique" negatives (no own positive about
 * vues/musique) are left untouched.
 *
 * Usage:
 *   node scripts/clean-negative-conflicts.mjs          # dry-run: lists removals
 *   node scripts/clean-negative-conflicts.mjs --live   # execute removals
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

const MT = enums.KeywordMatchType; // EXACT=2, PHRASE=3, BROAD=4
const mtName = (v) => (typeof v === "string" ? v.toUpperCase() : (Object.keys(MT).find((k) => MT[k] === v) || String(v)));
const norm = (s) => s.toLowerCase().normalize("NFKC").replace(/\s+/g, " ").trim();
const toks = (s) => norm(s).split(" ");

function blocks(negText, negMt, posText) {
  const n = norm(negText), p = norm(posText);
  const m = mtName(negMt);
  if (m === "EXACT") return n === p;
  if (m === "PHRASE") return ` ${p} `.includes(` ${n} `);
  // BROAD
  const pset = new Set(toks(p));
  return toks(n).every((w) => pset.has(w));
}

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN — will remove conflicting negatives" : "▶  DRY-RUN — no mutations");
console.log("═".repeat(70));

const rows = await customer.query(`
  SELECT campaign.id, campaign.name, ad_group.id, ad_group.name,
         ad_group_criterion.resource_name, ad_group_criterion.negative,
         ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
  FROM ad_group_criterion
  WHERE ad_group_criterion.type = 'KEYWORD'
    AND campaign.status != 'REMOVED' AND ad_group.status != 'REMOVED'
    AND ad_group_criterion.status != 'REMOVED'
`);

// group criteria by ad group
const groups = new Map();
for (const r of rows) {
  const key = r.ad_group.id;
  if (!groups.has(key)) groups.set(key, { campaign: r.campaign.name, adGroup: r.ad_group.name, pos: [], neg: [] });
  const g = groups.get(key);
  const c = r.ad_group_criterion;
  if (c.negative) g.neg.push({ text: c.keyword.text, mt: c.keyword.match_type, rn: c.resource_name });
  else g.pos.push(c.keyword.text);
}

const toRemove = [];
let conflictCount = 0;
for (const g of [...groups.values()].sort((a, b) => (a.campaign + a.adGroup).localeCompare(b.campaign + b.adGroup))) {
  const hits = [];
  for (const n of g.neg) {
    const blocked = g.pos.filter((p) => blocks(n.text, n.mt, p));
    if (blocked.length) { hits.push({ n, blocked }); toRemove.push(n.rn); }
  }
  if (hits.length) {
    conflictCount += hits.length;
    console.log(`\n${g.campaign} › ${g.adGroup}`);
    for (const h of hits) console.log(`  ✗ remove [${mtName(h.n.mt)}] "${h.n.text}"  → unblocks: ${h.blocked.map((b) => `[${b}]`).join(", ")}`);
  }
}

console.log("\n" + "─".repeat(70));
console.log(`Found ${conflictCount} conflicting negative(s) across ${[...groups.values()].length} ad group(s).`);

if (toRemove.length === 0) { console.log("Nothing to clean. ✓"); process.exit(0); }
if (!LIVE) { console.log(`Re-run with --live to remove these ${toRemove.length} negative(s).`); process.exit(0); }

console.log(`\nRemoving ${toRemove.length} negative(s) in batches of 100…`);
for (let i = 0; i < toRemove.length; i += 100) {
  await customer.adGroupCriteria.remove(toRemove.slice(i, i + 100));
  console.log(`  batch ${i / 100 + 1}: ${Math.min(100, toRemove.length - i)} removed`);
}
console.log("\n✅ DONE. Conflicting negatives removed — affected positives can now serve.");
