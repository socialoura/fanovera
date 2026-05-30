/**
 * Where is the ad spend? For each accessible account, sum cost over the last
 * 14 days; for the configured account, also break it down per campaign.
 * Confirms whether the single configured customer_id captures the whole spend.
 *
 *   node scripts/diag-ads-accounts.mjs
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

const configuredId = (env.GOOGLE_ADS_CUSTOMER_ID || "").replace(/-/g, "");
const lcid = (env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "").replace(/-/g, "");

const { GoogleAdsApi } = await import("google-ads-api");
const api = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

const list = await api.listAccessibleCustomers(env.GOOGLE_ADS_REFRESH_TOKEN);
const ids = list.resource_names.map((r) => r.split("/").pop());

console.log("Spend per accessible account (last 14 days):\n");
for (const id of ids) {
  const cust = api.Customer({ customer_id: id, refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN, login_customer_id: lcid || undefined });
  try {
    const rows = await cust.query(`
      SELECT customer.descriptive_name, customer.currency_code, customer.manager,
             metrics.cost_micros
      FROM customer
      WHERE segments.date DURING LAST_14_DAYS
    `);
    let micros = 0; let name = ""; let cur = ""; let mgr = false;
    for (const r of rows) {
      micros += Number(r.metrics?.cost_micros) || 0;
      name = r.customer?.descriptive_name || name;
      cur = r.customer?.currency_code || cur;
      mgr = r.customer?.manager ?? mgr;
    }
    const tag = id === configuredId ? "  <== CONFIGURED" : mgr ? "  (manager/MCC)" : "";
    console.log(`  ${id}  ${(name||"?").padEnd(22)} ${cur||"?"}  cost=${(micros/1e6).toFixed(2)}${tag}`);
  } catch (err) {
    console.log(`  ${id}  query failed: ${err?.errors?.[0]?.message || err?.message || "err"}`);
  }
}

console.log(`\nPer-campaign breakdown of CONFIGURED account ${configuredId} (last 14 days):\n`);
const cust = api.Customer({ customer_id: configuredId, refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN, login_customer_id: lcid || undefined });
const rows = await cust.query(`
  SELECT campaign.id, campaign.name, metrics.cost_micros
  FROM campaign
  WHERE segments.date DURING LAST_14_DAYS
`);
const byCamp = new Map();
for (const r of rows) {
  const k = `${r.campaign.id}|${r.campaign.name}`;
  byCamp.set(k, (byCamp.get(k) || 0) + (Number(r.metrics?.cost_micros) || 0));
}
for (const [k, micros] of [...byCamp.entries()].sort((a, b) => b[1] - a[1])) {
  const [, name] = k.split("|");
  console.log(`  ${name.padEnd(28)} ${(micros/1e6).toFixed(2)}€`);
}
