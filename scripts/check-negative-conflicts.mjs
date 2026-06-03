/**
 * Diagnostic: for a list of ad groups, pull positives + negatives and report
 * any negative keyword that blocks one of the ad group's own positives
 * (= the "conflicting negative keywords" situation). Read-only, no mutations.
 *
 *   node scripts/check-negative-conflicts.mjs
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

const AD_GROUPS = {
  "IG FR (negatives base)": 200522508910,
  "ES Twitter": 197117786636,
  "IT Twitter": 192257550210,
  "ES Spotify": 199753097409,
  "IT Spotify": 198525215753,
  "ES YouTube": 200863096470,
  "IT YouTube": 197785315900,
};

// crude phrase/broad match: negative blocks positive if all negative words appear in positive
function blocks(negWords, posWords) {
  return negWords.every((w) => posWords.has(w));
}

for (const [label, agId] of Object.entries(AD_GROUPS)) {
  const rows = await customer.query(`
    SELECT ad_group_criterion.negative, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
    FROM ad_group_criterion
    WHERE ad_group.id = ${agId} AND ad_group_criterion.type = 'KEYWORD'
      AND ad_group_criterion.status != 'REMOVED'
  `);
  const positives = rows.filter((r) => !r.ad_group_criterion.negative).map((r) => r.ad_group_criterion.keyword.text);
  const negatives = rows.filter((r) => r.ad_group_criterion.negative).map((r) => r.ad_group_criterion.keyword.text);
  const posSets = positives.map((p) => new Set(p.split(/\s+/)));

  const conflicts = [];
  for (const neg of negatives) {
    const nw = neg.split(/\s+/);
    const hit = positives.filter((_, i) => blocks(nw, posSets[i]));
    if (hit.length) conflicts.push({ neg, hit });
  }
  const flagged = negatives.filter((n) => /\b(vues?|musique|visualizaciones|visualizzazioni|musica)\b/i.test(n));

  console.log(`\n■ ${label} (${agId}) — ${positives.length} positives, ${negatives.length} negatives`);
  console.log(`  negatives matching vues/musique/etc: ${flagged.length ? flagged.map((n) => `"${n}"`).join(", ") : "none"}`);
  if (conflicts.length === 0) console.log(`  ✓ NO conflicts (no negative blocks an own positive)`);
  else for (const c of conflicts) console.log(`  ✗ negative "${c.neg}" blocks: ${c.hit.map((h) => `[${h}]`).join(", ")}`);
}
