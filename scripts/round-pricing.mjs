#!/usr/bin/env node
// Rounds all pricing rows so each currency column ends in a psychologically
// clean value.
//
//   EUR (NUMERIC(8,2)):  nearest of {.00, .50, .99}, tie-break to .99
//   Others (NUMERIC(8,1)): nearest of {.0, .5},      tie-break to .5
//
// If the nearest allowed value would be 0 but the source price is > 0, we
// fall back to the next non-zero candidate to avoid making products free.
//
// Usage:
//   node --env-file=.env.local scripts/round-pricing.mjs           # dry-run
//   node --env-file=.env.local scripts/round-pricing.mjs --apply   # commit

import { neon } from "@neondatabase/serverless";

const APPLY = process.argv.includes("--apply");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set (check .env.local)");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const EUR_COLUMN = "price";
const NON_EUR_COLUMNS = [
  "price_usd",
  "price_gbp",
  "price_brl",
  "price_try",
  "price_cad",
  "price_nzd",
  "price_aud",
  "price_chf",
  "price_mxn",
  "price_sek",
];

// Round to the nearest of allowedEndings (list of fractional parts).
// Ties are broken by preferTieBreak (a fractional part in allowedEndings).
// Allowed values are [E + e] for each ending e and each integer E, plus
// (E+1) + 0 to handle "round up to next integer" cleanly.
function roundToAllowed(price, allowedEndings, preferTieBreak) {
  if (!Number.isFinite(price) || price <= 0) return price;

  const E = Math.floor(price);
  const C = price - E;

  // Candidate set: E + each ending, plus the "next integer" (E+1 + 0).
  const candidates = allowedEndings.map((e) => ({ value: E + e, ending: e }));
  candidates.push({ value: E + 1, ending: 0 });

  // Compute distances and pick the nearest. On tie, prefer the candidate
  // whose ending matches preferTieBreak.
  let best = candidates[0];
  let bestDist = Math.abs(price - best.value);
  for (const c of candidates.slice(1)) {
    const d = Math.abs(price - c.value);
    if (d < bestDist - 1e-9) {
      best = c;
      bestDist = d;
    } else if (Math.abs(d - bestDist) < 1e-9) {
      if (c.ending === preferTieBreak && best.ending !== preferTieBreak) {
        best = c;
      }
    }
  }

  // Never round a positive price down to 0. Pick the next non-zero candidate.
  if (best.value === 0 && price > 0) {
    const nonZero = candidates
      .filter((c) => c.value > 0)
      .sort((a, b) => Math.abs(price - a.value) - Math.abs(price - b.value))[0];
    if (nonZero) best = nonZero;
  }

  return Math.round(best.value * 100) / 100;
}

function roundEur(p) {
  return roundToAllowed(p, [0, 0.5, 0.99], 0.99);
}

function roundOther(p) {
  // NUMERIC(8,1) — only .0 or .5 are storable.
  return Math.round(roundToAllowed(p, [0, 0.5], 0.5) * 10) / 10;
}

async function main() {
  const rows = await sql`
    SELECT id, service, qty, active,
           price, price_usd, price_gbp, price_brl, price_try,
           price_cad, price_nzd, price_aud, price_chf, price_mxn, price_sek
    FROM pricing
    ORDER BY service, qty, id
  `;

  console.log(`Loaded ${rows.length} pricing rows.\n`);

  const changes = [];

  for (const row of rows) {
    const rowChanges = {};

    const oldEur = Number(row[EUR_COLUMN]);
    const newEur = roundEur(oldEur);
    if (Math.abs(oldEur - newEur) > 1e-9) rowChanges[EUR_COLUMN] = { from: oldEur, to: newEur };

    for (const col of NON_EUR_COLUMNS) {
      const oldVal = Number(row[col]);
      if (oldVal <= 0) continue; // skip unset/zero
      const newVal = roundOther(oldVal);
      if (Math.abs(oldVal - newVal) > 1e-9) rowChanges[col] = { from: oldVal, to: newVal };
    }

    if (Object.keys(rowChanges).length > 0) {
      changes.push({ id: row.id, service: row.service, qty: row.qty, active: row.active, rowChanges });
    }
  }

  if (changes.length === 0) {
    console.log("Nothing to change — all prices already conform.");
    return;
  }

  console.log(`${changes.length} row(s) will change:\n`);
  for (const c of changes) {
    const tag = c.active ? "" : " (inactive)";
    console.log(`#${c.id}  ${c.service}  qty=${c.qty}${tag}`);
    for (const [col, diff] of Object.entries(c.rowChanges)) {
      console.log(`    ${col.padEnd(11)}  ${String(diff.from).padStart(8)}  ->  ${diff.to}`);
    }
  }

  if (!APPLY) {
    console.log(`\nDry-run: no changes written. Re-run with --apply to commit.`);
    return;
  }

  console.log(`\nApplying ${changes.length} update(s)...`);
  let applied = 0;
  for (const c of changes) {
    // Build a single UPDATE per row covering all changed columns. Neon's
    // tagged-template SQL helper can't interpolate column names, so we
    // dispatch a small set of pre-shaped statements keyed on the column.
    for (const [col, diff] of Object.entries(c.rowChanges)) {
      const newVal = diff.to;
      switch (col) {
        case "price":      await sql`UPDATE pricing SET price      = ${newVal} WHERE id = ${c.id}`; break;
        case "price_usd":  await sql`UPDATE pricing SET price_usd  = ${newVal} WHERE id = ${c.id}`; break;
        case "price_gbp":  await sql`UPDATE pricing SET price_gbp  = ${newVal} WHERE id = ${c.id}`; break;
        case "price_brl":  await sql`UPDATE pricing SET price_brl  = ${newVal} WHERE id = ${c.id}`; break;
        case "price_try":  await sql`UPDATE pricing SET price_try  = ${newVal} WHERE id = ${c.id}`; break;
        case "price_cad":  await sql`UPDATE pricing SET price_cad  = ${newVal} WHERE id = ${c.id}`; break;
        case "price_nzd":  await sql`UPDATE pricing SET price_nzd  = ${newVal} WHERE id = ${c.id}`; break;
        case "price_aud":  await sql`UPDATE pricing SET price_aud  = ${newVal} WHERE id = ${c.id}`; break;
        case "price_chf":  await sql`UPDATE pricing SET price_chf  = ${newVal} WHERE id = ${c.id}`; break;
        case "price_mxn":  await sql`UPDATE pricing SET price_mxn  = ${newVal} WHERE id = ${c.id}`; break;
        case "price_sek":  await sql`UPDATE pricing SET price_sek  = ${newVal} WHERE id = ${c.id}`; break;
        default: throw new Error(`unexpected column ${col}`);
      }
      applied += 1;
    }
  }
  console.log(`Done. ${applied} column update(s) applied across ${changes.length} row(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
