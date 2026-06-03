/**
 * Creates ONE "Facebook" ad group on [ES] Fanovera and [IT] Fanovera — the two
 * campaigns that still lack it (CH/FR/UK/US already have one).
 *
 * Product = Facebook PAGE LIKES (me gusta / mi piace / fans), matching the FR
 * ad group and the /facebook funnel (which sells likes, not followers).
 *
 * Whitehat (fragile account, 1 strike = lifetime ban):
 *   - RSA copy is GENERIC about growing your Facebook page — NO
 *     "comprar/comprare", NO quantities, NO "baratos/economici". Those terms
 *     live ONLY in the keywords (the search intent we bid on).
 *   - RSAs are created PAUSED for manual policy review before enabling.
 *
 * Negatives are curated per language (NOT copied from the Instagram base — that
 * caused positive-blocking conflicts). A conflict guard verifies no BROAD
 * negative blocks any positive before running.
 *
 * Skips a campaign that already has a Facebook ad group (no duplicates).
 * Policy-rejected keywords are dropped & retried (NO exemption requested).
 *
 * Usage:
 *   node scripts/create-facebook-es-it-ag.mjs          # dry-run
 *   node scripts/create-facebook-es-it-ag.mjs --live   # execute
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
      "comprar me gusta facebook", "comprar me gusta en facebook",
      "comprar me gusta pagina facebook", "comprar likes facebook",
      "comprar likes pagina facebook", "comprar fans facebook",
      "comprar fans pagina facebook", "comprar 1000 me gusta facebook",
      "me gusta facebook baratos", "comprar me gusta facebook baratos",
      "me gusta facebook reales", "comprar me gusta reales facebook",
      "aumentar me gusta facebook", "conseguir me gusta facebook",
      "mejor web para comprar me gusta facebook", "promocionar pagina facebook",
    ],
    broadNegatives: [
      "gratis", "gratuito", "hack", "hackear", "truco", "trucos", "bot", "bots",
      "generador", "falsos", "falsas", "app", "aplicacion", "descargar", "foro",
      "reddit", "tutorial", "como conseguir", "como tener", "que es", "iniciar sesion",
      // Facebook product / non-service intent
      "facebook ads", "facebook marketplace", "facebook business", "facebook gaming",
      "facebook messenger", "crear cuenta facebook", "facebook lite", "meta verified",
      "facebook dating",
    ],
    exactNegatives: [],
    rsa: {
      headlines: [
        "Resultados en 2 Minutos", "+8.000 Clientes Satisfechos", "Haz Crecer Tu Facebook",
        "El Precio Más Bajo", "Inicio Inmediato", "-5% con el Código FANO5",
        "Fanovera - Facebook", "Entrega Rápida y Fiable",
      ],
      descriptions: [
        "Más de 8.000 clientes. Crecimiento natural y progresivo, sin contraseña, pago seguro.",
        "Haz crecer tu página de Facebook. Seguro, rápido y fiable. Garantía de 30 días.",
        "Promociona tu página de Facebook. Código FANO5 para un 5% en tu primer pedido.",
        "Aumenta el alcance de tu página. Pago seguro, sin contraseña, resultados rápidos.",
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
      "comprare mi piace facebook", "comprare mi piace su facebook",
      "comprare mi piace pagina facebook", "comprare like facebook",
      "comprare like pagina facebook", "comprare fan facebook",
      "comprare fan pagina facebook", "comprare 1000 mi piace facebook",
      "mi piace facebook economici", "comprare mi piace facebook economici",
      "mi piace facebook reali", "comprare mi piace reali facebook",
      "aumentare mi piace facebook", "ottenere mi piace facebook",
      "miglior sito per comprare mi piace facebook", "promuovere pagina facebook",
    ],
    broadNegatives: [
      "gratis", "gratuito", "gratuiti", "hack", "hackerare", "trucco", "trucchi",
      "bot", "bots", "generatore", "falsi", "falso", "app", "applicazione",
      "scaricare", "forum", "reddit", "tutorial", "come ottenere", "come avere",
      "cos'è", "accedi",
      // Facebook product / non-service intent
      "facebook ads", "facebook marketplace", "facebook business", "facebook gaming",
      "facebook messenger", "creare account facebook", "facebook lite", "meta verified",
      "facebook dating",
    ],
    exactNegatives: [],
    rsa: {
      headlines: [
        "Risultati in 2 Minuti", "+8.000 Clienti Soddisfatti", "Fai Crescere la Tua Pagina",
        "Prezzo Più Basso", "Avvio Immediato", "-5% con il Codice FANO5",
        "Fanovera - Facebook", "Consegna Rapida e Sicura",
      ],
      descriptions: [
        "Più di 8.000 clienti. Crescita naturale e progressiva, senza password, pagamento sicuro.",
        "Fai crescere la tua pagina Facebook. Sicuro, veloce e affidabile. Garanzia 30 giorni.",
        "Promuovi la tua pagina Facebook. Codice FANO5 per un 5% sul primo ordine.",
        "Aumenta la portata della tua pagina. Pagamento sicuro, senza password, risultati rapidi.",
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

// ── Validate copy lengths + conflict guard + whitehat guard up-front ─────────
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
  console.log(`\n${t.campaignName} (${t.campaignId}) — ad group "Facebook" [${t.lang}]`);
  console.log(`  positives (EXACT): ${c.positives.length}`);
  for (const k of c.positives) console.log(`    [EXACT] ${k}`);
  console.log(`  negatives: ${c.broadNegatives.length} BROAD (conflict guard PASSED)`);
  console.log(`  RSA (PAUSED): ${c.rsa.headlines.length} H / ${c.rsa.descriptions.length} D · final_url ${c.finalUrl}`);
  console.log(`  sitelinks: ${c.sitelinks.length} at ad-group level`);
}

if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

// Submit criteria atomically; if Google rejects keyword(s) on policy grounds,
// DROP the rejected text(s) and retry (NO exemption requested — fragile account).
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
    WHERE campaign.id = ${t.campaignId} AND ad_group.name = 'Facebook' AND ad_group.status != 'REMOVED'
  `);
  if (existing.length > 0) { console.log(`\n[${t.code}] Facebook ad group already exists (${existing[0].ad_group.id}) — skipping.`); continue; }

  console.log(`\n[${t.code}] ${t.campaignName}`);
  const agRes = await customer.adGroups.create([{
    name: "Facebook",
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
console.log("\n✅ DONE. Facebook ad groups created (RSA PAUSED — enable after policy review).");
if (SKIPPED_ALL.length) {
  console.log(`\n⚠ ${SKIPPED_ALL.length} keyword(s) skipped on Google policy (NOT added, no exemption requested):`);
  for (const s of SKIPPED_ALL) console.log(`   - ${s}`);
}
