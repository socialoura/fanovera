/**
 * Correctifs négatifs [UK] Instagram (AG 199169172840) suite à l'audit.
 *
 * A) Campagne UK — RETIRER les négatifs broad qui bloquent du trafic acheteur
 *    (dont 4 qui bloquent des keywords positifs de l'ad group) :
 *      cheap · buying · cheapest · best site · best place
 * B) Campagne UK — RETIRER 2 keywords POSITIFS morts (bloqués par grow/increase,
 *    intention organique/info, jamais convertis) : on garde les négatifs grow/increase.
 *      grow instagram followers · increase instagram followers
 * C) Test "fake" (mirroir TikTok FR) — RETIRER le mot, AJOUTER les verbes nettoyeur :
 *      retire   : "fake" (campagne UK + liste partagée EN), "fake followers" (liste EN)
 *      ajoute   : remove · detect · delete · audit  (broad, liste partagée EN)
 *    → "buy fake instagram followers" passe ; "remove/detect fake followers" reste bloqué.
 *    NB : "bot" volontairement CONSERVÉ (retirer ouvrirait trop de junk outil/app).
 *
 * Tout est réversible. Niveau campagne = scope UK. Liste partagée EN = toutes les
 * campagnes EN (actuellement toutes en pause sauf FR).
 *
 *   node scripts/fix-uk-ig-negatives.mjs            # DRY-RUN
 *   node scripts/fix-uk-ig-negatives.mjs --apply    # écrit
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
const AG_ID = 199169172840;
const SHARED_LIST = "Fanovera Negatives — EN";

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
const BROAD = enums.KeywordMatchType.BROAD;
const norm = (s) => (s || "").toLowerCase().trim();

const campRow = await customer.query(`SELECT campaign.id, campaign.name FROM ad_group WHERE ad_group.id = ${AG_ID}`);
const CID = campRow[0].campaign.id;

// Cibles
const CAMP_NEG_REMOVE = new Set(["cheap", "buying", "cheapest", "best site", "best place", "fake"]);
const SHARED_REMOVE = new Set(["fake", "fake followers"]);
const POS_REMOVE = new Set(["grow instagram followers", "increase instagram followers"]);
const SHARED_ADD_VERBS = ["remove", "detect", "delete", "audit"];

// ── Résolution des resource_names ───────────────────────────────────────────
const campNeg = await customer.query(`
  SELECT campaign_criterion.resource_name, campaign_criterion.keyword.text, campaign_criterion.keyword.match_type
  FROM campaign_criterion WHERE campaign.id=${CID} AND campaign_criterion.type='KEYWORD' AND campaign_criterion.negative=true`);
const campToRemove = campNeg.filter((r) => CAMP_NEG_REMOVE.has(norm(r.campaign_criterion.keyword.text)))
  .map((r) => ({ text: r.campaign_criterion.keyword.text, rn: r.campaign_criterion.resource_name }));

const agCrit = await customer.query(`
  SELECT ad_group_criterion.resource_name, ad_group_criterion.keyword.text, ad_group_criterion.negative
  FROM ad_group_criterion WHERE ad_group.id=${AG_ID} AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.status!='REMOVED'`);
const posToRemove = agCrit.filter((r) => !r.ad_group_criterion.negative && POS_REMOVE.has(norm(r.ad_group_criterion.keyword.text)))
  .map((r) => ({ text: r.ad_group_criterion.keyword.text, rn: r.ad_group_criterion.resource_name }));

const setRow = await customer.query(`SELECT shared_set.id, shared_set.resource_name, shared_set.name FROM shared_set WHERE shared_set.name = '${SHARED_LIST}' AND shared_set.status != 'REMOVED'`);
if (!setRow.length) { console.log(`Liste partagée "${SHARED_LIST}" introuvable.`); process.exit(1); }
const SET_ID = setRow[0].shared_set.id;
const SET_RN = setRow[0].shared_set.resource_name;
const sharedMembers = await customer.query(`SELECT shared_criterion.resource_name, shared_criterion.keyword.text, shared_criterion.keyword.match_type FROM shared_criterion WHERE shared_set.id=${SET_ID}`);
const sharedToRemove = sharedMembers.filter((r) => SHARED_REMOVE.has(norm(r.shared_criterion.keyword.text)))
  .map((r) => ({ text: r.shared_criterion.keyword.text, rn: r.shared_criterion.resource_name }));
const sharedHave = new Set(sharedMembers.map((r) => norm(r.shared_criterion.keyword.text)));
const verbsToAdd = SHARED_ADD_VERBS.filter((v) => !sharedHave.has(v));

// ── Plan ────────────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(72));
console.log(`  ${APPLY ? "▶ APPLY" : "▶ DRY-RUN"} — Correctifs négatifs ${campRow[0].campaign.name} › Instagram`);
console.log("═".repeat(72));

console.log(`\nA+C) Négatifs campagne UK à RETIRER (${campToRemove.length}) :`);
for (const r of campToRemove) console.log(`   − [BROAD] "${r.text}"`);
console.log(`\nB) Keywords POSITIFS morts à RETIRER (${posToRemove.length}) :`);
for (const r of posToRemove) console.log(`   − "${r.text}"  (restera bloqué par le négatif grow/increase — c'est voulu)`);
console.log(`\nC) Liste partagée "${SHARED_LIST}" — RETIRER (${sharedToRemove.length}) :`);
for (const r of sharedToRemove) console.log(`   − [neg] "${r.text}"`);
console.log(`\nC) Liste partagée — AJOUTER verbes nettoyeur (${verbsToAdd.length}) :`);
for (const v of verbsToAdd) console.log(`   + [BROAD] "${v}"`);

console.log(`\nRésultat attendu :`);
console.log(`   ✅ PASSE  : cheap/buying followers, "best site/place to buy", "buy fake instagram followers"`);
console.log(`   ⛔ BLOQUÉ : "remove/detect/delete fake followers", + tout le junk bot (conservé)`);

if (!APPLY) {
  console.log(`\nDRY-RUN. --apply pour exécuter : retirer ${campToRemove.length}+${posToRemove.length}+${sharedToRemove.length}, ajouter ${verbsToAdd.length}.`);
  process.exit(0);
}

// ── Exécution ───────────────────────────────────────────────────────────────
if (campToRemove.length) { await customer.campaignCriteria.remove(campToRemove.map((r) => r.rn)); console.log(`\n✅ ${campToRemove.length} négatifs campagne retirés.`); }
if (posToRemove.length) { await customer.adGroupCriteria.remove(posToRemove.map((r) => r.rn)); console.log(`✅ ${posToRemove.length} positifs morts retirés.`); }
if (sharedToRemove.length) { await customer.sharedCriteria.remove(sharedToRemove.map((r) => r.rn)); console.log(`✅ ${sharedToRemove.length} négatifs liste partagée retirés.`); }
if (verbsToAdd.length) {
  await customer.sharedCriteria.create(verbsToAdd.map((text) => ({ shared_set: SET_RN, keyword: { text, match_type: BROAD } })));
  console.log(`✅ ${verbsToAdd.length} verbes nettoyeur ajoutés à la liste partagée.`);
}
console.log(`\nFait. Relance l'audit pour vérifier : node scripts/audit-negatives-uk-ig.mjs`);
