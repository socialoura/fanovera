/**
 * AUDIT des négatifs [UK] Instagram (AG 199169172840) — read-only.
 * Vérifie qu'aucun négatif (ad-group + campagne + listes partagées) ne bloque
 * du trafic qui peut convertir. Teste contre 3 jeux de requêtes :
 *   (A) les keywords positifs de l'ad group  → un négatif qui les bloque = bug
 *   (B) les requêtes ayant réellement converti (search terms 90j, conv>0)
 *   (C) un panel de requêtes acheteur canoniques (stress-test)
 *
 * Sémantique négatifs (Google) :
 *   EXACT  : bloque si la requête == le négatif (à l'identique)
 *   PHRASE : bloque si les tokens du négatif forment une sous-séquence CONTIGUË
 *            et ordonnée dans la requête
 *   BROAD  : bloque si TOUS les tokens du négatif sont présents (ordre libre)
 *
 *   node scripts/audit-negatives-uk-ig.mjs
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

const AG_ID = 199169172840;
const MT = { 2: "EXACT", 3: "PHRASE", 4: "BROAD" };
const norm = (s) => (s || "").toLowerCase().replace(/[^\p{L}\p{N}\s$]/gu, " ").replace(/\s+/g, " ").trim();
const tok = (s) => norm(s).split(" ").filter(Boolean);

// contiguous ordered subsequence (for PHRASE negatives)
function contiguous(negW, qW) {
  if (negW.length === 0 || negW.length > qW.length) return false;
  for (let i = 0; i + negW.length <= qW.length; i++) {
    let ok = true;
    for (let j = 0; j < negW.length; j++) if (qW[i + j] !== negW[j]) { ok = false; break; }
    if (ok) return true;
  }
  return false;
}
function blocks(neg, query) {
  const qW = tok(query), negW = tok(neg.text);
  if (neg.mt === 2) return norm(neg.text) === norm(query);
  if (neg.mt === 3) return contiguous(negW, qW);
  const qSet = new Set(qW); // BROAD
  return negW.length > 0 && negW.every((w) => qSet.has(w));
}

// ── Collecte ────────────────────────────────────────────────────────────────
const campRow = await customer.query(`SELECT campaign.id, campaign.name FROM ad_group WHERE ad_group.id = ${AG_ID}`);
const CID = campRow[0].campaign.id;

const agCrit = await customer.query(`
  SELECT ad_group_criterion.negative, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
  FROM ad_group_criterion WHERE ad_group.id = ${AG_ID}
    AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.status!='REMOVED'`);
const positives = agCrit.filter((r) => !r.ad_group_criterion.negative).map((r) => r.ad_group_criterion.keyword.text);

const negs = [];
for (const r of agCrit.filter((r) => r.ad_group_criterion.negative))
  negs.push({ text: r.ad_group_criterion.keyword.text, mt: r.ad_group_criterion.keyword.match_type, lvl: "ad-group" });
const campNeg = await customer.query(`
  SELECT campaign_criterion.keyword.text, campaign_criterion.keyword.match_type
  FROM campaign_criterion WHERE campaign.id=${CID} AND campaign_criterion.type='KEYWORD' AND campaign_criterion.negative=true`);
for (const r of campNeg) negs.push({ text: r.campaign_criterion.keyword.text, mt: r.campaign_criterion.keyword.match_type, lvl: "campagne" });
const sets = await customer.query(`SELECT shared_set.id, shared_set.name FROM campaign_shared_set WHERE campaign.id=${CID} AND campaign_shared_set.status!='REMOVED'`);
for (const s of sets) {
  const mem = await customer.query(`SELECT shared_criterion.keyword.text, shared_criterion.keyword.match_type FROM shared_criterion WHERE shared_set.id=${s.shared_set.id}`);
  for (const m of mem) negs.push({ text: m.shared_criterion.keyword.text, mt: m.shared_criterion.keyword.match_type, lvl: `liste:${s.shared_set.name}` });
}

// converters réels (90j)
const today = new Date(); const from = new Date(today); from.setDate(from.getDate() - 90);
const f = (d) => d.toISOString().slice(0, 10);
const stRows = await customer.query(`
  SELECT search_term_view.search_term, metrics.conversions, metrics.conversions_value, metrics.cost_micros
  FROM search_term_view WHERE ad_group.id=${AG_ID} AND segments.date BETWEEN '${f(from)}' AND '${f(today)}'
    AND metrics.conversions > 0`);
const converters = stRows.map((r) => ({ q: r.search_term_view.search_term, conv: Number(r.metrics.conversions), val: Number(r.metrics.conversions_value) }));

// panel acheteur canonique
const BUY = ["buy", "get", "purchase", "pay for", "buying", "order"];
const QUAL = ["", "real ", "active ", "cheap ", "instant ", "real active ", "high quality ", "1000 ", "500 ", "100 "];
const NOUN = ["instagram followers", "ig followers", "insta followers", "followers instagram", "followers on instagram"];
const EXTRA = ["best site to buy instagram followers", "best place to buy ig followers", "cheapest instagram followers",
  "buy fake instagram followers", "buy bot instagram followers", "instagram followers for sale",
  "buy instagram followers paypal", "buy instagram followers cheap", "grow instagram followers",
  "increase instagram followers", "buy more instagram followers", "buy instagram followers for my account"];
const panel = new Set(EXTRA);
for (const b of BUY) for (const q of QUAL) for (const n of NOUN) panel.add(`${b} ${q}${n}`.replace(/\s+/g, " ").trim());

console.log(`\n${"═".repeat(74)}`);
console.log(`  AUDIT NÉGATIFS — ${campRow[0].campaign.name} › Instagram`);
console.log(`  ${negs.length} négatifs (ad-group + campagne + listes) · ${positives.length} positifs`);
console.log(`${"═".repeat(74)}`);

function report(title, queries, meta) {
  const hits = [];
  for (const item of queries) {
    const q = typeof item === "string" ? item : item.q;
    const blockers = negs.filter((n) => blocks(n, q));
    if (blockers.length) hits.push({ q, item, blockers });
  }
  console.log(`\n${"─".repeat(74)}\n  ${title} — ${hits.length}/${queries.length} bloqués`);
  console.log(`${"─".repeat(74)}`);
  if (!hits.length) { console.log("  ✓ rien de bloqué"); return hits; }
  for (const h of hits) {
    const m = meta ? meta(h.item) : "";
    console.log(`  ⛔ "${h.q}"${m}`);
    for (const b of h.blockers) console.log(`        ← [${MT[b.mt]}] "${b.text}" (${b.lvl})`);
  }
  return hits;
}

// (A) positifs bloqués par un négatif = bug net (tu paies un kw qui ne sert jamais)
report("(A) KEYWORDS POSITIFS bloqués par un négatif", positives);

// (B) converters réels qui seraient bloqués = perte directe
report("(B) REQUÊTES AYANT CONVERTI, désormais bloquées", converters,
  (i) => `  [${i.conv} conv, ${i.val.toFixed(2)}€]`);

// (C) panel acheteur
report("(C) PANEL ACHETEUR canonique bloqué", [...panel]);
