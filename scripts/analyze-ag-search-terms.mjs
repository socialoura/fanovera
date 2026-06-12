/**
 * Analyse search terms d'un ad group quelconque (read-only).
 * node scripts/analyze-ag-search-terms.mjs <AG_ID> [days=30] [lang=en|fr]
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

const AG_ID = process.argv[2];
const DAYS = Number(process.argv[3]) || 30;
const LANG = (process.argv[4] || "en").toLowerCase();
if (!AG_ID) { console.log("Usage: node scripts/analyze-ag-search-terms.mjs <AG_ID> [days] [lang]"); process.exit(1); }

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

const eur = (m) => Number(m) / 1_000_000;
const fmt = (n) => n.toFixed(2);
const MT = { 2: "EXACT", 3: "PHRASE", 4: "BROAD" };

const today = new Date(); const from = new Date(today); from.setDate(from.getDate() - DAYS);
const f = (d) => d.toISOString().slice(0, 10);

const agInfo = await customer.query(`SELECT ad_group.name, campaign.name FROM ad_group WHERE ad_group.id = ${AG_ID}`);
const label = agInfo.length ? `${agInfo[0].campaign.name} › ${agInfo[0].ad_group.name}` : `AG ${AG_ID}`;

// Keywords positifs
const kwRows = await customer.query(`
  SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
  FROM ad_group_criterion
  WHERE ad_group.id = ${AG_ID} AND ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.negative = FALSE AND ad_group_criterion.status != 'REMOVED'
`);
const exactKws = new Set(kwRows.filter((k) => k.ad_group_criterion.keyword.match_type === 2).map((k) => k.ad_group_criterion.keyword.text.toLowerCase()));
const allKws = new Set(kwRows.map((k) => k.ad_group_criterion.keyword.text.toLowerCase()));

console.log(`\n${"═".repeat(70)}`);
console.log(`  ${label} — search terms · ${DAYS}j (${f(from)} → ${f(today)})`);
console.log(`${"═".repeat(70)}`);
console.log(`\nKeywords positifs (${kwRows.length}):`);
for (const k of kwRows) console.log(`  [${(MT[k.ad_group_criterion.keyword.match_type] || "?").padEnd(6)}] ${k.ad_group_criterion.keyword.text}`);

const rows = await customer.query(`
  SELECT search_term_view.search_term, search_term_view.status,
         metrics.clicks, metrics.impressions, metrics.cost_micros,
         metrics.conversions, metrics.conversions_value
  FROM search_term_view
  WHERE ad_group.id = ${AG_ID} AND segments.date BETWEEN '${f(from)}' AND '${f(today)}'
  ORDER BY metrics.cost_micros DESC
`);
if (rows.length === 0) { console.log("\n  Aucune donnée de search term sur la période."); process.exit(0); }

let totClicks = 0, totImpr = 0, totCost = 0, totConv = 0, totVal = 0;
const converters = [], waste = [], info = [];

for (const r of rows) {
  const m = r.metrics, st = r.search_term_view;
  const cost = eur(m.cost_micros), conv = Number(m.conversions), clicks = Number(m.clicks);
  totClicks += clicks; totImpr += Number(m.impressions); totCost += cost; totConv += conv; totVal += Number(m.conversions_value);
  const o = {
    term: st.search_term, cost, conv, clicks,
    alreadyExact: exactKws.has(st.search_term.toLowerCase()),
    isPositiveKw: allKws.has(st.search_term.toLowerCase()),
    alreadyExcluded: st.status === 3 || st.status === 5,
  };
  if (conv > 0) converters.push(o);
  else if (cost >= 1.0) waste.push(o);
  else if (cost >= 0.20) info.push(o);
}

console.log(`\n${"─".repeat(70)}\n  RÉSUMÉ — ${rows.length} termes`);
console.log(`  ${totClicks} clics · ${fmt(totCost)}€ · ${fmt(totConv)} conv · ${fmt(totVal)}€ val`);
console.log(`  CPA ${totConv > 0 ? fmt(totCost / totConv) + "€" : "—"} · ROAS ${totCost > 0 ? fmt(totVal / totCost) + "x" : "—"}`);

console.log(`\n${"─".repeat(70)}\n  ✅ CONVERTERS (${converters.length}):`);
for (const o of converters) {
  const flag = o.alreadyExact ? " [déjà EXACT]" : o.alreadyExcluded ? " [EXCLU !]" : " → ADD EXACT";
  console.log(`  ${fmt(o.cost).padStart(6)}€  ${fmt(o.conv)}conv  CPA ${fmt(o.cost / o.conv)}€  "${o.term}"${flag}`);
}

// Intent grouping (EN + FR)
const groups = { free: [], info: [], cleanup: [], competitors: [], other: [] };
const freeRe = LANG === "fr" ? /grat(uit|is)/i : /\bfree\b|gratis/i;
const infoRe = LANG === "fr" ? /comment|c'est quoi|pourquoi|tuto|guide/i : /how to|how do|what is|why|tutorial|guide|meaning/i;
const cleanupRe = LANG === "fr" ? /repér|reper|détect|detect|supprim|enlev|reconna|nettoy/i : /detect|remove|delete|spot|find fake|check fake|audit|see who|track|cleaner|cleanup|ghost/i;
const compRe = /buzzoid|growthoid|famoid|twicsy|stormlikes|mediamister|bulkfollows|views4you|smm/i;

for (const o of waste) {
  let g = "other";
  if (freeRe.test(o.term)) g = "free";
  else if (infoRe.test(o.term)) g = "info";
  else if (cleanupRe.test(o.term)) g = "cleanup";
  else if (compRe.test(o.term)) g = "competitors";
  groups[g].push(o);
}

console.log(`\n${"─".repeat(70)}\n  💸 WASTE ≥1€, 0 conv (${waste.length}) — groupé par intention:`);
for (const [g, items] of Object.entries(groups)) {
  if (!items.length) continue;
  console.log(`\n  [${g.toUpperCase()}] (${items.length})`);
  for (const o of items) {
    const pk = o.isPositiveKw ? " [KW POSITIF]" : "";
    const ex = o.alreadyExcluded ? " [déjà exclu]" : "";
    console.log(`    ${fmt(o.cost).padStart(6)}€  ${String(o.clicks).padStart(2)}clk  "${o.term}"${pk}${ex}`);
  }
}

console.log(`\n${"─".repeat(70)}\n  ⚠️  INFO 0.20-1€, 0 conv (${info.length}):`);
for (const o of info) console.log(`    ${fmt(o.cost).padStart(5)}€  ${String(o.clicks).padStart(2)}clk  "${o.term}"${o.isPositiveKw ? " [KW POSITIF]" : ""}`);

const newNegs = waste.filter((o) => !o.alreadyExcluded && !o.isPositiveKw);
console.log(`\n${"═".repeat(70)}\n  Candidats négatifs (waste hors KW positifs): ${newNegs.length}`);
for (const o of newNegs) console.log(`    "${o.term}" (${fmt(o.cost)}€)`);
