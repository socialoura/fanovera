import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const sql = neon(env.DATABASE_URL);

console.log("=== Twitter (x_followers) prices from DB ===");
const rows = await sql`
  SELECT qty, price, active, popular, sort_order
  FROM pricing
  WHERE service = 'x_followers'
  ORDER BY qty
`;
for (const r of rows) {
  console.log(`  qty=${r.qty.toString().padStart(7)}  €${Number(r.price).toFixed(2).padStart(8)}  active=${r.active}  popular=${r.popular}`);
}

console.log("\n=== All services in pricing table (sample qtys) ===");
const services = await sql`
  SELECT service, COUNT(*) AS n, MIN(price) AS min_price, MAX(price) AS max_price
  FROM pricing
  WHERE active = true
  GROUP BY service
  ORDER BY service
`;
for (const s of services) {
  console.log(`  ${s.service.padEnd(20)}  ${s.n} packs   €${Number(s.min_price).toFixed(2)} → €${Number(s.max_price).toFixed(2)}`);
}
