/**
 * Search-terms monitor for the Tiktok ad groups across the [XX] Fanovera
 * campaigns (FR/CH/ES/UK/US/IT). Read-only — pulls the search_term_view
 * report and surfaces:
 *   (a) per-market summary (clicks / cost / conv / CPA)
 *   (b) WASTE  — terms with spend but 0 conversions (→ add as negatives)
 *   (c) WINNERS — converting terms not yet an exact keyword (→ add as keywords)
 *
 * Usage:
 *   node scripts/monitor-tiktok-search-terms.mjs            # last 14 days
 *   node scripts/monitor-tiktok-search-terms.mjs --days=7
 *   node scripts/monitor-tiktok-search-terms.mjs --csv      # also dump CSVs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const daysArg = process.argv.find((a) => a.startsWith("--days="));
const DAYS = daysArg ? Math.max(1, parseInt(daysArg.split("=")[1], 10)) : 14;
const WRITE_CSV = process.argv.includes("--csv");
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

const eur = (micros) => (Number(micros) / 1_000_000);
const fmt = (n) => n.toFixed(2);
const STATUS = { 2: "ADDED", 3: "EXCLUDED", 4: "NONE", 5: "ADDED_EXCLUDED" };

// ── 1. Find the active Tiktok ad groups on [XX] Fanovera campaigns
const agRows = await customer.query(`
  SELECT campaign.id, campaign.name, ad_group.id, ad_group.name
  FROM ad_group
  WHERE ad_group.name = 'Tiktok'
    AND ad_group.status = 'ENABLED'
    AND campaign.status != 'REMOVED'
    AND campaign.name LIKE '%Fanovera%'
  ORDER BY campaign.name
`);
if (agRows.length === 0) { console.log("No active Tiktok ad groups found on Fanovera campaigns."); process.exit(0); }

console.log(`\nMonitoring ${agRows.length} Tiktok ad group(s) · last ${DAYS} days\n`);

// existing exact positive keywords per ad group (to flag winners not yet added)
const existingKw = {};
for (const r of agRows) {
  const kws = await customer.query(`
    SELECT ad_group_criterion.keyword.text
    FROM ad_group_criterion
    WHERE ad_group.id = ${r.ad_group.id}
      AND ad_group_criterion.type = 'KEYWORD'
      AND ad_group_criterion.negative = FALSE
      AND ad_group_criterion.status != 'REMOVED'
  `);
  existingKw[r.ad_group.id] = new Set(kws.map((k) => k.ad_group_criterion.keyword.text.toLowerCase()));
}

const csvRows = [["campaign", "search_term", "status", "clicks", "impr", "cost_eur", "conv", "conv_value_eur", "cpa_eur"]];

for (const ag of agRows) {
  const rows = await customer.query(`
    SELECT search_term_view.search_term, search_term_view.status,
           metrics.clicks, metrics.impressions, metrics.cost_micros,
           metrics.conversions, metrics.conversions_value
    FROM search_term_view
    WHERE ad_group.id = ${ag.ad_group.id}
      AND segments.date DURING LAST_${DAYS}_DAYS
    ORDER BY metrics.cost_micros DESC
  `);

  const name = ag.campaign.name;
  console.log("═".repeat(72));
  console.log(`${name}  (AG ${ag.ad_group.id})`);
  console.log("═".repeat(72));

  if (rows.length === 0) { console.log("  no search-term data yet (just activated or no impressions)\n"); continue; }

  let C = 0, I = 0, cost = 0, conv = 0, val = 0;
  const waste = [], winners = [];
  for (const r of rows) {
    const m = r.metrics, term = r.search_term_view.search_term;
    // NOTE: cost is in micros; conversions_value is already a plain currency amount (not micros)
    const cClicks = Number(m.clicks), cCost = eur(m.cost_micros), cConv = Number(m.conversions), cVal = Number(m.conversions_value);
    C += cClicks; I += Number(m.impressions); cost += cCost; conv += cConv; val += cVal;
    if (cCost > 0 && cConv === 0) waste.push({ term, clicks: cClicks, cost: cCost });
    if (cConv > 0 && !existingKw[ag.ad_group.id].has(term.toLowerCase())) winners.push({ term, conv: cConv, cost: cCost, cpa: cConv > 0 ? cCost / cConv : 0 });
    csvRows.push([name, term, STATUS[r.search_term_view.status] || r.search_term_view.status, cClicks, Number(m.impressions), fmt(cCost), fmt(cConv), fmt(cVal), cConv > 0 ? fmt(cCost / cConv) : ""]);
  }

  console.log(`  TOTAL: ${C} clicks · ${I} impr · ${fmt(cost)} € spent · ${fmt(conv)} conv · ${fmt(val)} € value`);
  console.log(`         CPA ${conv > 0 ? fmt(cost / conv) + " €" : "—"} · ROAS ${cost > 0 ? fmt(val / cost) + "x" : "—"}`);

  console.log(`\n  💸 WASTE — spend, 0 conversion (negatives candidates): ${waste.length}`);
  for (const w of waste.slice(0, 15)) console.log(`     ${fmt(w.cost).padStart(6)} €  ${w.clicks}clk  "${w.term}"`);
  if (waste.length > 15) console.log(`     … +${waste.length - 15} more (see CSV)`);

  console.log(`\n  ✅ WINNERS — converting, not yet a keyword (add candidates): ${winners.length}`);
  for (const w of winners.slice(0, 15)) console.log(`     ${fmt(w.conv)}conv  CPA ${fmt(w.cpa)} €  "${w.term}"`);
  console.log("");
}

if (WRITE_CSV) {
  const dir = join(__dirname, "..", "data", "tiktok-search-terms");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${new Date().toISOString().slice(0, 10)}_last${DAYS}d.csv`);
  writeFileSync(file, csvRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n"), "utf8");
  console.log(`CSV written: ${file}`);
}
