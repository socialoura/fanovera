/**
 * Diagnostic: reproduce exactly what the sync-google-ads cron does, but print
 * the real error instead of swallowing it. Also lists accessible accounts so
 * we can verify customer_id / login_customer_id are right.
 *
 *   node scripts/diag-ads-costs.mjs
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

const cid = (env.GOOGLE_ADS_CUSTOMER_ID || "").replace(/-/g, "");
const lcid = (env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "").replace(/-/g, "");
console.log("customer_id      =", cid || "(missing)");
console.log("login_customer_id=", lcid || "(missing)");
console.log("dev_token set    =", Boolean(env.GOOGLE_ADS_DEVELOPER_TOKEN));
console.log("refresh_token set=", Boolean(env.GOOGLE_ADS_REFRESH_TOKEN));
console.log("---");

const { GoogleAdsApi } = await import("google-ads-api");
const api = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

// 1) Which accounts can this refresh token + dev token actually reach?
try {
  const list = await api.listAccessibleCustomers(env.GOOGLE_ADS_REFRESH_TOKEN);
  console.log("Accessible customers:", list.resource_names);
} catch (err) {
  console.log("listAccessibleCustomers FAILED:", describe(err));
}
console.log("---");

const customer = api.Customer({
  customer_id: cid,
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: lcid || undefined,
});

// 2) The exact campaign-cost query the cron runs (last 14 days).
try {
  const rows = await customer.query(`
    SELECT campaign.id, campaign.name, segments.date,
           metrics.cost_micros, metrics.clicks, metrics.conversions
    FROM campaign
    WHERE segments.date DURING LAST_14_DAYS
  `);
  console.log(`campaign cost rows (14d): ${rows.length}`);
  for (const r of rows.slice(0, 10)) {
    console.log(`  ${r.segments.date}  ${String(r.campaign.id).padEnd(12)} ${(r.campaign.name||"").padEnd(24)} cost=${(Number(r.metrics.cost_micros)/1e6).toFixed(2)}€ clicks=${r.metrics.clicks}`);
  }
  if (rows.length === 0) console.log("  → 0 rows: account has no spend in window, OR wrong account id.");
} catch (err) {
  console.log("campaign query FAILED:", describe(err));
}

function describe(err) {
  if (err?.errors?.length) {
    return err.errors.map((e) => {
      const k = e.error_code ? Object.keys(e.error_code)[0] : "error";
      const v = e.error_code ? e.error_code[k] : "";
      return `${k}=${v} :: ${e.message}`;
    }).join(" | ") + (err.request_id ? ` | request_id=${err.request_id}` : "");
  }
  return err?.message || JSON.stringify(err);
}
