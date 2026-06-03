/**
 * Creates ONE "Instagram" ad group on [ES] Fanovera and [IT] Fanovera — the two
 * campaigns that still lack it (CH/FR/UK/US already have one).
 *
 * Product = Instagram FOLLOWERS (seguidores / follower), matching the existing
 * FR/UK Instagram ad groups.
 *
 * Whitehat (fragile account, 1 strike = lifetime ban):
 *   - RSA copy is GENERIC about growing your Instagram — NO "comprar/comprare",
 *     NO quantities, NO "baratos/economici". Those terms live ONLY in keywords.
 *   - RSAs are created PAUSED for manual policy review before enabling.
 *
 * Negatives curated per language (NOT copied from the IG base — avoids the
 * positive-blocking conflicts). Conflict guard runs before any mutation.
 * Skips a campaign that already has an Instagram ad group. Policy-rejected
 * keywords are dropped & retried (NO exemption requested).
 *
 * NOTE: the existing CH/FR/UK/US Instagram ad groups are PAUSED at AD-GROUP
 * level. These new ones are created ENABLED with RSA PAUSED (same convention as
 * the Facebook/LinkedIn launches) — align manually if you want parity.
 *
 * Usage:
 *   node scripts/create-instagram-es-it-ag.mjs          # dry-run
 *   node scripts/create-instagram-es-it-ag.mjs --live   # execute
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

const LANG = {
  es: {
    finalUrl: "https://www.fanovera.com/promo?lang=es",
    positives: [
      "comprar seguidores instagram", "comprar seguidores de instagram",
      "comprar seguidores en instagram", "seguidores instagram comprar",
      "comprar seguidores insta", "comprar followers instagram",
      "comprar follower instagram", "comprar 1000 seguidores instagram",
      "comprar 100 seguidores instagram", "seguidores instagram baratos",
      "comprar seguidores instagram baratos", "seguidores instagram reales",
      "comprar seguidores reales instagram", "aumentar seguidores instagram",
      "conseguir seguidores instagram", "comprar seguidores españoles instagram",
      "mejor web para comprar seguidores instagram", "comprar seguidores perfil instagram",
    ],
    broadNegatives: [
      "gratis", "gratuito", "hack", "hackear", "truco", "trucos", "bot", "bots",
      "generador", "falsos", "falsas", "app", "aplicacion", "descargar", "foro",
      "reddit", "tutorial", "como conseguir", "como tener", "que es", "iniciar sesion",
      // Instagram product / non-service intent
      "instagram ads", "instagram reels", "instagram story", "crear cuenta instagram",
      "descargar instagram", "instagram lite", "quien visito mi instagram",
      "ver perfil privado instagram",
    ],
    exactNegatives: [],
    rsa: {
      headlines: [
        "Resultados en 2 Minutos", "+8.000 Clientes Satisfechos", "Haz Crecer Tu Instagram",
        "El Precio Más Bajo", "Inicio Inmediato", "-5% con el Código FANO5",
        "Fanovera - Instagram", "Entrega Rápida y Fiable",
      ],
      descriptions: [
        "Más de 8.000 clientes. Crecimiento natural y progresivo, sin contraseña, pago seguro.",
        "Haz crecer tu perfil de Instagram. Seguro, rápido y fiable. Garantía de 30 días.",
        "Promociona tu Instagram. Código FANO5 para un 5% en tu primer pedido.",
        "Aumenta tu alcance en Instagram. Pago seguro, sin contraseña, resultados rápidos.",
      ],
    },
    sitelinks: [
      { link_text: "Opiniones de Clientes", final_urls: ["https://www.fanovera.com/promo?lang=es#proof"] },
      { link_text: "Cómo Funciona", final_urls: ["https://www.fanovera.com/promo?lang=es#how"] },
      { link_text: "Contacto", final_urls: ["https://www.fanovera.com/contact"] },
      { link_text: "Seguimiento de Pedido", final_urls: ["https://www.fanovera.com/track"] },
      { link_text: "Preguntas Frecuentes", final_urls: ["https://www.fanovera.com/#faq"] },
    ],
  },

  it: {
    finalUrl: "https://www.fanovera.com/promo?lang=it",
    positives: [
      "comprare follower instagram", "comprare follower su instagram",
      "follower instagram comprare", "comprare follower insta",
      "comprare seguaci instagram", "comprare followers instagram",
      "comprare 1000 follower instagram", "comprare 100 follower instagram",
      "follower instagram economici", "comprare follower instagram economici",
      "follower instagram reali", "comprare follower reali instagram",
      "aumentare follower instagram", "ottenere follower instagram",
      "comprare follower italiani instagram", "miglior sito per comprare follower instagram",
      "comprare follower profilo instagram",
    ],
    broadNegatives: [
      "gratis", "gratuito", "gratuiti", "hack", "hackerare", "trucco", "trucchi",
      "bot", "bots", "generatore", "falsi", "falso", "app", "applicazione",
      "scaricare", "forum", "reddit", "tutorial", "come ottenere", "come avere",
      "cos'è", "accedi",
      // Instagram product / non-service intent
      "instagram ads", "instagram reels", "instagram storie", "creare account instagram",
      "scaricare instagram", "instagram lite", "chi visita il mio instagram",
      "profilo privato instagram",
    ],
    exactNegatives: [],
    rsa: {
      headlines: [
        "Risultati in 2 Minuti", "+8.000 Clienti Soddisfatti", "Fai Crescere il Tuo Instagram",
        "Prezzo Più Basso", "Avvio Immediato", "-5% con il Codice FANO5",
        "Fanovera - Instagram", "Consegna Rapida e Sicura",
      ],
      descriptions: [
        "Più di 8.000 clienti. Crescita naturale e progressiva, senza password, pagamento sicuro.",
        "Fai crescere il tuo profilo Instagram. Sicuro, veloce e affidabile. Garanzia 30 giorni.",
        "Promuovi il tuo Instagram. Codice FANO5 per un 5% sul primo ordine.",
        "Aumenta la tua portata su Instagram. Pagamento sicuro, senza password, risultati rapidi.",
      ],
    },
    sitelinks: [
      { link_text: "Recensioni dei Clienti", final_urls: ["https://www.fanovera.com/promo?lang=it#proof"] },
      { link_text: "Come Funziona", final_urls: ["https://www.fanovera.com/promo?lang=it#how"] },
      { link_text: "Contattaci", final_urls: ["https://www.fanovera.com/contact"] },
      { link_text: "Traccia il Tuo Ordine", final_urls: ["https://www.fanovera.com/track"] },
      { link_text: "Domande Frequenti", final_urls: ["https://www.fanovera.com/#faq"] },
    ],
  },
};

const TARGETS = [
  { code: "ES", campaignId: 23899357675, campaignName: "[ES] Fanovera", lang: "es" },
  { code: "IT", campaignId: 23899365073, campaignName: "[IT] Fanovera", lang: "it" },
];

for (const [lang, c] of Object.entries(LANG)) {
  for (const h of c.rsa.headlines) if (h.length > 30) { console.error(`[${lang}] headline too long (${h.length}): "${h}"`); process.exit(1); }
  for (const d of c.rsa.descriptions) if (d.length > 90) { console.error(`[${lang}] description too long (${d.length}): "${d}"`); process.exit(1); }
  for (const s of c.sitelinks) if (s.link_text.length > 25) { console.error(`[${lang}] sitelink too long (${s.link_text.length}): "${s.link_text}"`); process.exit(1); }
  const posSets = c.positives.map((k) => new Set(k.split(/\s+/)));
  for (const neg of c.broadNegatives) {
    const nw = neg.split(/\s+/);
    for (let i = 0; i < c.positives.length; i++) {
      if (nw.every((w) => posSets[i].has(w))) { console.error(`[${lang}] CONFLICT: BROAD negative "${neg}" blocks positive "${c.positives[i]}"`); process.exit(1); }
    }
  }
  const FORBIDDEN = /\b(buy|acheter|achat|comprar|comprare|cheap|baratos?|economic[io]|pas cher)\b/i;
  for (const t of [...c.rsa.headlines, ...c.rsa.descriptions])
    if (FORBIDDEN.test(t)) { console.error(`[${lang}] WHITEHAT VIOLATION in RSA copy: "${t}"`); process.exit(1); }
}

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));

for (const t of TARGETS) {
  const c = LANG[t.lang];
  console.log(`\n${t.campaignName} (${t.campaignId}) — ad group "Instagram" [${t.lang}]`);
  console.log(`  positives (EXACT): ${c.positives.length}`);
  for (const k of c.positives) console.log(`    [EXACT] ${k}`);
  console.log(`  negatives: ${c.broadNegatives.length} BROAD (conflict guard PASSED)`);
  console.log(`  RSA (PAUSED): ${c.rsa.headlines.length} H / ${c.rsa.descriptions.length} D · final_url ${c.finalUrl}`);
  console.log(`  sitelinks: ${c.sitelinks.length} at ad-group level`);
}

if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

async function createCriteriaWithPolicyRetry(agResource, c) {
  const skipped = [];
  let positives = [...c.positives];
  let broadN = [...c.broadNegatives];
  let exactN = [...c.exactNegatives];
  for (;;) {
    const ops = [
      ...positives.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, keyword: { text, match_type: enums.KeywordMatchType.EXACT } })),
      ...broadN.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, negative: true, keyword: { text, match_type: enums.KeywordMatchType.BROAD } })),
      ...exactN.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, negative: true, keyword: { text, match_type: enums.KeywordMatchType.EXACT } })),
    ];
    try {
      for (let i = 0; i < ops.length; i += 100) await customer.adGroupCriteria.create(ops.slice(i, i + 100));
      return { created: ops.length, skipped };
    } catch (err) {
      const viol = (err?.errors || [])
        .filter((e) => e?.error_code?.policy_violation_error != null && e?.trigger?.string_value)
        .map((e) => e.trigger.string_value);
      if (viol.length === 0) throw err;
      for (const vt of viol) {
        if (!skipped.includes(vt)) skipped.push(vt);
        positives = positives.filter((t) => t !== vt);
        broadN = broadN.filter((t) => t !== vt);
        exactN = exactN.filter((t) => t !== vt);
      }
      console.log(`    ⚠ policy-rejected, dropped & retrying: ${viol.join(", ")}`);
    }
  }
}

console.log("\n" + "─".repeat(70) + "\nExecuting…");
const SKIPPED_ALL = [];
for (const t of TARGETS) {
  const c = LANG[t.lang];

  const existing = await customer.query(`
    SELECT ad_group.id, ad_group.name FROM ad_group
    WHERE campaign.id = ${t.campaignId} AND ad_group.name = 'Instagram' AND ad_group.status != 'REMOVED'
  `);
  if (existing.length > 0) { console.log(`\n[${t.code}] Instagram ad group already exists (${existing[0].ad_group.id}) — skipping.`); continue; }

  console.log(`\n[${t.code}] ${t.campaignName}`);
  const agRes = await customer.adGroups.create([{
    name: "Instagram",
    campaign: `customers/${CUSTOMER_ID}/campaigns/${t.campaignId}`,
    status: enums.AdGroupStatus.ENABLED,
    type: enums.AdGroupType.SEARCH_STANDARD,
    cpc_bid_micros: 10000,
  }]);
  const agResource = agRes.results[0].resource_name;
  console.log(`  ✓ ad group ${agResource.split("/").pop()}`);

  const { created, skipped } = await createCriteriaWithPolicyRetry(agResource, c);
  console.log(`  ✓ ${created} criteria${skipped.length ? ` (${skipped.length} skipped on policy)` : ""}`);
  if (skipped.length) SKIPPED_ALL.push(...skipped.map((kw) => `[${t.code}] ${kw}`));

  await customer.adGroupAds.create([{
    ad_group: agResource,
    status: enums.AdGroupAdStatus.PAUSED,
    ad: {
      final_urls: [c.finalUrl],
      responsive_search_ad: {
        headlines: c.rsa.headlines.map((text) => ({ text })),
        descriptions: c.rsa.descriptions.map((text) => ({ text })),
      },
    },
  }]);
  console.log(`  ✓ RSA (PAUSED)`);

  const slRes = await customer.assets.create(c.sitelinks.map((s) => ({ sitelink_asset: { link_text: s.link_text }, final_urls: s.final_urls })));
  await customer.adGroupAssets.create(slRes.results.map((r) => ({ ad_group: agResource, asset: r.resource_name, field_type: enums.AssetFieldType.SITELINK })));
  console.log(`  ✓ ${c.sitelinks.length} sitelinks`);
}
console.log("\n✅ DONE. Instagram ad groups created (RSA PAUSED — enable after policy review).");
if (SKIPPED_ALL.length) {
  console.log(`\n⚠ ${SKIPPED_ALL.length} keyword(s) skipped on Google policy (NOT added, no exemption requested):`);
  for (const s of SKIPPED_ALL) console.log(`   - ${s}`);
}
