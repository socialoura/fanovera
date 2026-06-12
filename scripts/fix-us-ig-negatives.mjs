/**
 * Copie sur [US] Fanovera les modifs keyword faites sur UK (cf. fix-uk-ig-negatives.mjs).
 *
 * Rappel : la liste partagée "Fanovera Negatives — EN" est DÉJÀ partagée par US
 * → le retrait de fake/fake followers + l'ajout des verbes remove/detect/delete/audit
 * s'appliquent déjà au US. Ce script ne touche donc QUE le niveau campagne + ad group.
 *
 * A) Campagne US — RETIRER les négatifs broad qui bloquent du trafic acheteur :
 *      cheap · buying · cheapest · best site · best place · fake   (ceux qui existent)
 * B) Ad group IG US — RETIRER les positifs morts grow/increase, MAIS uniquement
 *    s'ils sont réellement bloqués par un négatif US (même rationnel que UK). Sinon
 *    on les signale sans toucher (sur US ils pourraient être de la vraie couverture).
 *
 * Tout est réversible. Niveau campagne = scope US entier.
 *
 *   node scripts/fix-us-ig-negatives.mjs            # DRY-RUN
 *   node scripts/fix-us-ig-negatives.mjs --apply    # écrit
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

const MT = { 2: "EXACT", 3: "PHRASE", 4: "BROAD" };
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

const CAMP_NEG_REMOVE = new Set(["cheap", "buying", "cheapest", "best site", "best place", "fake"]);
const POS_REMOVE = new Set(["grow instagram followers", "increase instagram followers"]);

// ── Résolution campagne + ad group IG US ─────────────────────────────────────
const campRows = await customer.query(`SELECT campaign.id, campaign.name FROM campaign WHERE campaign.name LIKE '%Fanovera%' AND campaign.status != 'REMOVED'`);
const usCamp = campRows.find((r) => /\[US\]/.test(r.campaign.name));
if (!usCamp) { console.log("Campagne [US] Fanovera introuvable."); process.exit(1); }
const CID = usCamp.campaign.id;
const CNAME = usCamp.campaign.name;
const agRows = await customer.query(`SELECT ad_group.id, ad_group.name FROM ad_group WHERE campaign.id=${CID} AND ad_group.name = 'Instagram' AND ad_group.status != 'REMOVED'`);
if (!agRows.length) { console.log("Ad group Instagram US introuvable."); process.exit(1); }
const AG_ID = agRows[0].ad_group.id;

// ── Négatifs campagne US à retirer ───────────────────────────────────────────
const campNeg = await customer.query(`
  SELECT campaign_criterion.resource_name, campaign_criterion.keyword.text, campaign_criterion.keyword.match_type
  FROM campaign_criterion WHERE campaign.id=${CID} AND campaign_criterion.type='KEYWORD' AND campaign_criterion.negative=true`);
const campToRemove = campNeg.filter((r) => CAMP_NEG_REMOVE.has(norm(r.campaign_criterion.keyword.text)))
  .map((r) => ({ text: r.campaign_criterion.keyword.text, mt: r.campaign_criterion.keyword.match_type, rn: r.campaign_criterion.resource_name }));
const campMissing = [...CAMP_NEG_REMOVE].filter((t) => !campNeg.some((r) => norm(r.campaign_criterion.keyword.text) === t));

// ── Positifs morts IG US (uniquement si bloqués par un négatif US) ────────────
const agCrit = await customer.query(`
  SELECT ad_group_criterion.resource_name, ad_group_criterion.negative,
         ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type
  FROM ad_group_criterion WHERE ad_group.id=${AG_ID} AND ad_group_criterion.type='KEYWORD' AND ad_group_criterion.status!='REMOVED'`);
// négatifs visibles par cet ad group : ad-group + campagne (hors ceux qu'on s'apprête à retirer)
const removeRn = new Set(campToRemove.map((r) => r.rn));
const visibleNegs = [];
for (const r of agCrit.filter((r) => r.ad_group_criterion.negative))
  visibleNegs.push({ text: r.ad_group_criterion.keyword.text, mt: r.ad_group_criterion.keyword.match_type, lvl: "ad-group" });
for (const r of campNeg.filter((r) => !removeRn.has(r.campaign_criterion.resource_name)))
  visibleNegs.push({ text: r.campaign_criterion.keyword.text, mt: r.campaign_criterion.keyword.match_type, lvl: "campagne" });

const posCandidates = agCrit.filter((r) => !r.ad_group_criterion.negative && POS_REMOVE.has(norm(r.ad_group_criterion.keyword.text)))
  .map((r) => {
    const text = r.ad_group_criterion.keyword.text;
    const blocker = visibleNegs.find((n) => blocks(n, text));
    return { text, rn: r.ad_group_criterion.resource_name, blocker };
  });
const posToRemove = posCandidates.filter((p) => p.blocker);
const posKeepLive = posCandidates.filter((p) => !p.blocker);

// ── Plan ──────────────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(74));
console.log(`  ${APPLY ? "▶ APPLY" : "▶ DRY-RUN"} — Copie modifs keyword UK → ${CNAME} (IG AG ${AG_ID})`);
console.log("═".repeat(74));
console.log(`\n(liste partagée EN : déjà commune avec UK → fake/verbes déjà appliqués au US, rien à faire)`);

console.log(`\nA) Négatifs campagne US à RETIRER (${campToRemove.length}/${CAMP_NEG_REMOVE.size}) :`);
for (const r of campToRemove) console.log(`   − [${MT[r.mt]}] "${r.text}"`);
if (campMissing.length) console.log(`   (absents sur US, rien à retirer : ${campMissing.join(", ")})`);

console.log(`\nB) Positifs morts IG US à RETIRER (${posToRemove.length}) :`);
for (const p of posToRemove) console.log(`   − "${p.text}"  ← bloqué par [${MT[p.blocker.mt]}] "${p.blocker.text}" (${p.blocker.lvl})`);
if (posKeepLive.length) {
  console.log(`\n   ⚠ Positifs grow/increase présents mais NON bloqués sur US → on NE touche PAS (vraie couverture) :`);
  for (const p of posKeepLive) console.log(`     · "${p.text}"`);
}
if (!posCandidates.length) console.log(`   (aucun positif grow/increase sur IG US)`);

const nMut = campToRemove.length + posToRemove.length;
if (!APPLY) {
  console.log(`\nDRY-RUN. ${nMut} mutation(s) prévue(s). Relance avec --apply pour exécuter.`);
  process.exit(0);
}
if (!nMut) { console.log(`\nRien à appliquer.`); process.exit(0); }

if (campToRemove.length) { await customer.campaignCriteria.remove(campToRemove.map((r) => r.rn)); console.log(`\n✅ ${campToRemove.length} négatifs campagne retirés.`); }
if (posToRemove.length) { await customer.adGroupCriteria.remove(posToRemove.map((p) => p.rn)); console.log(`✅ ${posToRemove.length} positifs morts retirés.`); }
console.log(`\nFait. Audit conseillé : adapter audit-negatives-uk-ig.mjs sur AG ${AG_ID}.`);
