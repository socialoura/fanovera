/**
 * Diagnostic read-only des campagnes [FR] / [UK] / [US] Fanovera :
 * config (statut, enchères, budget) + perf par ad group (90j).
 *   node scripts/diag-fr-uk-us.mjs
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

const ST = { 2: "ENABLED", 3: "PAUSED", 4: "REMOVED" };
const BID = { 0: "UNSPEC", 6: "MAXIMIZE_CONVERSIONS", 7: "TARGET_CPA", 9: "MANUAL_CPC", 10: "MAXIMIZE_CONV_VALUE", 11: "TARGET_ROAS", 12: "MAXIMIZE_CLICKS", 13: "TARGET_SPEND" };
const eur = (m) => Number(m) / 1e6;
const f2 = (n) => n.toFixed(2);
const today = new Date(); const from = new Date(today); from.setDate(from.getDate() - 90);
const f = (d) => d.toISOString().slice(0, 10);

const camps = await customer.query(`
  SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
         campaign.bidding_strategy_type, campaign_budget.amount_micros,
         campaign.maximize_conversions.target_cpa_micros, campaign.target_cpa.target_cpa_micros,
         campaign.target_roas.target_roas
  FROM campaign WHERE campaign.name LIKE '%Fanovera%' AND campaign.status != 'REMOVED'
  ORDER BY campaign.name`);

for (const c of camps) {
  const cam = c.campaign;
  if (!/\[(FR|UK|US)\]/.test(cam.name)) continue;
  const budget = eur(c.campaign_budget?.amount_micros || 0);
  const tcpa = eur(cam.maximize_conversions?.target_cpa_micros || cam.target_cpa?.target_cpa_micros || 0);
  const troas = cam.target_roas?.target_roas || 0;
  console.log("\n" + "═".repeat(72));
  console.log(`${cam.name}  [${ST[cam.status]}]`);
  console.log("═".repeat(72));
  console.log(`  Enchères : ${BID[cam.bidding_strategy_type] || cam.bidding_strategy_type}${tcpa ? ` (tCPA ${f2(tcpa)}€)` : ""}${troas ? ` (tROAS ${f2(troas)}x)` : ""}`);
  console.log(`  Budget/j : ${f2(budget)}€`);

  // geo targets
  const geos = await customer.query(`SELECT campaign_criterion.location.geo_target_constant FROM campaign_criterion WHERE campaign.id=${cam.id} AND campaign_criterion.type='LOCATION' AND campaign_criterion.negative=false`);
  console.log(`  Geo      : ${geos.length} cible(s)${geos.length <= 5 ? " — " + geos.map((g) => g.campaign_criterion.location.geo_target_constant.split("/").pop()).join(", ") : ""}`);

  // per ad group 90d
  const rows = await customer.query(`
    SELECT ad_group.id, ad_group.name, ad_group.status,
           metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value
    FROM ad_group WHERE campaign.id=${cam.id} AND ad_group.status != 'REMOVED'
      AND segments.date BETWEEN '${f(from)}' AND '${f(today)}'`);
  const byAg = new Map();
  for (const r of rows) {
    const k = `${r.ad_group.name}|${ST[r.ad_group.status]}`;
    const a = byAg.get(k) || { clk: 0, cost: 0, conv: 0, val: 0 };
    a.clk += Number(r.metrics.clicks); a.cost += eur(r.metrics.cost_micros);
    a.conv += Number(r.metrics.conversions); a.val += Number(r.metrics.conversions_value);
    byAg.set(k, a);
  }
  console.log(`  Ad groups (90j, ceux avec dépense) :`);
  const sorted = [...byAg.entries()].sort((a, b) => b[1].cost - a[1].cost);
  let tc = 0, tco = 0, tv = 0;
  for (const [k, a] of sorted) {
    tc += a.cost; tco += a.conv; tv += a.val;
    if (a.cost < 0.01) continue;
    const [name, st] = k.split("|");
    console.log(`     ${name.padEnd(11)} [${st.padEnd(7)}] ${f2(a.cost).padStart(7)}€  ${String(a.clk).padStart(3)}clk  ${f2(a.conv).padStart(5)}conv  CPA ${a.conv > 0 ? f2(a.cost / a.conv).padStart(6) : "    — "}  ROAS ${a.cost > 0 ? f2(a.val / a.cost) + "x" : "—"}`);
  }
  console.log(`     ${"TOTAL".padEnd(11)} ${"".padEnd(9)} ${f2(tc).padStart(7)}€  ${"".padStart(3)}    ${f2(tco).padStart(5)}conv  CPA ${tco > 0 ? f2(tc / tco) : "—"}  ROAS ${tc > 0 ? f2(tv / tc) + "x" : "—"}`);
}
