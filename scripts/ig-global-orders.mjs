/** Find which keyword / search context drove recent IG-promo orders. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, "..", ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const { neon } = await import("@neondatabase/serverless");
const sql = neon(env.DATABASE_URL);

// Checkout payloads with a gclid OR an IG-instagram utm_campaign, last 30 days.
const rows = await sql`
  SELECT created_at, gclid, utm_campaign, utm_source, utm_medium, keyword, match_type,
         country, plan, source_page
  FROM checkout_payloads
  WHERE created_at > now() - interval '35 days'
    AND (gclid <> '' OR utm_campaign ILIKE '%instagram%' OR source_page ILIKE '%instagram%')
  ORDER BY created_at DESC
  LIMIT 60
`;
console.log(`checkout_payloads w/ gclid or IG context (last 35d): ${rows.length}`);
for (const r of rows) {
  console.log(`  ${new Date(r.created_at).toISOString().slice(0,16)}  c=${r.country||'?'}  kw="${r.keyword||''}" [${r.match_type||''}]  camp="${r.utm_campaign||''}"  src=${r.utm_source||''}/${r.utm_medium||''}  page=${r.source_page||''}  gclid=${r.gclid?r.gclid.slice(0,12)+'…':''}`);
}
