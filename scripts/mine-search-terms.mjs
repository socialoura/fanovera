/**
 * Search-terms miner for the phrase test (harvest / negate loop).
 * Pulls the actual queries triggered on [UK] Fanovera over the last N days,
 * with the triggering keyword + match type, clicks, cost, conversions & value.
 *
 * Reads it two ways:
 *   ✅ CONVERTERS  → add as EXACT (lock them in)
 *   ⛔ SPENDERS (cost, 0 conv) → add as negatives
 *
 * Read-only (no mutations). Default window = 14 days.
 *
 * Usage:
 *   node scripts/mine-search-terms.mjs          # last 14 days
 *   node scripts/mine-search-terms.mjs 21       # last 21 days
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

const DAYS = Number(process.argv[2]) || 14;
const { GoogleAdsApi, enums } = await import("google-ads-api");
const customer = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, ""),
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});

const UK = 23844174192;
const MT = { 2: "EXACT", 3: "PHRASE", 4: "BROAD" };
const eur = (m) => Number(m) / 1e6;
const fmt = (d) => d.toISOString().slice(0, 10);
const today = new Date();
const from = new Date(today); from.setDate(from.getDate() - DAYS);

const rows = await customer.query(`
  SELECT search_term_view.search_term, ad_group.name, search_term_view.status,
         segments.keyword.info.text, segments.keyword.info.match_type,
         metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value
  FROM search_term_view
  WHERE campaign.id=${UK} AND segments.date BETWEEN '${fmt(from)}' AND '${fmt(today)}'
  ORDER BY metrics.cost_micros DESC
`);

console.log(`\n[UK] search terms — last ${DAYS} days (${fmt(from)} → ${fmt(today)}) · ${rows.length} terms\n`);
const conv = [], junk = [], rest = [];
for (const r of rows) {
  const m = r.metrics, st = r.search_term_view;
  const o = {
    term: st.search_term, ag: r.ad_group.name,
    kw: r.segments?.keyword?.info?.text, mt: MT[r.segments?.keyword?.info?.match_type] || "?",
    clicks: Number(m.clicks), cost: eur(m.cost_micros), conv: Number(m.conversions), val: Number(m.conversions_value),
    status: st.status, // 2=ADDED 3=EXCLUDED 4=NONE 5=ADDED_EXCLUDED
  };
  if (o.conv > 0) conv.push(o);
  else if (o.cost >= 0.5) junk.push(o);
  else rest.push(o);
}
const line = (o) => `  ${o.cost.toFixed(2).padStart(6)}€  clk=${String(o.clicks).padStart(2)}  conv=${o.conv}  [${o.ag} · ${o.mt}] "${o.term}"${o.status === 3 || o.status === 5 ? " (already excluded)" : ""}`;

console.log(`✅ CONVERTERS — add as EXACT (${conv.length}):`);
conv.forEach((o) => console.log(line(o)));
console.log(`\n⛔ SPENDERS, 0 conv, ≥0.50€ — candidates to NEGATE (${junk.length}):`);
junk.forEach((o) => console.log(line(o)));
console.log(`\n… ${rest.length} low-cost / 0-conv terms below 0.50€ (ignored).`);

const totCost = rows.reduce((s, r) => s + eur(r.metrics.cost_micros), 0);
const totConv = rows.reduce((s, r) => s + Number(r.metrics.conversions), 0);
console.log(`\nTotal: ${totCost.toFixed(2)}€ · ${totConv.toFixed(1)} conv · CPA ${totConv > 0 ? (totCost / totConv).toFixed(2) : "—"}€`);
void enums;
