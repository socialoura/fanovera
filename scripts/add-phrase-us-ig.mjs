/**
 * Phrase-match sur Instagram US (AG 196207303199) — même logique que le test
 * TikTok FR, mais sur un canal RENTABLE et aujourd'hui 100% exact (couverture trop
 * étroite). Capture la longue traîne "buy <quantité> instagram followers",
 * "buy instagram followers cheap/real/fast", etc. que l'exact ne sert pas.
 *
 * Ordre :
 *   1) Pose les NÉGATIFS informatifs défensifs (ad-group) qui MANQUENT encore
 *      (beaucoup sont déjà dans la liste partagée "Fanovera Negatives — EN").
 *   2) Ajoute les keywords PHRASE (base EXACT déjà présente sur l'AG).
 *
 * Garde-fous :
 *   - teste TOUS les négatifs visibles (ad-group + campagne + listes partagées)
 *     pour qu'aucun ne bloque un phrase qu'on ajoute ;
 *   - n'ajoute un négatif que s'il n'existe pas déjà (anti-doublon liste partagée) ;
 *   - retry policy : un phrase refusé est abandonné (jamais d'exemption forcée).
 *
 * Whitehat : les keywords transactionnels (buy/real/cheap/quantités) sont OK côté
 * keyword ; c'est l'annonce qui doit rester strictement whitehat.
 *
 *   node scripts/add-phrase-us-ig.mjs            # DRY-RUN
 *   node scripts/add-phrase-us-ig.mjs --apply    # écrit
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
const AG_ID = 196207303199;

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

// Phrase à ajouter — les 2 plus gros termes acheteur (base EXACT déjà là).
const PHRASE_KW = ["buy instagram followers", "buy ig followers"];

// Négatifs informatifs défensifs (broad). Ajoutés seulement s'ils manquent.
// "review" EXCLU : double tranchant (acheteurs comparent "best site ... review").
// "how"   EXCLU : double tranchant (bloquerait "how to buy instagram followers",
//          un acheteur) et inutile vu l'étroitesse des phrase ajoutés.
// Les vrais co-occurrents junk (free/tutorial/generator/hack) sont déjà dans la
// liste partagée EN → on ne ré-ajoute rien, on vérifie juste la couverture.
const INFO_NEG = ["free", "tutorial", "generator", "hack"];

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
const agRow = await customer.query(`SELECT ad_group.name, ad_group.status, campaign.id, campaign.name FROM ad_group WHERE ad_group.id=${AG_ID}`);
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
for (const r of crit) {
  const c = r.ad_group_criterion, t = norm(c.keyword.text);
  if (c.negative) visibleNegs.push({ text: c.keyword.text, mt: c.keyword.match_type, lvl: "ad-group" });
  else if (c.keyword.match_type === EXACT) hasExact.add(t);
  else if (c.keyword.match_type === PHRASE) hasPhrase.add(t);
}
// négatifs campagne + listes partagées (visibles par l'AG)
const campNeg = await customer.query(`SELECT campaign_criterion.keyword.text, campaign_criterion.keyword.match_type FROM campaign_criterion WHERE campaign.id=${CID} AND campaign_criterion.type='KEYWORD' AND campaign_criterion.negative=true`);
for (const r of campNeg) visibleNegs.push({ text: r.campaign_criterion.keyword.text, mt: r.campaign_criterion.keyword.match_type, lvl: "campagne" });
const sets = await customer.query(`SELECT shared_set.id, shared_set.name FROM campaign_shared_set WHERE campaign.id=${CID} AND campaign_shared_set.status!='REMOVED'`);
for (const s of sets) {
  const mem = await customer.query(`SELECT shared_criterion.keyword.text, shared_criterion.keyword.match_type FROM shared_criterion WHERE shared_set.id=${s.shared_set.id}`);
  for (const m of mem) visibleNegs.push({ text: m.shared_criterion.keyword.text, mt: m.shared_criterion.keyword.match_type, lvl: `liste:${s.shared_set.name}` });
}
const negTexts = new Set(visibleNegs.map((n) => norm(n.text)));

// ── 1. Négatifs informatifs manquants ────────────────────────────────────────
const negToAdd = INFO_NEG.filter((t) => !negTexts.has(t));
const negHave = INFO_NEG.filter((t) => negTexts.has(t));
console.log(`\n1) NÉGATIFS informatifs (ad-group) — ${negToAdd.length} à ajouter, ${negHave.length} déjà couverts`);
for (const t of negToAdd) console.log(`     + [BROAD] "${t}"`);
if (negHave.length) console.log(`   déjà couverts (ad-group/campagne/liste) : ${negHave.map((t) => `"${t}"`).join(", ")}`);

// ── 2. Phrase à ajouter ──────────────────────────────────────────────────────
const phraseToAdd = [], notes = [];
for (const kw of PHRASE_KW) {
  const lk = norm(kw);
  if (hasPhrase.has(lk)) { notes.push(`"${kw}" (phrase déjà là)`); continue; }
  if (!hasExact.has(lk)) { notes.push(`"${kw}" (⚠ pas de base EXACT)`); continue; }
  phraseToAdd.push(kw);
}
console.log(`\n2) PHRASE — ${phraseToAdd.length} à ajouter`);
for (const kw of phraseToAdd) console.log(`     + [PHRASE] "${kw}"  (base EXACT conservée)`);
if (notes.length) console.log(`   notes : ${notes.join("; ")}`);

// ── Garde-fou : aucun négatif (incl. ceux qu'on ajoute) ne doit bloquer un phrase
const allNegsAfter = visibleNegs.concat(negToAdd.map((t) => ({ text: t, mt: 4, lvl: "ad-group(nouveau)" })));
let guardFail = false;
for (const kw of PHRASE_KW) {
  const blockers = allNegsAfter.filter((n) => blocks(n, kw));
  if (blockers.length) {
    guardFail = true;
    console.log(`\n   ⚠ BLOCAGE : le phrase "${kw}" serait bloqué par :`);
    for (const b of blockers) console.log(`        ← [${MT[b.mt]}] "${b.text}" (${b.lvl})`);
  }
}
if (!guardFail) console.log(`\n   ✓ garde-fou OK : aucun négatif ne bloque les phrase ajoutés.`);

if (!APPLY) {
  console.log(`\nDRY-RUN. ${negToAdd.length} négatif(s) + ${phraseToAdd.length} phrase. --apply pour écrire.`);
  if (guardFail) console.log(`⛔ Garde-fou en échec : corrige avant d'appliquer.`);
  process.exit(0);
}
if (guardFail) { console.log(`\n⛔ Application annulée : un négatif bloque un phrase. Corrige d'abord.`); process.exit(1); }

// ── Exécution : négatifs d'abord, phrase ensuite ─────────────────────────────
const agResource = `customers/${CUSTOMER_ID}/adGroups/${AG_ID}`;
if (negToAdd.length) {
  await customer.adGroupCriteria.create(negToAdd.map((text) => ({ ad_group: agResource, negative: true, keyword: { text, match_type: BROAD } })));
  console.log(`\n✅ ${negToAdd.length} négatifs informatifs créés.`);
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
  if (skipped.length) console.log(`   (${skipped.length} phrase abandonnés pour policy — jamais d'exemption forcée)`);
}
console.log(`\nFait. La campagne US est en PAUSE → 0 diffusion tant qu'elle n'est pas rallumée.`);
console.log(`Au rallumage, surveiller les search terms : node scripts/analyze-ag-search-terms.mjs ${AG_ID} 21 en`);
