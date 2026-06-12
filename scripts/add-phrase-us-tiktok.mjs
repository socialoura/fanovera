/**
 * Phrase-match + GROS lit de négatifs sur TikTok US (AG 202656122568).
 *
 * ⚠ Décision assumée par le propriétaire malgré la perf : TikTok US est à
 *    ROAS 0,23x (90j). Le phrase élargit la portée → risque de dépense accrue.
 *    Pour limiter la casse, on ouvre 2 phrase étroits + un lit de négatifs épais.
 *    Campagne US en PAUSE → 0 diffusion tant qu'elle n'est pas rallumée.
 *
 * Ordre : 1) négatifs (ceux qui manquent) puis 2) phrase.
 *
 * Garde-fous :
 *   - aucun négatif ne doit bloquer un phrase ajouté (test multi-niveau) ;
 *   - dédoublonnage contre ad-group + campagne + listes partagées EN ;
 *   - retry policy : phrase refusé = abandonné (jamais d'exemption forcée).
 *
 * Exclus volontairement (bloqueraient des acheteurs / du vendable) :
 *   real, cheap (positifs acheteur) · fake broad (on négative les verbes
 *   nettoyeur à la place) · how broad (→ négatifs phrase "how to ...") ·
 *   views, likes (autres services vendables).
 *
 *   node scripts/add-phrase-us-tiktok.mjs            # DRY-RUN
 *   node scripts/add-phrase-us-tiktok.mjs --apply    # écrit
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

const APPLY = process.argv.includes("--apply");
const CUSTOMER_ID = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, "");
const AG_ID = 202656122568;

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

const EXACT = enums.KeywordMatchType.EXACT;
const PHRASE = enums.KeywordMatchType.PHRASE;
const BROAD = enums.KeywordMatchType.BROAD;
const MT = { 2: "EXACT", 3: "PHRASE", 4: "BROAD" };

// Phrase à ajouter (base EXACT déjà présente sur l'AG).
const PHRASE_KW = ["buy tiktok followers", "buy followers tiktok"];

// Lit de négatifs. [texte, matchType, bucket]. Ajoutés seulement s'ils manquent.
const NEGATIVES = [
  // informatif / gratuit / outil
  ["free", BROAD, "informatif/gratuit"],
  ["hack", BROAD, "informatif/gratuit"],
  ["generator", BROAD, "informatif/gratuit"],
  ["tool", BROAD, "informatif/gratuit"],
  ["app", BROAD, "informatif/gratuit"],
  ["apps", BROAD, "informatif/gratuit"],
  ["tutorial", BROAD, "informatif/gratuit"],
  ["guide", BROAD, "informatif/gratuit"],
  ["trick", BROAD, "informatif/gratuit"],
  ["tips", BROAD, "informatif/gratuit"],
  // organique (gagner des abonnés sans acheter)
  ["grow", BROAD, "organique"],
  ["growing", BROAD, "organique"],
  ["growth", BROAD, "organique"],
  ["increase", BROAD, "organique"],
  ["gain", BROAD, "organique"],
  ["organic", BROAD, "organique"],
  ["organically", BROAD, "organique"],
  // intention "how to <organique>" sans toucher "how to buy"
  ["how to get", PHRASE, "how-to organique"],
  ["how to grow", PHRASE, "how-to organique"],
  ["how to gain", PHRASE, "how-to organique"],
  ["how to increase", PHRASE, "how-to organique"],
  ["how to get more", PHRASE, "how-to organique"],
  // nettoyage faux abonnés (laisse passer "buy fake ...")
  ["remove", BROAD, "nettoyage faux"],
  ["detect", BROAD, "nettoyage faux"],
  ["delete", BROAD, "nettoyage faux"],
  ["audit", BROAD, "nettoyage faux"],
  ["checker", BROAD, "nettoyage faux"],
  ["tracker", BROAD, "nettoyage faux"],
  ["counter", BROAD, "nettoyage faux"],
  // bas de gamme / non-acheteur
  ["test", BROAD, "non-acheteur"],
  ["meaning", BROAD, "non-acheteur"],
  ["bot", BROAD, "non-acheteur"],
];

const norm = (s) => (s || "").toLowerCase().replace(/[^\p{L}\p{N}\s$]/gu, " ").replace(/\s+/g, " ").trim();
const tok = (s) => norm(s).split(" ").filter(Boolean);
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
  const qSet = new Set(qW);
  return negW.length > 0 && negW.every((w) => qSet.has(w));
}

// ── État de l'AG ─────────────────────────────────────────────────────────────
const agRow = await customer.query(`SELECT ad_group.name, campaign.id, campaign.name FROM ad_group WHERE ad_group.id=${AG_ID}`);
if (!agRow.length) { console.log(`AG ${AG_ID} introuvable.`); process.exit(1); }
const CID = agRow[0].campaign.id;
console.log("\n" + "═".repeat(72));
console.log(`  ${APPLY ? "▶ APPLY" : "▶ DRY-RUN"} — ${agRow[0].campaign.name} › ${agRow[0].ad_group.name} (AG ${AG_ID})`);
console.log("═".repeat(72));

const crit = await customer.query(`
  SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.negative
  FROM ad_group_criterion WHERE ad_group.id=${AG_ID} AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.status!='REMOVED'`);
const hasExact = new Set(), hasPhrase = new Set();
const visibleNegs = [];
const haveNegKey = new Set(); // text|mt
for (const r of crit) {
  const c = r.ad_group_criterion, t = norm(c.keyword.text);
  if (c.negative) { visibleNegs.push({ text: c.keyword.text, mt: c.keyword.match_type, lvl: "ad-group" }); haveNegKey.add(`${t}|${c.keyword.match_type}`); }
  else if (c.keyword.match_type === EXACT) hasExact.add(t);
  else if (c.keyword.match_type === PHRASE) hasPhrase.add(t);
}
const campNeg = await customer.query(`SELECT campaign_criterion.keyword.text, campaign_criterion.keyword.match_type FROM campaign_criterion WHERE campaign.id=${CID} AND campaign_criterion.type='KEYWORD' AND campaign_criterion.negative=true`);
for (const r of campNeg) { visibleNegs.push({ text: r.campaign_criterion.keyword.text, mt: r.campaign_criterion.keyword.match_type, lvl: "campagne" }); haveNegKey.add(`${norm(r.campaign_criterion.keyword.text)}|${r.campaign_criterion.keyword.match_type}`); }
const sets = await customer.query(`SELECT shared_set.id, shared_set.name FROM campaign_shared_set WHERE campaign.id=${CID} AND campaign_shared_set.status!='REMOVED'`);
for (const s of sets) {
  const mem = await customer.query(`SELECT shared_criterion.keyword.text, shared_criterion.keyword.match_type FROM shared_criterion WHERE shared_set.id=${s.shared_set.id}`);
  for (const m of mem) { visibleNegs.push({ text: m.shared_criterion.keyword.text, mt: m.shared_criterion.keyword.match_type, lvl: `liste:${s.shared_set.name}` }); haveNegKey.add(`${norm(m.shared_criterion.keyword.text)}|${m.shared_criterion.keyword.match_type}`); }
}

// ── 1. Négatifs à ajouter (ceux qui manquent, tout niveau confondu) ──────────
const negToAdd = NEGATIVES.filter(([t, mt]) => !haveNegKey.has(`${norm(t)}|${mt}`) && !haveNegKey.has(`${norm(t)}|${BROAD}`));
const negHave = NEGATIVES.filter(([t, mt]) => haveNegKey.has(`${norm(t)}|${mt}`) || haveNegKey.has(`${norm(t)}|${BROAD}`));
console.log(`\n1) NÉGATIFS — ${negToAdd.length} à ajouter, ${negHave.length} déjà couverts`);
let bucket = "";
for (const [t, mt, b] of negToAdd) { if (b !== bucket) { console.log(`   — ${b} —`); bucket = b; } console.log(`     + [${MT[mt]}] "${t}"`); }
if (negHave.length) console.log(`   déjà couverts : ${negHave.map(([t]) => `"${t}"`).join(", ")}`);

// ── 2. Phrase à ajouter ──────────────────────────────────────────────────────
const phraseToAdd = [], notes = [];
for (const kw of PHRASE_KW) {
  const lk = norm(kw);
  if (hasPhrase.has(lk)) { notes.push(`"${kw}" (déjà là)`); continue; }
  if (!hasExact.has(lk)) { notes.push(`"${kw}" (⚠ pas de base EXACT)`); continue; }
  phraseToAdd.push(kw);
}
console.log(`\n2) PHRASE — ${phraseToAdd.length} à ajouter`);
for (const kw of phraseToAdd) console.log(`     + [PHRASE] "${kw}"  (base EXACT conservée)`);
if (notes.length) console.log(`   notes : ${notes.join("; ")}`);

// ── Garde-fou ────────────────────────────────────────────────────────────────
const allNegsAfter = visibleNegs.concat(negToAdd.map(([t, mt]) => ({ text: t, mt: mt === PHRASE ? 3 : 4, lvl: "nouveau" })));
let guardFail = false;
for (const kw of PHRASE_KW) {
  const blockers = allNegsAfter.filter((n) => blocks(n, kw));
  if (blockers.length) { guardFail = true; console.log(`\n   ⚠ BLOCAGE : "${kw}" bloqué par :`); for (const b of blockers) console.log(`        ← [${MT[b.mt]}] "${b.text}" (${b.lvl})`); }
}
if (!guardFail) console.log(`\n   ✓ garde-fou OK : aucun négatif ne bloque les phrase ajoutés.`);

if (!APPLY) {
  console.log(`\nDRY-RUN. ${negToAdd.length} négatif(s) + ${phraseToAdd.length} phrase. --apply pour écrire.`);
  if (guardFail) console.log(`⛔ Garde-fou en échec : corrige avant d'appliquer.`);
  process.exit(0);
}
if (guardFail) { console.log(`\n⛔ Application annulée : un négatif bloque un phrase.`); process.exit(1); }

// ── Exécution ────────────────────────────────────────────────────────────────
const agResource = `customers/${CUSTOMER_ID}/adGroups/${AG_ID}`;
if (negToAdd.length) {
  await customer.adGroupCriteria.create(negToAdd.map(([text, match_type]) => ({ ad_group: agResource, negative: true, keyword: { text, match_type } })));
  console.log(`\n✅ ${negToAdd.length} négatifs créés.`);
}
if (phraseToAdd.length) {
  let list = [...phraseToAdd]; const skipped = [];
  for (;;) {
    if (!list.length) break;
    const ops = list.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, keyword: { text, match_type: PHRASE } }));
    try { await customer.adGroupCriteria.create(ops); console.log(`✅ ${list.length} phrase créés.`); break; }
    catch (err) {
      const viol = (err?.errors || []).filter((e) => e?.error_code?.policy_violation_error != null && e?.trigger?.string_value).map((e) => e.trigger.string_value);
      if (!viol.length) throw err;
      for (const vt of viol) { if (!skipped.includes(vt)) skipped.push(vt); list = list.filter((t) => t !== vt); }
      console.log(`   ⚠ policy-rejected, retiré : ${viol.join(", ")}`);
    }
  }
  if (skipped.length) console.log(`   (${skipped.length} phrase abandonnés pour policy)`);
}
console.log(`\nFait. Campagne US en PAUSE → 0 diffusion tant que pas rallumée.`);
console.log(`Au rallumage : node scripts/analyze-ag-search-terms.mjs ${AG_ID} 21 en`);
