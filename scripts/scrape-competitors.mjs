// Competitor price watch — scrapes each competitor, normalises platform/service,
// converts to EUR, computes a per-1000 unit price, and stores a DATED snapshot
// in Neon (competitor_prices) plus a CSV under data/competitor-prices/.
//
//   node scripts/scrape-competitors.mjs              # scrape all, write DB + CSV
//   node scripts/scrape-competitors.mjs --dry        # scrape + print, no DB write
//   node scripts/scrape-competitors.mjs --only insfamous.co,deviral.fr
//
// Snapshots are kept (one row per run_date / competitor / product / qty) so we
// can track how each competitor's prices move over time.
import { readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { loadEnv, classify, makeEurConverter } from "./competitors/_lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = loadEnv();
const sql = neon(env.DATABASE_URL);

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const onlyArg = argv[argv.indexOf("--only") + 1];
const ONLY = argv.includes("--only") && onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim())) : null;

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS competitor_prices (
      id SERIAL PRIMARY KEY,
      run_date DATE NOT NULL DEFAULT CURRENT_DATE,
      competitor VARCHAR(60) NOT NULL,
      platform VARCHAR(20) NOT NULL DEFAULT 'unknown',
      service VARCHAR(20) NOT NULL DEFAULT 'unknown',
      product_name TEXT NOT NULL,
      qty INTEGER,
      price NUMERIC(12,4) NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
      price_eur NUMERIC(12,4) NOT NULL,
      unit_price_eur NUMERIC(14,6),
      url TEXT DEFAULT '',
      scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(run_date, competitor, product_name, qty)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_comp_prices_lookup ON competitor_prices(platform, service, run_date DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_comp_prices_competitor ON competitor_prices(competitor, run_date DESC)`;
}

async function loadScrapers() {
  const files = readdirSync(join(__dirname, "competitors")).filter((f) => f.endsWith(".mjs") && !f.startsWith("_"));
  const mods = [];
  for (const f of files) {
    const mod = await import(`./competitors/${f}`);
    if (typeof mod.scrape === "function" && mod.meta?.name) mods.push(mod);
  }
  return mods;
}

async function main() {
  if (!DRY) await ensureTable();
  const toEur = await makeEurConverter();
  const scrapers = (await loadScrapers()).filter((m) => !ONLY || ONLY.has(m.meta.name));

  console.log(`Scraping ${scrapers.length} competitor(s)${DRY ? " [DRY RUN]" : ""}...\n`);
  const allRows = [];
  const summary = [];

  for (const mod of scrapers) {
    const { name } = mod.meta;
    try {
      const raw = await mod.scrape();
      const rows = [];
      const seen = new Set();
      for (const r of raw) {
        if (r.price == null || !(r.price > 0)) continue;
        const { platform, service } = classify(r.platform, r.service, r.name, r._cats);
        const priceEur = toEur(Number(r.price), r.currency);
        const qty = Number.isFinite(r.qty) && r.qty > 0 ? Math.round(r.qty) : null;
        const unit = qty ? Math.round((priceEur / qty) * 1000 * 1e6) / 1e6 : null;
        // de-dupe within this run on the same key as the UNIQUE constraint
        const key = `${name}|${r.name}|${qty ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({
          competitor: name,
          platform,
          service,
          product_name: r.name,
          qty,
          price: Number(r.price),
          currency: (r.currency || "EUR").toUpperCase(),
          price_eur: priceEur,
          unit_price_eur: unit,
          url: r.url || "",
        });
      }
      allRows.push(...rows);
      const known = rows.filter((x) => x.platform !== "unknown" && x.service !== "unknown").length;
      summary.push({ name, ok: true, count: rows.length, known });
      console.log(`✓ ${name.padEnd(20)} ${String(rows.length).padStart(4)} products (${known} classified)`);
    } catch (err) {
      summary.push({ name, ok: false, count: 0, known: 0, error: err.message });
      console.log(`✗ ${name.padEnd(20)} FAILED: ${err.message}`);
    }
  }

  if (allRows.length === 0) {
    console.log("\nNo rows scraped. Nothing to store.");
    return;
  }

  // ── Persist DB snapshot ──
  if (!DRY) {
    let n = 0;
    for (const r of allRows) {
      await sql`
        INSERT INTO competitor_prices
          (competitor, platform, service, product_name, qty, price, currency, price_eur, unit_price_eur, url)
        VALUES
          (${r.competitor}, ${r.platform}, ${r.service}, ${r.product_name}, ${r.qty},
           ${r.price}, ${r.currency}, ${r.price_eur}, ${r.unit_price_eur}, ${r.url})
        ON CONFLICT (run_date, competitor, product_name, qty) DO UPDATE SET
          platform = EXCLUDED.platform, service = EXCLUDED.service,
          price = EXCLUDED.price, currency = EXCLUDED.currency,
          price_eur = EXCLUDED.price_eur, unit_price_eur = EXCLUDED.unit_price_eur,
          url = EXCLUDED.url, scraped_at = NOW()
      `;
      n++;
    }
    console.log(`\nStored ${n} rows into competitor_prices (run_date = today).`);
  }

  // ── CSV snapshot ──
  const outDir = join(__dirname, "..", "data", "competitor-prices");
  mkdirSync(outDir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const header = "competitor,platform,service,qty,price,currency,price_eur,unit_price_eur_per_1k,product_name,url";
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = allRows
    .sort((a, b) => a.platform.localeCompare(b.platform) || a.service.localeCompare(b.service) || (a.qty || 0) - (b.qty || 0))
    .map((r) =>
      [r.competitor, r.platform, r.service, r.qty ?? "", r.price, r.currency, r.price_eur, r.unit_price_eur ?? "", esc(r.product_name), esc(r.url)].join(","),
    );
  const csvPath = join(outDir, `${date}.csv`);
  writeFileSync(csvPath, [header, ...lines].join("\n"), "utf8");
  console.log(`CSV written: ${csvPath} (${allRows.length} rows)`);

  console.log("\n— Summary —");
  for (const s of summary) {
    console.log(`  ${s.ok ? "✓" : "✗"} ${s.name.padEnd(20)} ${s.ok ? `${s.count} rows, ${s.known} classified` : s.error}`);
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
