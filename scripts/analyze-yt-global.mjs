/**
 * Full analysis of the [GLOBAL] YouTube campaign: identity, bidding strategy,
 * campaign-level conversion reconciliation, and search-term breakdown.
 * Read-only.  node scripts/analyze-yt-global.mjs [days=30]
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
const { GoogleAdsApi, enums } = await import("google-ads-api");
const customer = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID, client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
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
const RANGE = `segments.date BETWEEN '${fmt(from)}' AND '${fmt(today)}'`;
const BSTNAME = Object.fromEntries(Object.entries(enums.BiddingStrategyType).map(([k, v]) => [v, k]));

// 1) Find YouTube campaign(s)
const camps = await customer.query(`
  SELECT campaign.id, campaign.name, campaign.status,
         campaign.bidding_strategy_type, campaign.target_spend.cpc_bid_ceiling_micros,
         campaign_budget.amount_micros
  FROM campaign WHERE campaign.name LIKE '%ouTube%'
`);
console.log("YouTube campaigns:");
for (const c of camps) console.log(`  id=${c.campaign.id} status=${c.campaign.status} "${c.campaign.name}"`);
const pick = camps.find((c) => /global/i.test(c.campaign.name)) || camps[0];
if (!pick) { console.log("none found"); process.exit(0); }
const CID = pick.campaign.id;
console.log(`\n>>> ${pick.campaign.name} (id=${CID})`);
console.log(`Strategy: ${BSTNAME[pick.campaign.bidding_strategy_type]} · budget ${eur(pick.campaign_budget.amount_micros).toFixed(2)}€/j · CPC ceiling ${pick.campaign.target_spend?.cpc_bid_ceiling_micros ? eur(pick.campaign.target_spend.cpc_bid_ceiling_micros).toFixed(2)+"€" : "(none)"}`);
console.log(`Window: last ${DAYS}d (${fmt(from)} → ${fmt(today)})\n`);

// 2) Campaign-level reconciliation
const camp = await customer.query(`
  SELECT metrics.clicks, metrics.impressions, metrics.cost_micros,
         metrics.conversions, metrics.conversions_value, metrics.all_conversions
  FROM campaign WHERE campaign.id=${CID} AND ${RANGE}
`);
let cost=0,clk=0,impr=0,conv=0,val=0,all=0;
for (const r of camp){const m=r.metrics;cost+=eur(m.cost_micros);clk+=Number(m.clicks);impr+=Number(m.impressions);conv+=Number(m.conversions);val+=Number(m.conversions_value);all+=Number(m.all_conversions);}
console.log(`CAMPAIGN TOTAL: ${cost.toFixed(2)}€ · ${clk} clicks · ${impr} impr · CTR ${impr?(100*clk/impr).toFixed(1):0}%`);
console.log(`  purchases=${conv.toFixed(1)} · value=${val.toFixed(2)}€ · all_conv(incl cart)=${all.toFixed(1)}`);
console.log(`  CPA ${conv>0?(cost/conv).toFixed(2):"—"}€ · ROAS ${cost>0?(val/cost).toFixed(2):"—"} · avgCPC ${clk?(cost/clk).toFixed(2):0}€`);

const byAction = await customer.query(`
  SELECT segments.conversion_action_name, metrics.conversions, metrics.all_conversions, metrics.conversions_value
  FROM campaign WHERE campaign.id=${CID} AND ${RANGE}
`);
console.log(`\nBy conversion action:`);
for (const r of byAction){const m=r.metrics;if(Number(m.conversions)>0||Number(m.all_conversions)>0)console.log(`  "${r.segments.conversion_action_name}" conv=${Number(m.conversions).toFixed(1)} all=${Number(m.all_conversions).toFixed(1)} val=${Number(m.conversions_value).toFixed(2)}€`);}

// 3) Search terms
const rows = await customer.query(`
  SELECT search_term_view.search_term, ad_group.name, search_term_view.status,
         segments.keyword.info.text, segments.keyword.info.match_type,
         metrics.clicks, metrics.impressions, metrics.cost_micros,
         metrics.conversions, metrics.conversions_value
  FROM search_term_view WHERE campaign.id=${CID} AND ${RANGE}
  ORDER BY metrics.cost_micros DESC
`);
const conv2=[],junk=[],watch=[],rest=[];
for (const r of rows){const m=r.metrics,st=r.search_term_view;const o={term:st.search_term,ag:r.ad_group.name,mt:MT[r.segments?.keyword?.info?.match_type]||"?",clicks:Number(m.clicks),impr:Number(m.impressions),cost:eur(m.cost_micros),conv:Number(m.conversions),val:Number(m.conversions_value),status:st.status};
  if(o.conv>0)conv2.push(o);else if(o.cost>=1.0)junk.push(o);else if(o.cost>=0.4)watch.push(o);else rest.push(o);}
const excl=(o)=>(o.status===3||o.status===5)?" (excluded)":"";
const line=(o)=>`  ${o.cost.toFixed(2).padStart(6)}€ clk=${String(o.clicks).padStart(2)} impr=${String(o.impr).padStart(4)} conv=${o.conv} val=${o.val.toFixed(2)}€ [${o.ag}·${o.mt}] "${o.term}"${excl(o)}`;
conv2.sort((a,b)=>b.val-a.val);junk.sort((a,b)=>b.cost-a.cost);watch.sort((a,b)=>b.cost-a.cost);
console.log(`\n✅ CONVERTERS (${conv2.length}):`);conv2.forEach((o)=>console.log(line(o)));
console.log(`\n⛔ BLEEDING 0-conv ≥1€ → NEGATE (${junk.length}):`);junk.forEach((o)=>console.log(line(o)));
console.log(`\n🟡 WATCH 0-conv 0.4–1€ (${watch.length}):`);watch.forEach((o)=>console.log(line(o)));
console.log(`\n… ${rest.length} terms <0.4€/0-conv (ignored).`);
const wasted=junk.reduce((s,o)=>s+o.cost,0)+watch.reduce((s,o)=>s+o.cost,0);
console.log(`\nST view spend ${rows.reduce((s,r)=>s+eur(r.metrics.cost_micros),0).toFixed(2)}€ · wasted(0-conv ≥0.4€) ${wasted.toFixed(2)}€`);
