/** Why is [GLOBAL] YouTube Views starved? IS lost + keyword list + geo. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const { GoogleAdsApi } = await import("google-ads-api");
const customer = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID, client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, ""),
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});
const CID = "23915914448";
const eur = (m) => (Number(m) / 1e6).toFixed(2);
const MT = { 2: "EXACT", 3: "PHRASE", 4: "BROAD" };
const fmt = (d) => d.toISOString().slice(0, 10);
const today = new Date(); const from = new Date(today); from.setDate(from.getDate() - 30);
const RANGE = `segments.date BETWEEN '${fmt(from)}' AND '${fmt(today)}'`;

const c = (await customer.query(`
  SELECT metrics.search_impression_share, metrics.search_budget_lost_impression_share,
         metrics.search_rank_lost_impression_share, metrics.impressions
  FROM campaign WHERE campaign.id=${CID} AND ${RANGE}
`))[0].metrics;
const pct = (x) => x == null ? "—" : (100 * Number(x)).toFixed(1) + "%";
console.log(`Impression share: ${pct(c.search_impression_share)}`);
console.log(`  lost to BUDGET: ${pct(c.search_budget_lost_impression_share)}`);
console.log(`  lost to RANK (bid/quality): ${pct(c.search_rank_lost_impression_share)}`);

console.log(`\nKeywords in campaign:`);
const kws = await customer.query(`
  SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
         ad_group_criterion.status, ad_group_criterion.quality_info.quality_score,
         metrics.impressions, metrics.clicks, metrics.cost_micros
  FROM keyword_view WHERE campaign.id=${CID} AND ${RANGE}
  ORDER BY metrics.impressions DESC
`);
for (const r of kws){const k=r.ad_group_criterion,m=r.metrics;console.log(`  [${MT[k.keyword.match_type]}] "${k.keyword.text}" status=${k.status} QS=${k.quality_info?.quality_score??"—"} impr=${m.impressions} clk=${m.clicks} cost=${eur(m.cost_micros)}€`);}

console.log(`\nAll enabled keywords (incl 0-impr), by ad group:`);
const allkw = await customer.query(`
  SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status
  FROM ad_group_criterion WHERE campaign.id=${CID} AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.negative=false
`);
const byAg={};
for (const r of allkw){const ag=r.ad_group.name;(byAg[ag]=byAg[ag]||[]).push(`[${MT[r.ad_group_criterion.keyword.match_type]}] "${r.ad_group_criterion.keyword.text}"${r.ad_group_criterion.status===2?"":" (paused)"}`);}
for (const [ag,list] of Object.entries(byAg)){console.log(`  ${ag} (${list.length}):`);list.forEach((x)=>console.log(`    ${x}`));}

console.log(`\nGeo (by country, clicks/cost):`);
const geo = await customer.query(`
  SELECT geographic_view.country_criterion_id, metrics.clicks, metrics.impressions, metrics.cost_micros
  FROM geographic_view WHERE campaign.id=${CID} AND ${RANGE}
`);
const g={};
for (const r of geo){const id=r.geographic_view.country_criterion_id;const e=g[id]=g[id]||{clk:0,impr:0,cost:0};e.clk+=Number(r.metrics.clicks);e.impr+=Number(r.metrics.impressions);e.cost+=Number(r.metrics.cost_micros);}
for (const [id,e] of Object.entries(g).sort((a,b)=>b[1].cost-a[1].cost))console.log(`  countryCritId=${id} impr=${e.impr} clk=${e.clk} cost=${eur(e.cost)}€`);
