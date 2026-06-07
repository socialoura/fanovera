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
const fmt = (d) => d.toISOString().slice(0, 10);
const today = new Date(); const from = new Date(today); from.setDate(from.getDate() - 30);
const RANGE = `segments.date BETWEEN '${fmt(from)}' AND '${fmt(today)}'`;

console.log("Geo (country criterion id → clicks/cost):");
const geo = await customer.query(`
  SELECT campaign.id, geographic_view.country_criterion_id, metrics.clicks, metrics.impressions, metrics.cost_micros
  FROM geographic_view WHERE campaign.id=${CID} AND ${RANGE}
`);
const g={};
for (const r of geo){const id=r.geographic_view?.country_criterion_id||"?";const e=g[id]=g[id]||{clk:0,impr:0,cost:0};e.clk+=Number(r.metrics.clicks);e.impr+=Number(r.metrics.impressions);e.cost+=Number(r.metrics.cost_micros);}
for (const [id,e] of Object.entries(g).sort((a,b)=>b[1].cost-a[1].cost))console.log(`  ${id} impr=${e.impr} clk=${e.clk} cost=${eur(e.cost)}€`);

console.log("\nResponsive Search Ads (headlines / descriptions):");
const ads = await customer.query(`
  SELECT ad_group.name, ad_group_ad.ad.responsive_search_ad.headlines,
         ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.status,
         ad_group_ad.ad.final_urls
  FROM ad_group_ad WHERE campaign.id=${CID}
`);
for (const r of ads){
  const ad=r.ad_group_ad.ad.responsive_search_ad;
  console.log(`\n  [${r.ad_group.name}] status=${r.ad_group_ad.status} url=${r.ad_group_ad.ad.final_urls?.join(",")}`);
  console.log(`  HEADLINES: ${(ad?.headlines||[]).map(h=>`"${h.text}"`).join(" | ")}`);
  console.log(`  DESCRIPTIONS: ${(ad?.descriptions||[]).map(d=>`"${d.text}"`).join(" | ")}`);
}
