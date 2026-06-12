/**
 * Affine les négatifs "faux/fake" sur Tiktok FR (AG 195535404423).
 *
 * Problème : le négatif broad "faux" (et "fake") bloque le mot où qu'il soit —
 * y compris l'ACHETEUR "acheter faux followers tiktok", qui est un vrai client.
 *
 * Principe : ce n'est pas le mot "faux" qui trahit l'intention, c'est le VERBE.
 *   • Acheteur  → acheter / achat / payer  ➜ on veut le garder
 *   • Nettoyeur → repérer / détecter / supprimer / enlever / reconnaître / nettoyer
 *                 ➜ jamais un client : on bloque le verbe (broad), quel que soit
 *                   le reste de la requête.
 * "comment repérer les faux abonnés" reste de toute façon bloqué par le négatif
 * "comment" déjà en place — double couverture.
 *
 * Actions :
 *   1) RETIRE les négatifs broad "faux" et "fake".
 *   2) AJOUTE les verbes nettoyeur en négatif broad (accentués + non accentués,
 *      Google ne normalise pas les accents pour les négatifs).
 *
 * Usage :
 *   node scripts/tiktok-fr-refine-faux.mjs            # DRY-RUN
 *   node scripts/tiktok-fr-refine-faux.mjs --apply    # écrit
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

const BROAD = enums.KeywordMatchType.BROAD; // 4

// Négatifs broad à retirer (mot seul → bloque l'acheteur).
const REMOVE_TEXTS = new Set(["faux", "fake"]);

// Verbes "nettoyeur / détection" — jamais un acheteur. Accentués + variantes.
const ADD_VERBS = [
  "repérer", "reperer",
  "détecter", "detecter",
  "supprimer",
  "enlever",
  "reconnaître", "reconnaitre",
  "nettoyer",
];

console.log("\n" + "═".repeat(70));
console.log(`  ${APPLY ? "▶ APPLY" : "▶ DRY-RUN"} — Tiktok FR : affiner faux/fake`);
console.log("═".repeat(70));

// État actuel des négatifs.
const negRows = await customer.query(`
  SELECT ad_group_criterion.resource_name, ad_group_criterion.keyword.text,
         ad_group_criterion.keyword.match_type
  FROM ad_group_criterion
  WHERE ad_group.id = ${AG_ID} AND ad_group_criterion.type = 'KEYWORD'
    AND ad_group_criterion.negative = true AND ad_group_criterion.status != 'REMOVED'
`);
const haveNeg = new Set(negRows.map((r) => `${(r.ad_group_criterion.keyword.text || "").toLowerCase()}|${r.ad_group_criterion.keyword.match_type}`));

// 1) à retirer
const toRemove = negRows
  .filter((r) => REMOVE_TEXTS.has((r.ad_group_criterion.keyword.text || "").toLowerCase()) && r.ad_group_criterion.keyword.match_type === BROAD)
  .map((r) => ({ text: r.ad_group_criterion.keyword.text, rn: r.ad_group_criterion.resource_name }));

console.log(`\n1) RETIRER (${toRemove.length}) — débloquent l'acheteur "acheter faux/fake followers" :`);
for (const r of toRemove) console.log(`     − [BROAD] "${r.text}"`);

// 2) à ajouter
const addToAdd = ADD_VERBS.filter((t) => !haveNeg.has(`${t}|${BROAD}`));
const addDup = ADD_VERBS.filter((t) => haveNeg.has(`${t}|${BROAD}`));

console.log(`\n2) AJOUTER verbes nettoyeur (${addToAdd.length} nouveaux, ${addDup.length} déjà là) :`);
for (const t of addToAdd) console.log(`     + [BROAD] "${t}"`);
if (addDup.length) console.log(`   déjà là : ${addDup.map((t) => `"${t}"`).join(", ")}`);

console.log(`\nRésultat attendu :`);
console.log(`   ✅ PASSE  : "acheter faux followers tiktok", "achat faux abonnés tiktok"`);
console.log(`   ⛔ BLOQUÉ : "repérer les faux abonnés", "supprimer faux followers",`);
console.log(`              "comment détecter faux abonnés" (aussi via "comment")`);

if (!APPLY) {
  console.log(`\nDRY-RUN. Relancer avec --apply (retirer ${toRemove.length}, ajouter ${addToAdd.length}).`);
  process.exit(0);
}

if (toRemove.length) {
  await customer.adGroupCriteria.remove(toRemove.map((r) => r.rn));
  console.log(`\n✅ ${toRemove.length} négatifs retirés.`);
}
if (addToAdd.length) {
  const ops = addToAdd.map((text) => ({
    ad_group: `customers/${CUSTOMER_ID}/adGroups/${AG_ID}`,
    negative: true, keyword: { text, match_type: BROAD },
  }));
  const res = await customer.adGroupCriteria.create(ops);
  console.log(`✅ ${res.results?.length ?? ops.length} verbes nettoyeur ajoutés.`);
}
console.log(`\nFait. "faux/fake" acheteur débloqué, intention nettoyeur bloquée.`);
