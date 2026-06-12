/**
 * Analyse complète des search terms — Tiktok FR (AG 195535404423)
 * node scripts/analyze-tiktok-fr-search-terms.mjs [days=30]
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

const DAYS = Number(process.argv[2]) || 30;
const AG_ID = 195535404423n;

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
const STATUS_LABEL = { 2: "ADDED", 3: "EXCLUDED", 4: "NONE", 5: "ADDED_EXCLUDED" };

// 1. Keywords positifs déjà en place
const kwRows = await customer.query(`
  SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
  FROM ad_group_criterion
  WHERE ad_group.id = ${AG_ID}
    AND ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.negative = FALSE
    AND ad_group_criterion.status != 'REMOVED'
`);
const exactKws = new Set(
  kwRows
    .filter((k) => k.ad_group_criterion.keyword.match_type === 2)
    .map((k) => k.ad_group_criterion.keyword.text.toLowerCase()),
);
const allKws = new Set(kwRows.map((k) => k.ad_group_criterion.keyword.text.toLowerCase()));

console.log(`\n${"═".repeat(70)}`);
console.log(`  TIKTOK FR — Analyse search terms · derniers ${DAYS} jours`);
console.log(`${"═".repeat(70)}`);
console.log(`\nKeywords positifs actuels : ${kwRows.length}`);
for (const k of kwRows) {
  const mt = MT[k.ad_group_criterion.keyword.match_type] || "?";
  console.log(`  [${mt.padEnd(6)}] ${k.ad_group_criterion.keyword.text}`);
}

// 2. Search terms
const rows = await customer.query(`
  SELECT search_term_view.search_term, search_term_view.status,
         segments.keyword.info.text, segments.keyword.info.match_type,
         metrics.clicks, metrics.impressions, metrics.cost_micros,
         metrics.conversions, metrics.conversions_value
  FROM search_term_view
  WHERE ad_group.id = ${AG_ID}
    AND segments.date DURING LAST_${DAYS}_DAYS
  ORDER BY metrics.cost_micros DESC
`);

if (rows.length === 0) {
  console.log("\n  Aucune donnée de search term sur la période.");
  process.exit(0);
}

// 3. Catégorisation
let totClicks = 0, totImpr = 0, totCost = 0, totConv = 0, totVal = 0;
const converters = [], waste = [], info = [], cheap = [];

for (const r of rows) {
  const m = r.metrics;
  const term = r.search_term_view.search_term;
  const cost = eur(m.cost_micros);
  const conv = Number(m.conversions);
  const clicks = Number(m.clicks);
  const impr = Number(m.impressions);
  const val = Number(m.conversions_value);
  const status = r.search_term_view.status;
  const trigKw = r.segments?.keyword?.info?.text || "";
  const trigMt = MT[r.segments?.keyword?.info?.match_type] || "?";
  const alreadyExact = exactKws.has(term.toLowerCase());
  const alreadyExcluded = status === 3 || status === 5;

  totClicks += clicks; totImpr += impr; totCost += cost; totConv += conv; totVal += val;

  const isPositiveKw = allKws.has(term.toLowerCase());
  const o = { term, cost, conv, clicks, impr, val, trigKw, trigMt, alreadyExact, alreadyExcluded, isPositiveKw, status };

  if (conv > 0) {
    converters.push(o);
  } else if (cost >= 1.0) {
    waste.push(o);
  } else if (cost >= 0.20) {
    info.push(o);
  } else {
    cheap.push(o);
  }
}

// 4. Résumé global
console.log(`\n${"─".repeat(70)}`);
console.log(`  RÉSUMÉ GLOBAL`);
console.log(`${"─".repeat(70)}`);
console.log(`  Termes uniques   : ${rows.length}`);
console.log(`  Clics            : ${totClicks}`);
console.log(`  Impressions      : ${totImpr}`);
console.log(`  Dépense          : ${fmt(totCost)} €`);
console.log(`  Conversions      : ${fmt(totConv)}`);
console.log(`  Valeur           : ${fmt(totVal)} €`);
console.log(`  CPA              : ${totConv > 0 ? fmt(totCost / totConv) + " €" : "—"}`);
console.log(`  ROAS             : ${totCost > 0 ? fmt(totVal / totCost) + "x" : "—"}`);

// 5. CONVERTERS — à ajouter en exact si pas déjà fait
console.log(`\n${"─".repeat(70)}`);
console.log(`  ✅ CONVERTERS — ${converters.length} termes convertissants`);
console.log(`${"─".repeat(70)}`);
for (const o of converters) {
  const flag = o.alreadyExact ? " [déjà EXACT]" : o.alreadyExcluded ? " [EXCLU !!]" : " → ADD EXACT";
  console.log(`  ${fmt(o.cost).padStart(6)}€  ${fmt(o.conv)}conv  CPA ${fmt(o.cost / o.conv)}€  "${o.term}"${flag}`);
  console.log(`           déclenché par: [${o.trigMt}] "${o.trigKw}"`);
}

// 6. WASTE — dépense sans conversion, ≥1€
console.log(`\n${"─".repeat(70)}`);
console.log(`  💸 WASTE — ${waste.length} termes dépensant ≥1€ sans conversion → NÉGATIFS`);
console.log(`${"─".repeat(70)}`);

// Classifier par intention
const intentGroups = {
  gratuit: [],
  info: [],
  concurrents: [],
  hors_sujet: [],
  autre: [],
};
const gratuitRe = /grat(uit|is)|free|gratis/i;
const infoRe = /comment|how to|tutorial|tuto|guide|c'est quoi|what is|kesako|apprendre/i;
const concurrentRe = /smm(panel|raja|world|king|pro)|buzzoid|growthoid|instazood|famoid|views4you|bulkfollows|mediamister|twicsy|stormlikes|keensmm|peakerr/i;

for (const o of waste) {
  let grp = "autre";
  if (gratuitRe.test(o.term)) grp = "gratuit";
  else if (infoRe.test(o.term)) grp = "info";
  else if (concurrentRe.test(o.term)) grp = "concurrents";
  else if (!o.term.includes("tiktok")) grp = "hors_sujet";
  intentGroups[grp].push(o);
}

for (const [grp, items] of Object.entries(intentGroups)) {
  if (items.length === 0) continue;
  console.log(`\n  [${grp.toUpperCase()}] (${items.length})`);
  for (const o of items) {
    const excl = o.alreadyExcluded ? " [deja exclu]" : "";
    const posKw = o.isPositiveKw ? " [KW POSITIF - ne pas negativer]" : "";
    console.log(`    ${fmt(o.cost).padStart(6)}€  ${String(o.clicks).padStart(2)}clk  "${o.term}"${excl}${posKw}`);
  }
}

// 7. INFO — dépense entre 0.20€ et 1€, 0 conv
console.log(`\n${"─".repeat(70)}`);
console.log(`  ⚠️  INFO — ${info.length} termes 0.20€-1€ sans conversion (surveiller)`);
console.log(`${"─".repeat(70)}`);
for (const o of info) {
  console.log(`    ${fmt(o.cost).padStart(5)}€  ${String(o.clicks).padStart(2)}clk  "${o.term}"`);
}

// 8. Synthèse recommandations
const newExact = converters.filter((o) => !o.alreadyExact && !o.alreadyExcluded);
const newNegs = waste.filter((o) => !o.alreadyExcluded && !o.isPositiveKw);
const budgetWaste = waste.reduce((s, o) => s + o.cost, 0);

console.log(`\n${"═".repeat(70)}`);
console.log(`  RECOMMANDATIONS`);
console.log(`${"═".repeat(70)}`);
console.log(`  → Ajouter en EXACT    : ${newExact.length} terme(s)`);
if (newExact.length) newExact.forEach((o) => console.log(`      "${o.term}"`));
console.log(`  → Ajouter en NÉGATIF  : ${newNegs.length} terme(s) (${fmt(budgetWaste)}€ récupérables)`);
if (newNegs.length) newNegs.forEach((o) => console.log(`      "${o.term}"`));
console.log(`  → Budget gaspillé (WASTE ≥1€) : ${fmt(budgetWaste)}€ / ${fmt(totCost)}€ total (${totCost > 0 ? fmt(budgetWaste / totCost * 100) : 0}%)`);
console.log(`  → Termes <0.20€        : ${cheap.length} (ignorés — pas de signal)`);
