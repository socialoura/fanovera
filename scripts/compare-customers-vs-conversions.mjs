/**
 * Compare new customers (orders DB) vs Google Ads conversions on the
 * [FR] / [UK] / [US] campaigns, for TODAY and YESTERDAY.
 *   node scripts/compare-customers-vs-conversions.mjs
 * Read-only. Day boundaries use Europe/Paris (the Ads account timezone).
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

// ── Day labels in Europe/Paris ──
const fmtParis = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
const today = fmtParis.format(new Date());
const yObj = new Date(Date.now() - 24 * 3600 * 1000);
const yesterday = fmtParis.format(yObj);

// ── 1) New customers from orders DB ──
const { neon } = await import("@neondatabase/serverless");
const sql = neon(env.DATABASE_URL);

// A "paid" order = one Stripe actually created (has a payment intent) OR a
// non-pending/non-failed status. We measure on the Paris-local order date.
const rows = await sql`
  WITH paid AS (
    SELECT email,
           (created_at AT TIME ZONE 'Europe/Paris')::date AS d,
           created_at
    FROM orders
    WHERE stripe_payment_intent_id IS NOT NULL
      AND status NOT IN ('pending','failed')
  ),
  firsts AS (
    SELECT email, MIN((created_at AT TIME ZONE 'Europe/Paris')::date) AS first_d
    FROM paid GROUP BY email
  )
  SELECT p.d::text AS day,
         COUNT(*)::int AS orders,
         COUNT(DISTINCT p.email)::int AS buyers,
         COUNT(DISTINCT CASE WHEN f.first_d = p.d THEN p.email END)::int AS new_customers
  FROM paid p JOIN firsts f ON f.email = p.email
  WHERE p.d IN (${yesterday}::date, ${today}::date)
  GROUP BY p.d ORDER BY p.d`;

const dbByDay = Object.fromEntries(rows.map((r) => [r.day, r]));

// ── 2) Google Ads conversions per [FR]/[UK]/[US] campaign ──
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

const adsRows = await customer.query(`
  SELECT campaign.name, segments.date,
         metrics.conversions, metrics.clicks, metrics.cost_micros, metrics.conversions_value
  FROM campaign
  WHERE campaign.name LIKE '%Fanovera%' AND campaign.status != 'REMOVED'
    AND segments.date BETWEEN '${yesterday}' AND '${today}'`);

// region -> day -> {conv, clk, cost, val}
const ads = { FR: {}, UK: {}, US: {} };
for (const r of adsRows) {
  const m = /\[(FR|UK|US)\]/.exec(r.campaign.name);
  if (!m) continue;
  const reg = m[1];
  const day = r.segments.date;
  const a = ads[reg][day] || { conv: 0, clk: 0, cost: 0, val: 0 };
  a.conv += Number(r.metrics.conversions);
  a.clk += Number(r.metrics.clicks);
  a.cost += Number(r.metrics.cost_micros) / 1e6;
  a.val += Number(r.metrics.conversions_value);
  ads[reg][day] = a;
}

// ── Output ──
const f2 = (n) => Number(n).toFixed(2);
function dayBlock(label, day) {
  const db = dbByDay[day] || { orders: 0, buyers: 0, new_customers: 0 };
  console.log(`\n${"━".repeat(60)}\n${label}  (${day}, Europe/Paris)\n${"━".repeat(60)}`);
  console.log(`  Clients DB : ${db.new_customers} nouveaux · ${db.buyers} acheteurs · ${db.orders} commandes payées`);
  let convTot = 0, costTot = 0;
  for (const reg of ["FR", "UK", "US"]) {
    const a = ads[reg][day] || { conv: 0, clk: 0, cost: 0, val: 0 };
    convTot += a.conv; costTot += a.cost;
    console.log(`  Ads [${reg}]  : ${f2(a.conv)} conv · ${a.clk} clics · ${f2(a.cost)}€ · val ${f2(a.val)}€`);
  }
  console.log(`  Ads TOTAL  : ${f2(convTot)} conv · ${f2(costTot)}€`);
  console.log(`  → Écart    : ${db.orders} commandes payées vs ${f2(convTot)} conversions Ads (FR+UK+US)`);
}

dayBlock("HIER", yesterday);
dayBlock("AUJOURD'HUI", today);
console.log("");
