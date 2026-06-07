/** Reconcile campaign-level vs search-term-level conversions for [GLOBAL] IG. */
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
const CID = 23920353991;
const eur = (m) => Number(m) / 1e6;
const fmt = (d) => d.toISOString().slice(0, 10);
const today = new Date();
const from = new Date(today); from.setDate(from.getDate() - 90);
const RANGE = `segments.date BETWEEN '${fmt(from)}' AND '${fmt(today)}'`;

// Campaign-level totals, all-time-ish (last 90d)
const camp = await customer.query(`
  SELECT campaign.name, segments.date, metrics.clicks, metrics.cost_micros,
         metrics.conversions, metrics.conversions_value, metrics.all_conversions
  FROM campaign
  WHERE campaign.id=${CID} AND ${RANGE}
  ORDER BY segments.date
`);
let c=0,v=0,all=0,cost=0,clk=0;
console.log("Per-day campaign metrics:");
for (const r of camp) {
  const m=r.metrics;
  if (Number(m.conversions)>0 || Number(m.all_conversions)>0)
    console.log(`  ${r.segments.date}  cost=${eur(m.cost_micros).toFixed(2)}€ clk=${m.clicks} conv=${Number(m.conversions).toFixed(2)} allConv=${Number(m.all_conversions).toFixed(2)} val=${Number(m.conversions_value).toFixed(2)}€`);
  c+=Number(m.conversions); v+=Number(m.conversions_value); all+=Number(m.all_conversions); cost+=eur(m.cost_micros); clk+=Number(m.clicks);
}
console.log(`\nCAMPAIGN TOTAL 90d: ${cost.toFixed(2)}€ · ${clk} clicks · conversions=${c.toFixed(2)} · all_conversions=${all.toFixed(2)} · value=${v.toFixed(2)}€`);

// Conversion actions breakdown (which action fired)
const byAction = await customer.query(`
  SELECT segments.conversion_action_name, metrics.conversions, metrics.all_conversions, metrics.conversions_value
  FROM campaign
  WHERE campaign.id=${CID} AND ${RANGE}
`);
console.log(`\nBy conversion action:`);
for (const r of byAction) {
  const m=r.metrics;
  if (Number(m.conversions)>0 || Number(m.all_conversions)>0)
    console.log(`  "${r.segments.conversion_action_name}"  conv=${Number(m.conversions).toFixed(2)} all=${Number(m.all_conversions).toFixed(2)} val=${Number(m.conversions_value).toFixed(2)}€`);
}
