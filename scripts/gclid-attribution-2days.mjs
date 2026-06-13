/**
 * Attribue chaque commande payée (hier + aujourd'hui, Europe/Paris) à sa source :
 * clic Google Ads (gclid → campagne FR/UK/US) vs organique/direct (pas de gclid).
 * Compare le nb de commandes ad-driven captées côté site au nb de conversions
 * remontées par Google Ads. Read-only.
 *   node scripts/gclid-attribution-2days.mjs
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

const fmtParis = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
const today = fmtParis.format(new Date());
const yesterday = fmtParis.format(new Date(Date.now() - 24 * 3600 * 1000));

const { neon } = await import("@neondatabase/serverless");
const sql = neon(env.DATABASE_URL);

// Per paid order: its Paris day, whether checkout_payloads has a gclid, and
// (if mapped) the campaign name → region. LEFT JOINs so we keep orders that
// have no payload row or an unmapped gclid.
const orders = await sql`
  SELECT
    (o.created_at AT TIME ZONE 'Europe/Paris')::date::text AS day,
    o.email,
    NULLIF(cp.gclid, '') AS gclid,
    gm.campaign_name
  FROM orders o
  LEFT JOIN checkout_payloads cp ON cp.payment_intent_id = o.stripe_payment_intent_id
  LEFT JOIN gclid_campaign_map gm ON gm.gclid = NULLIF(cp.gclid, '')
  WHERE o.stripe_payment_intent_id IS NOT NULL
    AND o.status NOT IN ('pending','failed')
    AND (o.created_at AT TIME ZONE 'Europe/Paris')::date IN (${yesterday}::date, ${today}::date)`;

// Mapping freshness
const fresh = await sql`SELECT MAX(click_date)::text AS last_click, COUNT(*)::int AS n FROM gclid_campaign_map`;

// Google Ads conversions per region per day
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
  SELECT campaign.name, segments.date, metrics.conversions
  FROM campaign
  WHERE campaign.name LIKE '%Fanovera%' AND campaign.status != 'REMOVED'
    AND segments.date BETWEEN '${yesterday}' AND '${today}'`);
const adsConv = {}; // day -> {FR,UK,US}
for (const r of adsRows) {
  const m = /\[(FR|UK|US)\]/.exec(r.campaign.name);
  if (!m) continue;
  (adsConv[r.segments.date] ||= { FR: 0, UK: 0, US: 0 })[m[1]] += Number(r.metrics.conversions);
}

function regionOf(name) {
  const m = /\[(FR|UK|US)\]/.exec(name || "");
  return m ? m[1] : "AUTRE";
}

console.log(`\nMapping gclid→campagne : ${fresh[0].n} gclids, dernier clic synchronisé le ${fresh[0].last_click}`);
console.log(`(tout clic plus récent n'est pas encore mappé → commande comptée "gclid non mappé")`);

for (const [label, day] of [["HIER", yesterday], ["AUJOURD'HUI", today]]) {
  const rows = orders.filter((o) => o.day === day);
  const withGclid = rows.filter((o) => o.gclid);
  const noGclid = rows.filter((o) => !o.gclid);
  const mapped = withGclid.filter((o) => o.campaign_name);
  const unmapped = withGclid.filter((o) => !o.campaign_name);
  const byReg = { FR: 0, UK: 0, US: 0, AUTRE: 0 };
  for (const o of mapped) byReg[regionOf(o.campaign_name)]++;

  console.log(`\n${"━".repeat(64)}\n${label}  (${day})\n${"━".repeat(64)}`);
  console.log(`  Commandes payées (site)        : ${rows.length}`);
  console.log(`  ├─ issues d'un clic Google      : ${withGclid.length}  (gclid présent)`);
  console.log(`  │   ├─ mappées à une campagne    : ${mapped.length}  → FR ${byReg.FR} · UK ${byReg.UK} · US ${byReg.US}${byReg.AUTRE ? ` · autre ${byReg.AUTRE}` : ""}`);
  console.log(`  │   └─ gclid non encore mappé    : ${unmapped.length}`);
  console.log(`  └─ sans gclid (organique/direct): ${noGclid.length}`);
  const a = adsConv[day] || { FR: 0, UK: 0, US: 0 };
  const adsTot = a.FR + a.UK + a.US;
  console.log(`  Conversions Google Ads          : ${adsTot.toFixed(2)}  → FR ${a.FR.toFixed(1)} · UK ${a.UK.toFixed(1)} · US ${a.US.toFixed(1)}`);
}
console.log("");
