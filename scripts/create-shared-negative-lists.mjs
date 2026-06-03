/**
 * Creates 4 shared NEGATIVE keyword lists (fr / es / it / en) and attaches them
 * at CAMPAIGN level:
 *   fr → [FR] + [CH]   ·   es → [ES]   ·   it → [IT]   ·   en → [UK] + [US]
 *
 * Goal: give the thin UK/US ad groups (6 negatives each) the full negative
 * protection, and create ONE source of truth per language instead of ~58
 * diverging per-ad-group copies.
 *
 * SAFETY — a campaign-level negative hits EVERY ad group in the campaign, so it
 * must never block a positive of another product (e.g. "vues" would block the
 * YouTube ad group's "acheter vues youtube"). Each candidate negative is
 * therefore dropped if it conflicts with ANY positive in the campaign group:
 *   - BROAD/PHRASE: dropped if all its words appear in some positive
 *   - EXACT: dropped if it equals a positive
 * Positives from "Commercial" catch-all ad groups are EXCLUDED from this guard
 * (that grab-bag is slated for deletion and would otherwise gut the list).
 *
 * Idempotent: reuses a list with the same name, only adds missing members, only
 * attaches to campaigns not already linked.
 *
 * Usage:
 *   node scripts/create-shared-negative-lists.mjs          # dry-run
 *   node scripts/create-shared-negative-lists.mjs --live   # execute
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

const LIVE = process.argv.includes("--live");
const CUSTOMER_ID = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");

const { GoogleAdsApi, enums } = await import("google-ads-api");
const customer = new GoogleAdsApi({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
}).Customer({
  customer_id: CUSTOMER_ID,
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, ""),
});

const MT_NUM = { EXACT: 2, PHRASE: 3, BROAD: 4 };
const MT_NAME = { 2: "EXACT", 3: "PHRASE", 4: "BROAD" };
const MT_ENUM = { 2: enums.KeywordMatchType.EXACT, 3: enums.KeywordMatchType.PHRASE, 4: enums.KeywordMatchType.BROAD };

const LANGS = {
  fr: { name: "Fanovera Negatives — FR", camps: { FR: 23844165759, CH: 23882783997 } },
  es: { name: "Fanovera Negatives — ES", camps: { ES: 23899357675 } },
  it: { name: "Fanovera Negatives — IT", camps: { IT: 23899365073 } },
  en: { name: "Fanovera Negatives — EN", camps: { UK: 23844174192, US: 23883852621 } },
};

const tok = (s) => s.toLowerCase().split(/\s+/).filter(Boolean);

// ── Gather positives (excl. Commercial) + candidate negatives per campaign ───
async function gather(campIds) {
  const positives = []; // strings (lowercased)
  const negMap = new Map(); // lowerText -> max match-type num
  for (const id of campIds) {
    const rows = await customer.query(`
      SELECT ad_group.name, ad_group_criterion.negative,
             ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
      FROM ad_group_criterion
      WHERE campaign.id = ${id} AND ad_group_criterion.type = 'KEYWORD'
        AND ad_group_criterion.status != 'REMOVED' AND ad_group.status != 'REMOVED'
    `);
    for (const r of rows) {
      const c = r.ad_group_criterion;
      const text = c.keyword.text;
      if (c.negative) {
        const lt = text.toLowerCase();
        const mt = c.keyword.match_type;
        negMap.set(lt, Math.max(negMap.get(lt) || 0, mt));
      } else if (r.ad_group.name !== "Commercial") {
        positives.push(text.toLowerCase());
      }
    }
  }
  return { positives: [...new Set(positives)], negMap };
}

function filterNegatives(negMap, positives) {
  const posExact = new Set(positives);
  const posSets = positives.map((p) => new Set(tok(p)));
  const kept = [], dropped = [];
  for (const [text, mt] of negMap) {
    let conflict;
    if (mt === MT_NUM.EXACT) conflict = posExact.has(text);
    else { const w = tok(text); conflict = posSets.some((ps) => w.every((x) => ps.has(x))); }
    (conflict ? dropped : kept).push({ text, mt });
  }
  kept.sort((a, b) => a.text.localeCompare(b.text));
  return { kept, dropped };
}

// ── Look up existing shared sets / members / attachments ─────────────────────
const existingSets = await customer.query(`
  SELECT shared_set.id, shared_set.resource_name, shared_set.name, shared_set.type
  FROM shared_set WHERE shared_set.status != 'REMOVED'
`);
function findSet(name) {
  const r = existingSets.find((s) => s.shared_set.name === name);
  return r ? r.shared_set : null;
}

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));

const PLAN = [];
for (const [lang, cfg] of Object.entries(LANGS)) {
  const campIds = Object.values(cfg.camps);
  const { positives, negMap } = await gather(campIds);
  const { kept, dropped } = filterNegatives(negMap, positives);
  PLAN.push({ lang, cfg, kept, dropped, posCount: positives.length });

  console.log(`\n[${lang.toUpperCase()}] "${cfg.name}" → ${Object.keys(cfg.camps).join(" + ")}`);
  console.log(`   positives guarded (excl. Commercial): ${positives.length}`);
  console.log(`   candidate negatives (union): ${negMap.size}`);
  console.log(`   ⛔ dropped (would block a positive): ${dropped.length}${dropped.length ? " → " + dropped.slice(0, 12).map((d) => d.text).join(", ") + (dropped.length > 12 ? " …" : "") : ""}`);
  console.log(`   ✓ final members: ${kept.length}`);
  console.log(`     sample: ${kept.slice(0, 18).map((k) => `${MT_NAME[k.mt]}:${k.text}`).join(" | ")} …`);
  const set = findSet(cfg.name);
  console.log(`   shared set: ${set ? `exists (${set.id})` : "will create"}`);
}

if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

console.log("\n" + "─".repeat(70) + "\nExecuting…");
for (const { lang, cfg, kept } of PLAN) {
  console.log(`\n[${lang.toUpperCase()}] ${cfg.name}`);
  // 1) shared set
  let set = findSet(cfg.name);
  let setResource;
  if (set) { setResource = set.resource_name; console.log(`  · reusing set ${set.id}`); }
  else {
    const res = await customer.sharedSets.create([{ name: cfg.name, type: enums.SharedSetType.NEGATIVE_KEYWORDS, status: enums.SharedSetStatus.ENABLED }]);
    setResource = res.results[0].resource_name;
    console.log(`  ✓ created set ${setResource.split("/").pop()}`);
  }
  const setId = setResource.split("/").pop();

  // 2) members (add missing only)
  const existingMembers = new Set((await customer.query(`
    SELECT shared_criterion.keyword.text, shared_criterion.keyword.match_type
    FROM shared_criterion WHERE shared_set.id = ${setId}
  `)).map((r) => `${r.shared_criterion.keyword.text.toLowerCase()}|${r.shared_criterion.keyword.match_type}`));
  const toAdd = kept.filter((k) => !existingMembers.has(`${k.text}|${k.mt}`));
  if (toAdd.length) {
    const ops = toAdd.map((k) => ({ shared_set: setResource, keyword: { text: k.text, match_type: MT_ENUM[k.mt] } }));
    for (let i = 0; i < ops.length; i += 1000) await customer.sharedCriteria.create(ops.slice(i, i + 1000));
    console.log(`  ✓ added ${toAdd.length} members (total ${existingMembers.size + toAdd.length})`);
  } else console.log(`  · members already up to date (${existingMembers.size})`);

  // 3) attach to campaigns (skip already-linked)
  for (const [code, cid] of Object.entries(cfg.camps)) {
    const linked = await customer.query(`
      SELECT campaign_shared_set.shared_set FROM campaign_shared_set
      WHERE campaign.id = ${cid} AND campaign_shared_set.status != 'REMOVED'
    `);
    if (linked.some((r) => r.campaign_shared_set.shared_set === setResource)) { console.log(`  · [${code}] already linked`); continue; }
    await customer.campaignSharedSets.create([{ campaign: `customers/${CUSTOMER_ID}/campaigns/${cid}`, shared_set: setResource }]);
    console.log(`  ✓ [${code}] linked`);
  }
}
console.log("\n✅ DONE. Shared negative lists created & attached.");
