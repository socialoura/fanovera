/**
 * Phrase-match TEST sur Tiktok FR (AG 195535404423) — capture la longue traîne
 * "acheter <quantité> followers tiktok", "acheter followers tiktok pas cher", etc.
 * que l'exact match ne sert pas.
 *
 * Fait 2 choses, dans l'ordre :
 *   1) Pose les NÉGATIFS défensifs (ad-group level) AVANT d'ouvrir le phrase,
 *      pour qu'aucun clic informatif ne passe dès le départ.
 *   2) Ajoute 2 keywords PHRASE (base EXACT déjà présente) :
 *        "acheter followers tiktok"  /  "acheter abonnés tiktok"
 *      L'exact gagne les requêtes exactes ; le phrase capture les variantes.
 *
 * Négatifs (broad, bloquent le mot où qu'il soit dans la requête) :
 *   informatif / mauvais intent :
 *     comment · gratuit · gratuitement · gratis · avis · tuto · tutoriel
 *   double tranchant (peut bloquer un vrai acheteur "acheter faux followers") :
 *     faux · fake        ← à surveiller, retirables si ça bloque un converter
 *
 * Les négatifs ne RESTREIGNENT que le trafic — ils ne peuvent pas déclencher
 * de strike. Le phrase, lui, est un entonnoir de découverte : surveiller les
 * search terms (analyze-tiktok-fr-search-terms.mjs) sous 2-3 semaines, récolter
 * les converters en EXACT, pousser le reste en négatif.
 *
 * Usage :
 *   node scripts/tiktok-fr-phrase-test.mjs            # DRY-RUN (plan only)
 *   node scripts/tiktok-fr-phrase-test.mjs --apply    # écrit les mutations
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
const AG_ID = 195535404423;

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

const EXACT = enums.KeywordMatchType.EXACT;   // 2
const PHRASE = enums.KeywordMatchType.PHRASE; // 3
const BROAD = enums.KeywordMatchType.BROAD;   // 4
const MTNAME = { [EXACT]: "EXACT", [PHRASE]: "PHRASE", [BROAD]: "BROAD" };

// Keywords phrase à ajouter (la base EXACT doit déjà exister sur l'AG).
const PHRASE_KW = ["acheter followers tiktok", "acheter abonnés tiktok"];

// Négatifs broad (texte en minuscules). bucket = libellé d'affichage.
const NEGATIVES = [
  ["comment", BROAD, "informatif"],
  ["gratuit", BROAD, "informatif"],
  ["gratuitement", BROAD, "informatif"],
  ["gratis", BROAD, "informatif"],
  ["avis", BROAD, "informatif"],
  ["tuto", BROAD, "informatif"],
  ["tutoriel", BROAD, "informatif"],
  ["faux", BROAD, "double-tranchant"],
  ["fake", BROAD, "double-tranchant"],
];

const tok = (s) => s.toLowerCase().split(/\s+/).filter(Boolean);

// ── État actuel de l'AG ────────────────────────────────────────────────────
const agRow = await customer.query(`
  SELECT ad_group.id, ad_group.name, ad_group.status, campaign.id, campaign.name
  FROM ad_group WHERE ad_group.id = ${AG_ID}
`);
if (!agRow.length) { console.log(`AG ${AG_ID} introuvable.`); process.exit(1); }
const CAMP_ID = agRow[0].campaign.id;
console.log("\n" + "═".repeat(70));
console.log(`  ${APPLY ? "▶ APPLY" : "▶ DRY-RUN"} — ${agRow[0].campaign.name} › ${agRow[0].ad_group.name} (AG ${AG_ID})`);
console.log("═".repeat(70));

const crit = await customer.query(`
  SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
         ad_group_criterion.negative
  FROM ad_group_criterion
  WHERE ad_group.id = ${AG_ID} AND ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.status != 'REMOVED'
`);
const hasExact = new Set();
const hasPhrase = new Set();
const haveNeg = new Set();
for (const r of crit) {
  const c = r.ad_group_criterion;
  const t = (c.keyword.text || "").toLowerCase();
  if (c.negative) haveNeg.add(`${t}|${c.keyword.match_type}`);
  else if (c.keyword.match_type === EXACT) hasExact.add(t);
  else if (c.keyword.match_type === PHRASE) hasPhrase.add(t);
}

// ── 1. Plan négatifs ────────────────────────────────────────────────────────
const negToAdd = NEGATIVES.filter(([t, mt]) => !haveNeg.has(`${t}|${mt}`));
const negDup = NEGATIVES.filter(([t, mt]) => haveNeg.has(`${t}|${mt}`));

console.log(`\n1) NÉGATIFS (ad-group level) — ${negToAdd.length} à ajouter, ${negDup.length} déjà présents`);
let bucket = "";
for (const [t, mt, b] of negToAdd) {
  if (b !== bucket) { console.log(`   — ${b} —`); bucket = b; }
  console.log(`     + [${MTNAME[mt]}] "${t}"`);
}
if (negDup.length) console.log(`   déjà là : ${negDup.map(([t]) => `"${t}"`).join(", ")}`);

// Garde-fou : un négatif ne doit bloquer aucun phrase qu'on ajoute.
const negWords = new Set(negToAdd.concat(negDup).map(([t]) => t));
for (const kw of PHRASE_KW) {
  const hit = tok(kw).find((w) => negWords.has(w));
  if (hit) console.log(`   ⚠ ATTENTION : le négatif "${hit}" bloquerait le phrase "${kw}" !`);
}

// ── 2. Plan phrase ──────────────────────────────────────────────────────────
const phraseToAdd = [];
const phraseNotes = [];
for (const kw of PHRASE_KW) {
  const lk = kw.toLowerCase();
  if (hasPhrase.has(lk)) { phraseNotes.push(`"${kw}" (phrase déjà là)`); continue; }
  if (!hasExact.has(lk)) { phraseNotes.push(`"${kw}" (⚠ pas de base EXACT)`); continue; }
  phraseToAdd.push(kw);
}
console.log(`\n2) PHRASE — ${phraseToAdd.length} à ajouter`);
for (const kw of phraseToAdd) console.log(`     + [PHRASE] "${kw}"  (base EXACT conservée)`);
if (phraseNotes.length) console.log(`   notes : ${phraseNotes.join("; ")}`);

if (!APPLY) {
  console.log(`\nDRY-RUN. Relancer avec --apply pour écrire (${negToAdd.length} négatifs + ${phraseToAdd.length} phrase).`);
  process.exit(0);
}

// ── Exécution : négatifs d'abord, phrase ensuite ───────────────────────────
const agResource = `customers/${CUSTOMER_ID}/adGroups/${AG_ID}`;

if (negToAdd.length) {
  const ops = negToAdd.map(([text, match_type]) => ({
    ad_group: agResource, negative: true, keyword: { text, match_type },
  }));
  const res = await customer.adGroupCriteria.create(ops);
  console.log(`\n✅ ${res.results?.length ?? ops.length} négatifs créés.`);
}

if (phraseToAdd.length) {
  let list = [...phraseToAdd]; const skipped = [];
  for (;;) {
    if (!list.length) break;
    const ops = list.map((text) => ({
      ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED,
      keyword: { text, match_type: PHRASE },
    }));
    try { await customer.adGroupCriteria.create(ops); console.log(`✅ ${list.length} phrase créés.`); break; }
    catch (err) {
      const viol = (err?.errors || [])
        .filter((e) => e?.error_code?.policy_violation_error != null && e?.trigger?.string_value)
        .map((e) => e.trigger.string_value);
      if (!viol.length) throw err;
      for (const vt of viol) { if (!skipped.includes(vt)) skipped.push(vt); list = list.filter((t) => t !== vt); }
      console.log(`   ⚠ policy-rejected, retiré : ${viol.join(", ")}`);
    }
  }
  if (skipped.length) console.log(`   (${skipped.length} phrase abandonnés pour policy — jamais d'exemption forcée)`);
}

console.log(`\nFait. Surveiller les search terms sous 2-3 semaines :`);
console.log(`   node scripts/analyze-tiktok-fr-search-terms.mjs 21`);
void CAMP_ID;
