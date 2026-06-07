/**
 * One-off analysis of ALL search terms on the "Global Instagram Followers"
 * campaign, to drive optimization (negatives + exact harvest).
 *
 * Read-only. Default window = 30 days.
 *   node scripts/analyze-ig-global-search-terms.mjs        # last 30 days
 *   node scripts/analyze-ig-global-search-terms.mjs 60     # last 60 days
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

const MT = { 2: "EXACT", 3: "PHRASE", 4: "BROAD" };
const eur = (m) => Number(m) / 1e6;
const fmt = (d) => d.toISOString().slice(0, 10);
const today = new Date();
const from = new Date(today); from.setDate(from.getDate() - DAYS);

// 1) Locate the campaign(s) matching Instagram (print all so we pick the right one).
const camps = await customer.query(`
  SELECT campaign.id, campaign.name, campaign.status
  FROM campaign
  WHERE campaign.name LIKE '%nstagram%'
`);
console.log("Campaigns matching '%nstagram%':");
for (const c of camps) console.log(`  id=${c.campaign.id}  status=${c.campaign.status}  "${c.campaign.name}"`);

// Pick the one whose name contains both "global" and "follower" if present, else first.
const pick =
  camps.find((c) => /global/i.test(c.campaign.name) && /follower/i.test(c.campaign.name)) ||
  camps.find((c) => /global/i.test(c.campaign.name)) ||
  camps[0];
if (!pick) { console.log("No Instagram campaign found."); process.exit(0); }
const CID = pick.campaign.id;
console.log(`\n>>> Analyzing campaign id=${CID} "${pick.campaign.name}" — last ${DAYS}d (${fmt(from)} → ${fmt(today)})\n`);

const rows = await customer.query(`
  SELECT search_term_view.search_term, ad_group.name, search_term_view.status,
         segments.keyword.info.text, segments.keyword.info.match_type,
         metrics.clicks, metrics.impressions, metrics.cost_micros,
         metrics.conversions, metrics.conversions_value
  FROM search_term_view
  WHERE campaign.id=${CID} AND segments.date BETWEEN '${fmt(from)}' AND '${fmt(today)}'
  ORDER BY metrics.cost_micros DESC
`);

const conv = [], junk = [], watch = [], rest = [];
for (const r of rows) {
  const m = r.metrics, st = r.search_term_view;
  const o = {
    term: st.search_term, ag: r.ad_group.name,
    kw: r.segments?.keyword?.info?.text, mt: MT[r.segments?.keyword?.info?.match_type] || "?",
    clicks: Number(m.clicks), impr: Number(m.impressions), cost: eur(m.cost_micros),
    conv: Number(m.conversions), val: Number(m.conversions_value), status: st.status,
  };
  if (o.conv > 0) conv.push(o);
  else if (o.cost >= 1.0) junk.push(o);          // bleeding: 0 conv, ≥1€
  else if (o.cost >= 0.4) watch.push(o);          // borderline: 0 conv, 0.40–1€
  else rest.push(o);
}
const excl = (o) => (o.status === 3 || o.status === 5) ? " (already excluded)" : "";
const line = (o) => `  ${o.cost.toFixed(2).padStart(6)}€  clk=${String(o.clicks).padStart(2)}  impr=${String(o.impr).padStart(4)}  conv=${o.conv}  val=${o.val.toFixed(2)}€  [${o.ag} · ${o.mt}] "${o.term}"${excl(o)}`;

conv.sort((a, b) => b.val - a.val);
junk.sort((a, b) => b.cost - a.cost);
watch.sort((a, b) => b.cost - a.cost);

console.log(`✅ CONVERTERS — lock as EXACT (${conv.length}):`);
conv.forEach((o) => console.log(line(o)));
console.log(`\n⛔ BLEEDING — 0 conv, ≥1.00€ — NEGATE (${junk.length}):`);
junk.forEach((o) => console.log(line(o)));
console.log(`\n🟡 WATCH — 0 conv, 0.40–1.00€ (${watch.length}):`);
watch.forEach((o) => console.log(line(o)));
console.log(`\n… ${rest.length} terms below 0.40€ / 0 conv (ignored).`);

const totCost = rows.reduce((s, r) => s + eur(r.metrics.cost_micros), 0);
const totConv = rows.reduce((s, r) => s + Number(r.metrics.conversions), 0);
const totVal = rows.reduce((s, r) => s + Number(r.metrics.conversions_value), 0);
const totClicks = rows.reduce((s, r) => s + Number(r.metrics.clicks), 0);
console.log(`\nTOTAL: ${totCost.toFixed(2)}€ spend · ${totClicks} clicks · ${totConv.toFixed(1)} conv · ${totVal.toFixed(2)}€ value`);
console.log(`CPA ${totConv > 0 ? (totCost / totConv).toFixed(2) : "—"}€ · ROAS ${totCost > 0 ? (totVal / totCost).toFixed(2) : "—"} · wasted(0-conv) ${(junk.reduce((s,o)=>s+o.cost,0)+watch.reduce((s,o)=>s+o.cost,0)).toFixed(2)}€`);
