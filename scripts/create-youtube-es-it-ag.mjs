/**
 * Creates a single "YouTube" ad group on the [ES] Fanovera and [IT] Fanovera
 * campaigns. ONE ad group per campaign holding BOTH product intents — views
 * (visualizaciones/visualizzazioni) AND subscribers (suscriptores/iscritti).
 * Whitehat RSA is generic about growing your YouTube channel (covers both).
 *
 * Campaign RSAs are created PAUSED for manual policy review (fragile account).
 * Whitehat: RSA copy has NO "comprar/comprare"/quantities/"baratas/economici".
 * (Those terms live only in the KEYWORDS — the search intent we bid on.)
 *
 * Skips a campaign if it already has a YouTube ad group (no duplicates).
 *
 * Usage:
 *   node scripts/create-youtube-es-it-ag.mjs          # dry-run
 *   node scripts/create-youtube-es-it-ag.mjs --live   # execute
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

const TARGETS = {
  es: {
    campaignId: 23899357675,
    campaignName: "[ES] Fanovera",
    finalUrl: "https://www.fanovera.com/promo?lang=es",
    positives: [
      // views
      "comprar visualizaciones youtube",
      "comprar visitas youtube",
      "comprar vistas youtube",
      "comprar reproducciones youtube",
      "comprar 1000 visualizaciones youtube",
      "comprar visualizaciones youtube baratas",
      "visualizaciones youtube baratas",
      "comprar views youtube",
      "aumentar visualizaciones youtube",
      "comprar visualizaciones reales youtube",
      "mejor web para comprar visualizaciones youtube",
      // subscribers
      "comprar suscriptores youtube",
      "comprar suscriptores de youtube",
      "suscriptores youtube comprar",
      "comprar subs youtube",
      "comprar 1000 suscriptores youtube",
      "suscriptores youtube baratos",
      "comprar suscriptores youtube baratos",
      "suscriptores youtube reales",
      "aumentar suscriptores youtube",
      "comprar suscriptores para youtube",
      "comprar seguidores youtube",
      "mejor web para comprar suscriptores youtube",
    ],
    broadNegatives: [
      "gratis", "gratuito", "hack", "hackear", "truco", "trucos", "bot", "bots",
      "generador", "falsos", "falsas", "descargar", "apk", "foro", "reddit",
      "tutorial", "tutoriales", "trabajo", "agencia", "aplicacion",
      "como conseguir", "como tener", "como crecer", "que es", "por que",
      // youtube product / non-service intent
      "youtube premium", "youtube music", "youtube studio", "descargar youtube",
      "youtube gratis", "crear canal youtube", "youtube vanced", "youtube tv",
      "youtube kids", "como ganar dinero", "como monetizar", "como subir video",
      "youtube analytics",
      // competitor brands
      "famoid", "viralyft", "useviral", "media mister", "buzzoid",
    ],
    exactNegatives: [
      "contador suscriptores youtube",
      "visualizaciones youtube en vivo",
    ],
    rsa: {
      headlines: [
        "Resultados en 2 Minutos", "+8.000 Clientes Satisfechos", "Haz Crecer Tu Canal",
        "El Precio Más Bajo", "Inicio Inmediato", "-5% con el Código FANO5",
        "Fanovera - YouTube", "Entrega Rápida y Fiable",
      ],
      descriptions: [
        "Más de 8.000 clientes. Crecimiento natural y progresivo, sin contraseña, pago seguro.",
        "Haz crecer tu canal de YouTube. Seguro, rápido y fiable. Garantía de 30 días.",
        "Promociona tu canal de YouTube. Código FANO5 para un 5% en tu primer pedido.",
        "Aumenta el alcance de tu canal. Pago seguro, sin contraseña, resultados rápidos.",
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
    campaignId: 23899365073,
    campaignName: "[IT] Fanovera",
    finalUrl: "https://www.fanovera.com/promo?lang=it",
    positives: [
      // views
      "comprare visualizzazioni youtube",
      "comprare visualizzazioni su youtube",
      "visualizzazioni youtube comprare",
      "comprare views youtube",
      "comprare 1000 visualizzazioni youtube",
      "visualizzazioni youtube economiche",
      "comprare visualizzazioni youtube economiche",
      "visualizzazioni youtube reali",
      "aumentare visualizzazioni youtube",
      "comprare visite youtube",
      "miglior sito per comprare visualizzazioni youtube",
      // subscribers
      "comprare iscritti youtube",
      "comprare iscritti su youtube",
      "iscritti youtube comprare",
      "comprare subscriber youtube",
      "comprare 1000 iscritti youtube",
      "iscritti youtube economici",
      "comprare iscritti youtube economici",
      "iscritti youtube reali",
      "aumentare iscritti youtube",
      "comprare iscritti per youtube",
      "comprare follower youtube",
      "miglior sito per comprare iscritti youtube",
    ],
    broadNegatives: [
      "gratis", "gratuito", "gratuiti", "hack", "hackerare", "trucco", "trucchi",
      "bot", "bots", "generatore", "falsi", "falso", "scaricare", "apk", "forum",
      "reddit", "tutorial", "lavoro", "agenzia", "applicazione",
      "come ottenere", "come avere", "come crescere", "cos'è", "perché",
      // youtube product / non-service intent
      "youtube premium", "youtube music", "youtube studio", "scaricare youtube",
      "youtube gratis", "creare canale youtube", "youtube vanced", "youtube tv",
      "youtube kids", "come guadagnare", "come monetizzare", "come caricare video",
      "youtube analytics",
      // competitor brands
      "famoid", "viralyft", "useviral", "media mister", "buzzoid",
    ],
    exactNegatives: [
      "contatore iscritti youtube",
      "visualizzazioni youtube in diretta",
    ],
    rsa: {
      headlines: [
        "Risultati in 2 Minuti", "+8.000 Clienti Soddisfatti", "Fai Crescere il Tuo Canale",
        "Prezzo Più Basso", "Avvio Immediato", "-5% con il Codice FANO5",
        "Fanovera - YouTube", "Consegna Rapida e Sicura",
      ],
      descriptions: [
        "Più di 8.000 clienti. Crescita naturale e progressiva, senza password, pagamento sicuro.",
        "Fai crescere il tuo canale YouTube. Sicuro, veloce e affidabile. Garanzia 30 giorni.",
        "Promuovi il tuo canale YouTube. Codice FANO5 per un 5% sul primo ordine.",
        "Aumenta la portata del tuo canale. Pagamento sicuro, senza password, risultati rapidi.",
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

// ── Validate every locale config up-front (lengths + conflict guard)
for (const [loc, t] of Object.entries(TARGETS)) {
  for (const h of t.rsa.headlines) if (h.length > 30) { console.error(`[${loc}] headline too long (${h.length}): "${h}"`); process.exit(1); }
  for (const d of t.rsa.descriptions) if (d.length > 90) { console.error(`[${loc}] description too long (${d.length}): "${d}"`); process.exit(1); }
  for (const s of t.sitelinks) if (s.link_text.length > 25) { console.error(`[${loc}] sitelink too long (${s.link_text.length}): "${s.link_text}"`); process.exit(1); }
  const posSets = t.positives.map((k) => new Set(k.split(/\s+/)));
  for (const neg of t.broadNegatives) {
    const nw = neg.split(/\s+/);
    for (let i = 0; i < t.positives.length; i++) {
      if (nw.every((w) => posSets[i].has(w))) { console.error(`[${loc}] CONFLICT: BROAD negative "${neg}" blocks positive "${t.positives[i]}"`); process.exit(1); }
    }
  }
}

console.log("\n" + "═".repeat(70));
console.log(LIVE ? "▶  LIVE RUN" : "▶  DRY-RUN");
console.log("═".repeat(70));

for (const [loc, t] of Object.entries(TARGETS)) {
  console.log(`\n${t.campaignName} (${t.campaignId}) — ad group "YouTube"`);
  console.log(`  positives (EXACT): ${t.positives.length}`);
  for (const k of t.positives) console.log(`    [EXACT] ${k}`);
  console.log(`  negatives: ${t.broadNegatives.length} BROAD + ${t.exactNegatives.length} EXACT (conflict guard PASSED)`);
  console.log(`  RSA (PAUSED): ${t.rsa.headlines.length} H / ${t.rsa.descriptions.length} D · final_url ${t.finalUrl}`);
  for (const h of t.rsa.headlines) console.log(`    H(${h.length}): ${h}`);
  for (const d of t.rsa.descriptions) console.log(`    D(${d.length}): ${d}`);
  console.log(`  sitelinks: ${t.sitelinks.length}`);
}

if (!LIVE) { console.log("\nDry-run complete. Re-run with --live to execute."); process.exit(0); }

console.log("\n" + "─".repeat(70) + "\nExecuting…");
for (const [loc, t] of Object.entries(TARGETS)) {
  // anti-duplicate guard
  const existing = await customer.query(`
    SELECT ad_group.id, ad_group.name FROM ad_group
    WHERE campaign.id = ${t.campaignId} AND ad_group.name = 'YouTube' AND ad_group.status != 'REMOVED'
  `);
  if (existing.length > 0) { console.log(`\n[${loc}] YouTube ad group already exists (${existing[0].ad_group.id}) — skipping.`); continue; }

  console.log(`\n[${loc}] ${t.campaignName}`);
  const agRes = await customer.adGroups.create([{
    name: "YouTube",
    campaign: `customers/${CUSTOMER_ID}/campaigns/${t.campaignId}`,
    status: enums.AdGroupStatus.ENABLED,
    type: enums.AdGroupType.SEARCH_STANDARD,
    cpc_bid_micros: 10000,
  }]);
  const agResource = agRes.results[0].resource_name;
  console.log(`  ✓ ad group ${agResource.split("/").pop()}`);

  const criteriaOps = [
    ...t.positives.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, keyword: { text, match_type: enums.KeywordMatchType.EXACT } })),
    ...t.broadNegatives.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, negative: true, keyword: { text, match_type: enums.KeywordMatchType.BROAD } })),
    ...t.exactNegatives.map((text) => ({ ad_group: agResource, status: enums.AdGroupCriterionStatus.ENABLED, negative: true, keyword: { text, match_type: enums.KeywordMatchType.EXACT } })),
  ];
  for (let i = 0; i < criteriaOps.length; i += 100) await customer.adGroupCriteria.create(criteriaOps.slice(i, i + 100));
  console.log(`  ✓ ${criteriaOps.length} criteria`);

  await customer.adGroupAds.create([{
    ad_group: agResource,
    status: enums.AdGroupAdStatus.PAUSED,
    ad: {
      final_urls: [t.finalUrl],
      responsive_search_ad: {
        headlines: t.rsa.headlines.map((text) => ({ text })),
        descriptions: t.rsa.descriptions.map((text) => ({ text })),
      },
    },
  }]);
  console.log(`  ✓ RSA (PAUSED)`);

  const slRes = await customer.assets.create(t.sitelinks.map((s) => ({ sitelink_asset: { link_text: s.link_text }, final_urls: s.final_urls })));
  await customer.adGroupAssets.create(slRes.results.map((r) => ({ ad_group: agResource, asset: r.resource_name, field_type: enums.AssetFieldType.SITELINK })));
  console.log(`  ✓ ${t.sitelinks.length} sitelinks`);
}
console.log("\n✅ DONE. YouTube ad groups created (RSA PAUSED — enable after policy review).");
