// Per-entry-package economics + (windowed) repeat value, from real orders.
//
//   node scripts/analyze-ltv.mjs
//
// IMPORTANT: with only a few weeks of data this is NOT a mature lifetime value.
// The contribution-margin-per-order numbers ARE reliable (they don't need time);
// the "windowed LTV" / repeat multiplier is an early signal only.
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const sql = neon(env.DATABASE_URL);

const CPA_FR = 7.68; // €, from prior Google Ads analysis

// 1) Pull paid-ish orders with their economics.
const rows = await sql`
  SELECT id, LOWER(email) AS email, created_at, platform, cart,
         total_cents, COALESCE(cost_cents,0) AS cost_cents,
         COALESCE(stripe_fee_cents,0) AS fee_cents,
         COALESCE(refunded_amount_cents,0) AS refunded_cents
  FROM orders
  WHERE status NOT IN ('pending','canceled','failed') AND email <> ''
  ORDER BY email, created_at ASC
`;

// 2) Drop outlier accounts (test/internal/reseller) — anyone with an absurd
//    order count over this short window distorts every average.
const counts = new Map();
for (const r of rows) counts.set(r.email, (counts.get(r.email) || 0) + 1);
const OUTLIER_MIN = 10;
const outliers = [...counts].filter(([, n]) => n >= OUTLIER_MIN).map(([e]) => e);
const clean = rows.filter((r) => !outliers.includes(r.email));
console.log(`Orders: ${rows.length} total, excluded ${outliers.length} outlier account(s) (>=${OUTLIER_MIN} orders) -> ${clean.length} kept\n`);

// 3) Identify the "entry package" = primary (non-upsell) item of each
//    customer's FIRST order.
function primaryItem(cart) {
  if (!Array.isArray(cart)) return null;
  const main = cart.find((it) => it && !it.upsell) || cart[0];
  return main || null;
}
const net = (r) => r.total_cents - r.refunded_cents;
const margin = (r) => net(r) - r.cost_cents - r.fee_cents;

const byCustomer = new Map();
for (const r of clean) {
  if (!byCustomer.has(r.email)) byCustomer.set(r.email, []);
  byCustomer.get(r.email).push(r);
}

const groups = new Map(); // entryKey -> {customers, firstNet[], firstMargin[], ltvNet[], ltvMargin[], orders}
for (const [, orders] of byCustomer) {
  const first = orders[0];
  const it = primaryItem(first.cart);
  if (!it || !it.service) continue;
  const qty = Number(it.qty) || 0;
  const key = `${it.service}|${qty}`;
  if (!groups.has(key)) groups.set(key, { service: it.service, qty, customers: 0, firstNet: [], firstMargin: [], ltvNet: [], ltvMargin: [], totalOrders: 0, repeaters: 0 });
  const g = groups.get(key);
  g.customers++;
  g.firstNet.push(net(first));
  g.firstMargin.push(margin(first));
  g.ltvNet.push(orders.reduce((s, o) => s + net(o), 0));
  g.ltvMargin.push(orders.reduce((s, o) => s + margin(o), 0));
  g.totalOrders += orders.length;
  if (orders.length > 1) g.repeaters++;
}

const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// 4) Report — focus on Instagram followers, then everything.
const fmt = (cents) => (cents / 100).toFixed(2);
const print = (filter, title) => {
  const list = [...groups.values()].filter(filter).sort((a, b) => a.qty - b.qty);
  if (!list.length) return;
  console.log(`\n=== ${title} ===  (median per customer)`);
  console.log("service        qty     n  1stOrder  1stMargin   winLTV  winLTVmargin  repeat%  margin-CPA(FR)");
  for (const g of list) {
    const foMed = median(g.firstNet);
    const fmMed = median(g.firstMargin);
    const ltvN = median(g.ltvNet);
    const ltvM = median(g.ltvMargin);
    const rep = (g.repeaters / g.customers) * 100;
    const vsCPA = fmMed / 100 - CPA_FR; // first-order margin minus acquisition cost
    console.log(
      `${g.service.padEnd(13)} ${String(g.qty).padStart(6)} ${String(g.customers).padStart(5)}  ${fmt(foMed).padStart(7)}  ${fmt(fmMed).padStart(8)}  ${fmt(ltvN).padStart(7)}  ${fmt(ltvM).padStart(11)}  ${rep.toFixed(0).padStart(6)}  ${(vsCPA >= 0 ? "+" : "") + vsCPA.toFixed(2).padStart(6)}`,
    );
  }
};

print((g) => g.service === "ig_followers", "Instagram followers — entry package economics");
print((g) => g.service !== "ig_followers" && g.customers >= 2, "Other entry packages (>=2 customers)");

// 5) Headline aggregates — report BOTH median and mean so anomalies are visible.
const allFirstMargin = [...groups.values()].flatMap((g) => g.firstMargin);
const allLtvMargin = [...groups.values()].flatMap((g) => g.ltvMargin);
const mean = (arr) => arr.reduce((s, x) => s + x, 0) / arr.length;
const totCust = allFirstMargin.length;
console.log(`\n— Headline (clean, ${totCust} customers) —`);
console.log(`first-order contribution margin:  median ${(median(allFirstMargin) / 100).toFixed(2)} €  |  mean ${(mean(allFirstMargin) / 100).toFixed(2)} €`);
console.log(`  → vs CPA FR ${CPA_FR} €:        median ${((median(allFirstMargin) / 100) - CPA_FR).toFixed(2)} €  |  mean ${((mean(allFirstMargin) / 100) - CPA_FR).toFixed(2)} € per acquired customer`);
console.log(`windowed LTV margin (2 weeks!):   median ${(median(allLtvMargin) / 100).toFixed(2)} €  |  mean ${(mean(allLtvMargin) / 100).toFixed(2)} €`);
console.log(`repeat multiplier so far: ${(mean(allLtvMargin) / mean(allFirstMargin)).toFixed(2)}x  (immature — only 2 weeks of history)`);
