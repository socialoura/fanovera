/**
 * Resync each app/<platform>/data.ts PACKS array from the live `pricing` DB
 * table. DB is source-of-truth for qty/price/popular; existing data.ts
 * fallback values for old/bonus are preserved when qty matches, otherwise
 * derived via the same formulas as runtime (useCurrencyPricing.ts).
 *
 * Dry-run by default (prints planned diffs). Use --write to apply.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync } from "node:fs";
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

const WRITE = process.argv.includes("--write");
const sql = neon(env.DATABASE_URL);

// Primary service per platform (from app/lib/productCatalog.ts)
const PRIMARY_SERVICE = {
  instagram: "ig_followers",
  tiktok: "tt_followers",
  youtube: "yt_views",
  spotify: "sp_streams",
  twitch: "tw_followers",
  facebook: "fb_likes",
  linkedin: "li_followers",
  twitter: "x_followers",
};

// Round a price to the .99/.49/.50 pattern used in the existing data.ts files.
function roundOld(price) {
  // Match the .99 ending pattern when price > 1, otherwise round to 2 decimals
  if (price >= 100) return Math.round(price - 0.01) + 0.99; // 999.99 style
  if (price >= 10) return Math.round(price - 0.01) + 0.99; // 79.99 style
  return Math.round(price * 100) / 100;
}

function derivedBonus(qty, fallbackPacks) {
  let nearest = null;
  for (const p of fallbackPacks) {
    if (!nearest || Math.abs(p.qty - qty) < Math.abs(nearest.qty - qty)) nearest = p;
  }
  if (nearest && nearest.qty > 0) {
    return Math.max(0, Math.round(qty * (nearest.bonus / nearest.qty)));
  }
  return Math.max(0, Math.round(qty * 0.2));
}

// Extract existing PACKS array entries from a data.ts file via regex.
// Each line looks like:  { qty: 100, price: 5.99, old: 14.99, bonus: 10, popular: true },
function parseExistingPacks(fileContent) {
  const arrayMatch = fileContent.match(/export const PACKS: Pack\[\] = \[([\s\S]*?)\];/);
  if (!arrayMatch) return null;
  const body = arrayMatch[1];
  const packs = [];
  const lineRe = /\{\s*qty:\s*(\d+),\s*price:\s*([\d.]+),\s*old:\s*([\d.]+),\s*bonus:\s*(\d+)(?:,\s*popular:\s*(true|false))?(?:,\s*best:\s*(true|false))?\s*\}/g;
  let m;
  while ((m = lineRe.exec(body)) !== null) {
    packs.push({
      qty: Number(m[1]),
      price: Number(m[2]),
      old: Number(m[3]),
      bonus: Number(m[4]),
      popular: m[5] === "true",
      best: m[6] === "true",
    });
  }
  return packs;
}

function formatPack(p) {
  const flags = [];
  if (p.popular) flags.push("popular: true");
  if (p.best) flags.push("best: true");
  const tail = flags.length ? `, ${flags.join(", ")}` : "";
  return `  { qty: ${p.qty}, price: ${p.price}, old: ${p.old}, bonus: ${p.bonus}${tail} },`;
}

console.log(WRITE ? "▶  WRITE mode — files will be modified" : "▶  DRY-RUN — no writes");
console.log("─".repeat(70));

let totalChanges = 0;

for (const [platform, service] of Object.entries(PRIMARY_SERVICE)) {
  const dbPacks = await sql`
    SELECT qty, price::float AS price, popular
    FROM pricing
    WHERE service = ${service} AND active = true
    ORDER BY qty
  `;

  const filePath = join(__dirname, "..", "app", platform, "data.ts");
  let content;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    console.log(`\n${platform.padEnd(10)} ⚠️  no data.ts file (${filePath})`);
    continue;
  }

  const existing = parseExistingPacks(content);
  if (!existing) {
    console.log(`\n${platform.padEnd(10)} ⚠️  could not parse PACKS array in ${filePath}`);
    continue;
  }
  const existingByQty = new Map(existing.map((p) => [p.qty, p]));
  const bestQty = existing.find((p) => p.best)?.qty ?? null;

  const newPacks = dbPacks.map((db) => {
    const matchedExisting = existingByQty.get(db.qty);
    if (matchedExisting) {
      return {
        qty: db.qty,
        price: db.price,
        old: matchedExisting.old,
        bonus: matchedExisting.bonus,
        popular: db.popular,
        best: matchedExisting.best,
      };
    }
    // New qty (in DB but not in current data.ts) — derive defaults
    const derivedOld = roundOld(db.price * 2.5);
    return {
      qty: db.qty,
      price: db.price,
      old: derivedOld,
      bonus: derivedBonus(db.qty, existing),
      popular: db.popular,
      best: false,
    };
  });

  // Preserve "best" flag on the closest still-present qty if its qty is gone
  if (bestQty !== null && !newPacks.some((p) => p.best)) {
    const closest = newPacks.reduce((acc, p) =>
      acc == null || Math.abs(p.qty - bestQty) < Math.abs(acc.qty - bestQty) ? p : acc,
    null);
    if (closest) closest.best = true;
  }

  // Build new array string
  const newArrayBody = newPacks.map(formatPack).join("\n");
  const newContent = content.replace(
    /(export const PACKS: Pack\[\] = \[)[\s\S]*?(\];)/,
    `$1\n${newArrayBody}\n$2`,
  );

  const changed = newContent !== content;
  // Diff summary
  console.log(`\n${platform.padEnd(10)}  service=${service}  ${dbPacks.length} DB packs  ${changed ? "● CHANGES" : "○ unchanged"}`);
  for (const newP of newPacks) {
    const old = existingByQty.get(newP.qty);
    if (!old) {
      console.log(`  + qty=${newP.qty.toString().padStart(7)}  €${newP.price.toFixed(2).padStart(8)}  (new, old=${newP.old}, bonus=${newP.bonus})`);
    } else if (old.price !== newP.price || old.popular !== newP.popular) {
      const priceTag = old.price !== newP.price ? `€${old.price.toFixed(2)} → €${newP.price.toFixed(2)}` : `€${newP.price.toFixed(2)}`;
      const popTag = old.popular !== newP.popular ? `popular: ${old.popular} → ${newP.popular}` : "";
      console.log(`  ~ qty=${newP.qty.toString().padStart(7)}  ${priceTag}  ${popTag}`);
    }
  }
  const removed = existing.filter((e) => !newPacks.some((n) => n.qty === e.qty));
  for (const r of removed) {
    console.log(`  - qty=${r.qty.toString().padStart(7)}  €${r.price.toFixed(2).padStart(8)}  (removed, not in DB)`);
  }

  if (changed) {
    totalChanges++;
    if (WRITE) {
      writeFileSync(filePath, newContent, "utf8");
      console.log(`    ✓ written ${filePath}`);
    }
  }
}

console.log("\n" + "─".repeat(70));
console.log(`${totalChanges} file(s) ${WRITE ? "modified" : "would be modified"}.`);
if (!WRITE && totalChanges > 0) console.log("Re-run with --write to apply.");
